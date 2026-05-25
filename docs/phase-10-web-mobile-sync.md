Phase 10 — Web / Mobil Senkronizasyonu
========================================

Bu doküman, web platformunda tamamlanan iki büyük geliştirmenin mobil
uygulamaya taşınması ve iki platform arasındaki farkın kapatılması için
gereken tüm değişiklikleri detaylandırır.

Kapsanan web geliştirmeleri:
  1. Müşteri / Temsilci Ayrıştırması (MT-1–MT-16) — docs/musteri-temsilci-fazi.md
  2. Granüler Yetkilendirme Sistemi (F32)         — docs/phase-9-permissions.md

Mobilde MT-15 kapsamında "minimum uyumluluk" sağlandı; bu faz eksik kalan
tam yönetim özelliklerini ve yetkilendirme entegrasyonunu tamamlar.

Ön koşul: Hem MT-16 hem F32 web üzerinde MERGE edilmiş olmalıdır.
Backend değişikliği yoktur; tüm API uç noktaları hazır ve belgelenmiştir.

==============================
DEĞİŞİKLİĞİN ÖZETİ
==============================

Mevcut Durum (As-Is):
  Müşteri/Temsilci:
    - Mobilin CustomerForm ayrı firma + temsilci yaratıyor (MT-15 ✅).
    - CustomerProfileScroll yalnızca primaryContact'ı başlıkta gösteriyor;
      tam temsilci listesi, ekleme/düzenleme/silme yok.
    - OpportunityForm sadece firma seçiyor, contactId API'ye gönderilmiyor.
    - CustomerSelectInput tek katmanlı (yalnızca firma); contact seçim
      adımı yok.
  Yetkilendirme:
    - Mobilde hiçbir izin kontrolü yok.
    - Raporlar ve AI Analiz sekmeleri tüm kullanıcılara açık.
    - CRUD butonları yetkiden bağımsız herkese görünüyor.

Hedef Durum (To-Be):
  Müşteri/Temsilci:
    - CustomerProfileScroll: tam temsilci yönetimi (liste + ekle/düzenle/sil).
    - OpportunityForm: iki katmanlı seçim (firma → temsilci); contactId
      fırsata yazılır, kartvizit temsilciye kaydedilir.
    - Dublike temsilci 409 uyarısı mobilde de akıcı kullanıcı deneyimi sunar.
  Yetkilendirme:
    - /permissions/me endpoint'i login sonrası önbelleğe alınır.
    - Raporlar sekmesi yalnızca ilgili raportör yetkisine sahip kullanıcılara
      görünür; rapor kataloğu yetkili slug'lara göre filtrelenir.
    - AI Analiz sekmesi yalnızca ai_analyst yetkisine sahiplere açık.
    - CRUD butonları (Düzenle/Sil/Ekle) kullanıcının
      content_editor/content_manager iznine göre gösterilir veya gizlenir.

==============================
ETKİLENEN DOSYALAR — TAM LİSTE
==============================

Shared (packages/shared):
  DEĞIŞMEZ — tüm tipler ve şemalar MT & F32 kapsamında hazır.

Mobile — Hooks (apps/mobile/hooks/):
  YENİ:
    - use-permissions.ts            (GET /permissions/me)
  DEĞIŞEN:
    - use-customer-contacts.ts      (useDeleteCustomerContact invalidation
                                     zenginleştirmesi; opp. cache)

Mobile — Stores (apps/mobile/stores/):
  DEĞIŞEN:
    - auth-store.ts                 (permissions state + fetchPermissions)

Mobile — Bileşenler (apps/mobile/components/):
  YENİ:
    - customer/CustomerContactEditSheet.tsx
  DEĞIŞEN:
    - customer/CustomerProfileScroll.tsx  (Temsilciler bölümü)
    - customer/CustomerSelectInput.tsx    (iki katmanlı seçim)
    - opportunity/OpportunityForm.tsx     (contactId + kartvizit→contact)
    - opportunity/OpportunityCard.tsx     (CRUD izin kontrolleri)
    - layout/DrawerContent.tsx           (permissions-aware render)

Mobile — Sayfalar (apps/mobile/app/):
  DEĞIŞEN:
    - (drawer)/(tabs)/_layout.tsx    (sekme görünürlük kontrolleri)
    - (drawer)/(tabs)/reports.tsx    (izinli rapor kataloğu + dashboard)
    - (drawer)/(tabs)/chat.tsx       (ai_analyst guard)

==============================
VERİ MODELİ REFERANSI (HATIRLATICI)
==============================

CustomerContact (webde MT-2 ile eklendi, backend hazır):
  id, customerId, name, phone?, email?, cardImage?,
  createdAt, updatedAt

Opportunity.contactId: String? (opsiyonel, onDelete: SetNull)

EffectivePermissions (@crm/shared, F32 ile tanımlandı):
  content_editor, content_manager, sales_reporter,
  manager_reporter, ai_analyst

POST /customers/:customerId/contacts?force=false|true
  → 409 + { details: { duplicateOf: { id, name, phone, email } } }
  → force=true ile yine de ekler

GET /permissions/me
  → { permissions: string[], allowedReportSlugs: string[] }

==============================
FEATURE LİSTESİ — GRUP A: MÜŞTERİ/TEMSİLCİ TAM YÖNETİM (MM)
==============================

Her MM ayrı bir feature/MM{n}-* dalında geliştirilir.

----------------------------------------------------------------------
MM-1 — CustomerContactEditSheet (Yeni Bileşen)
----------------------------------------------------------------------

Amaç: Mobilde temsilci eklemek ve düzenlemek için yeniden kullanılabilir
bir BottomSheet bileşeni oluşturmak.

Web referansı: components/customer/CustomerContactEditModal.tsx (MT-8)

Yapılacaklar:

1. apps/mobile/components/customer/CustomerContactEditSheet.tsx (YENİ):
   Props:
     visible: boolean
     customerId: string
     initial?: CustomerContact | null   (null → yeni ekleme modu)
     onClose: () => void
     onContactSelected?: (contact: CustomerContact) => void
       (OpportunityForm'dan çağrıldığında: "Mevcut Temsilciyi Seç" akışı)

   Form alanları:
     - Ad Soyad (zorunlu)
     - Telefon (phone-pad)
     - E-posta (email-address)
     - Kartvizit Fotoğrafı (opsiyonel):
         * Kamera veya galeri seçimi
         * OCR mevcut useBusinessCardOcr hook'uyla
         * Parsed company adı sabit firmadan farklıysa bilgi toast'u:
           "Kartvizitteki firma: {company}. Bu temsilci {customerCompany}
            firmasına eklenecek."

   Submit akışı:
     Yeni ekleme: useCreateCustomerContact(customerId).mutateAsync(dto)
     Düzenleme:   useUpdateCustomerContact().mutateAsync({ id, dto, customerId })

   Dublike 409 akışı (sadece yeni ekleme):
     - API 409 dönerse → Alert.alert üç seçenekle:
         "İptal"              → formu kapat
         "Mevcut Temsilciyi Seç" → onContactSelected?.(duplicateOf) ve kapat
         "Yine de Ekle"       → force=true ile yeniden dene
     - duplicateOf bilgisi: error.response.data.details.duplicateOf

   Validasyon:
     - name boşsa hata: "Ad soyad zorunludur"
     - submit öncesi createCustomerContactSchema (zaten @crm/shared'da)

2. apps/mobile/hooks/use-customer-contacts.ts (güncelle):
   useDeleteCustomerContact onSuccess:
     - opportunities cache'lerini de invalidate et
       (queryKeys.opportunities.byFair → tüm fair listelerinin contact
        bilgisi güncel kalsın)
     - queryKeys.fairs.all da invalidate et.

Etkilenen dosyalar:
  YENİ:    components/customer/CustomerContactEditSheet.tsx
  DEĞIŞEN: hooks/use-customer-contacts.ts

Bağımlılık: MT-15 tamamlandı (hook ve tipler hazır)
Commit:
  feat(mobile): add CustomerContactEditSheet with duplicate 409 handling

Durum: [x]

----------------------------------------------------------------------
MM-2 — CustomerProfileScroll — Temsilciler Bölümü
----------------------------------------------------------------------

Amaç: Müşteri profil ekranına tam temsilci yönetimi bölümü eklemek.

Web referansı: MT-13 (apps/web/src/app/(dashboard)/customers/[id]/page.tsx +
               components/customer/CustomerContactList.tsx)

Mevcut durum: CustomerProfileScroll sadece primaryContact'ı başlık
kısmında gösteriyor; listeleme ve CRUD yok.

Yapılacaklar:

1. apps/mobile/components/customer/CustomerProfileScroll.tsx (güncelle):
   Başlık bölümü (mevcut):
     - company adı + primaryContact?.name kısmı korunur
     - cardImage artık primaryContact?.cardImage kaynağı — zaten doğru

   YENİ Bölüm — "Temsilciler (N)" (KPI bloğundan ÖNCE):
     - useCustomerContacts(customerId) ile tüm contacts çekilir
     - Her temsilci için satır:
         * Ad Soyad (bold) + Telefon (tıklanabilir tel:) + E-posta (mailto:)
         * Kartvizit küçük thumbnail (varsa, Image 44x44)
         * Sağda: ✏️ ve 🗑 Pressable butonları
             ✏️ → CustomerContactEditSheet (initial=contact)
             🗑 → Alert onay:
                  "N fırsata bağlı temsilciyi sil?" (N hesaplanır: profile
                  opportunityTimeline.filter(o => o.contact?.id === c.id).length)
                  Onay → useDeleteCustomerContact.mutate({id, customerId})
     - Liste sonu: dashed "+ Temsilci Ekle" Pressable:
         CustomerContactEditSheet (initial=null)
     - Boş durum: "Henüz temsilci eklenmemiş. Fuar kartvizitlerinden
       ekleyebilirsiniz."

   CustomerContactEditSheet'i import et ve state yönet:
     const [contactSheet, setContactSheet] =
       useState<{ visible: boolean; initial: CustomerContact | null }>

   Not: KPI, Bekleyen, Timeline, Notlar bölümleri değişmez.

Etkilenen dosyalar:
  DEĞIŞEN: components/customer/CustomerProfileScroll.tsx

Bağımlılık: MM-1 (CustomerContactEditSheet hazır)
Commit:
  feat(mobile): contacts management section in CustomerProfileScroll

Durum: [x]

----------------------------------------------------------------------
MM-3 — OpportunityForm — İki Katmanlı Seçim + contactId
----------------------------------------------------------------------

Amaç: Fırsat formuna "firma seç → temsilci seç" iki adımlı akışını
eklemek; contactId fırsata, kartvizit temsilciye yazmak.

Web referansı: MT-9 + MT-10 (CustomerSelectInput.tsx refactor +
               OpportunityFormModal.tsx güncelleme)

Mevcut durum: OpportunityForm yalnızca selectedCustomer seçiyor; contactId
payload'a eklenmiyor; OCR çıktısı eski hatalı şekilde customer'a yazılıyor.

Yapılacaklar:

1. apps/mobile/components/customer/CustomerSelectInput.tsx (güncelle):
   Mevcut props korunur + yeni:
     selectedContact: CustomerContact | null
     onSelectContact: (c: CustomerContact | null) => void

   Davranış:
   A) Firma seçilmemiş → mevcut arama + "Yeni Müşteri Ekle" akışı.

   B) Firma seçildi → temsilci seçim aşaması gösterilir:
      - Başlıkta seçili firma adı + sağda "Değiştir" linki (sıfırlar)
      - useCustomerContacts(selectedCustomer.id) ile liste
      - Her satır: ad + telefon + e-posta; tıklanınca seçilir
      - "Temsilcisiz devam" sarı bilgi satırı (Pressable; contact = null)
      - "+ Yeni Temsilci Ekle" Pressable:
          * CustomerContactEditSheet (initial=null, customerId=firm.id)
          * onContactSelected → otomatik onSelectContact çağrısı
      - İsLoading state'i

   C) Hem firma hem temsilci seçiliyse:
      - Firma adı (bold) + temsilci adı (alt satır)
      - "Değiştir" linki her şeyi sıfırlar

2. apps/mobile/components/opportunity/OpportunityForm.tsx (güncelle):
   State ekle:
     selectedContact: CustomerContact | null

   useEffect(initial):
     selectedContact = initial?.contact ?? null
     cardImage = initial?.contact?.cardImage ?? ''

   CustomerSelectInput'a geçilen yeni prop'lar:
     selectedContact, onSelectContact={setSelectedCustomer}

   Kartvizit bölümü:
     - selectedContact yoksa: "Önce bir temsilci seçin" mesajı göster
       (Pressable devre dışı)
     - selectedContact varsa: mevcut resim/tarama arayüzü

   handleSubmit:
     opportunityDto.contactId = selectedContact?.id ?? null
     Kartvizit değiştiyse:
       selectedContact && initial?.contact?.id === selectedContact.id
       → updateContact.mutateAsync({ id: selectedContact.id, dto: { cardImage } })
       Yeni fırsat veya contact değiştiyse → updateContact çağrılmaz;
       OCR akışı zaten kartviziti contact'a upload eder.

   OCR akışı (pickImageAndRunOcr):
     - ocrResult.url → setCardImage (yerel önizleme)
     - Eğer selectedContact varsa → updateContact.mutateAsync ile anında yaz
       (web MT-10 ile aynı davranış)
     - setSelectedCustomer((prev) => prev ? { ...prev } : null)
       (eskisi customer.cardImage'i güncelliyordu — bu kaldırılır)

3. Validasyon:
   - isValid: !!selectedCustomer (contact opsiyonel — mevcut davranış)

Etkilenen dosyalar:
  DEĞIŞEN: components/customer/CustomerSelectInput.tsx,
           components/opportunity/OpportunityForm.tsx

Bağımlılık: MM-1 (CustomerContactEditSheet, CustomerSelectInput içinde açılır)
Commit:
  feat(mobile): two-step customer+contact picker in OpportunityForm
  feat(mobile): wire contactId to opportunity; card image → contact

Durum: [x]

----------------------------------------------------------------------
MM-4 — CustomerForm — OCR Firma Pivot
----------------------------------------------------------------------

Amaç: Kartvizit taraması sırasında OCR'dan dönen firma adı mevcut bir
Customer ile eşleşiyorsa yeni Customer açmak yerine mevcut firmaya
temsilci eklemek.

Web referansı: MT-9 B adımı — "Kartvizitteki firma farklıysa bilgi rozeti"
              ve A adımı — "OCR çıktısı mevcut Customer'a pivot"

Mevcut durum: CustomerForm.tsx OCR sonrası doğrudan tüm alanları
doldurur; firma eşleşme kontrolü yoktur.

Yapılacaklar:

1. apps/mobile/components/customer/CustomerForm.tsx (güncelle):
   pickImageAndRunOcr sonrası:
     a) useCustomers(ocrResult.parsed.company) ile eşleşme ara
        (debounce gereksiz — zaten OCR bitince tek sorgudur).
        Eşleşme: company.toLowerCase() === parsed.company.trim().toLowerCase()
     b) Eşleşen Customer bulunursa Alert:
          "Bu firma zaten kayıtlı: {existingCompany}
           Mevcut firmaya yeni temsilci mi eklemek istersiniz?"
          [Mevcut Firmaya Ekle] [Yeni Firma Olarak Ekle]
        "Mevcut Firmaya Ekle":
          - CustomerForm kapat
          - CustomerContactEditSheet'i doğrudan aç (customerId=existing.id,
            initial=null, name/phone/email=ocrResult.parsed fields ile dolu)
          - Bu akış için bir callback prop'u gereklidir:
              onPivotToExistingCustomer?: (customerId: string, parsedContact: {...}) => void
          - Alternatif: useCustomerFormStore'a pivotContact state ekle
        "Yeni Firma Olarak Ekle": mevcut davranış devam eder.
     c) Eşleşme yoksa: mevcut davranış devam eder.

2. Pivot akışını tetiklemek için bir mekanizma gereklidir.
   Öneri: useCustomerFormStore'a aşağıdakileri ekle:
     pivotContact: { customerId: string; name: string; phone: string;
                     email: string; cardImage: string | null } | null
     setPivotContact: (data) => void
     clearPivotContact: () => void
   Fuar detay ekranı (fairs/[id].tsx) bu store'u dinler ve pivot
   durumunda CustomerContactEditSheet'i açar.

Etkilenen dosyalar:
  DEĞIŞEN: components/customer/CustomerForm.tsx,
           stores/customer-form-store.ts (pivot state),
           app/(drawer)/(tabs)/fairs/[id].tsx (pivot dinleyici)

Bağımlılık: MM-1 (CustomerContactEditSheet)
Commit:
  feat(mobile): OCR company pivot — redirect to existing customer contacts

Durum: [x]

----------------------------------------------------------------------
MM-5 — CustomerListCard — Temsilci Sayısı Rozeti
----------------------------------------------------------------------

Amaç: Müşteri liste kartında kişi adı yerine temsilci sayısı + baş
temsilci özeti göstermek.

Web referansı: MT-12 (components/customer/CustomerListCard.tsx)

Mevcut durum: CustomerListCard.tsx customer.primaryContact?.name gösteriyor;
contactCount kullanılmıyor.

Yapılacaklar:

1. apps/mobile/components/customer/CustomerListCard.tsx (güncelle):
   Mevcut satır:
     {customer.primaryContact?.name ?? `${customer.contactCount ?? 0} temsilci`}
   → Zaten doğru (MT-15'te güncellendi). Kontrol et; gerekirse:
     - primaryContact varsa: "{primaryContact.name}" (mevcut)
     - primaryContact yoksa: "{contactCount} temsilci" (mevcut)
   Ek iyileştirme:
     - contactCount > 1 ise: "{primaryContact.name} +{contactCount-1}" formatı

   Bu özellik küçüktür; MM-2 ile aynı branch'te teslim edilebilir.

Etkilenen dosyalar:
  DEĞIŞEN: components/customer/CustomerListCard.tsx

Bağımlılık: yok (veri zaten CustomerListItem'da mevcut)
Commit:
  refactor(mobile): customer list card shows contactCount badge

Durum: [x]

==============================
FEATURE LİSTESİ — GRUP B: YETKİLENDİRME MOBİL ENTEGRASYONu (MP)
==============================

Her MP ayrı bir feature/MP{n}-* dalında geliştirilir.

----------------------------------------------------------------------
MP-1 — use-permissions Hook + AuthStore İzin Önbelleği
----------------------------------------------------------------------

Amaç: Oturum açmış kullanıcının etkin izinlerini çekmek ve tüm
bileşenlerden erişilebilir kılmak.

Web referansı: F32 — hooks/use-permissions.ts + auth-store.ts entegrasyonu

Yapılacaklar:

1. apps/mobile/hooks/use-permissions.ts (YENİ):
   import { useQuery } from '@tanstack/react-query';
   import type { EffectivePermissions } from '@crm/shared';
   import api from '@/lib/api';
   import { useAuthStore } from '@/stores/auth-store';

   export function usePermissions() {
     const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
     return useQuery({
       queryKey: ['permissions', 'me'],
       queryFn: async () => {
         const { data } = await api.get<ApiSuccessResponse<{
           permissions: string[];
           allowedReportSlugs: string[];
         }>>('/permissions/me');
         return data.data;
       },
       enabled: isAuthenticated,
       staleTime: 5 * 60 * 1000,   // 5 dakika
       gcTime: 10 * 60 * 1000,
     });
   }

   export function useHasPermission(permission: string): boolean {
     const { data } = usePermissions();
     return data?.permissions.includes(permission) ?? false;
   }

   export function useAllowedReportSlugs(): string[] {
     const { data } = usePermissions();
     return data?.allowedReportSlugs ?? [];
   }

2. apps/mobile/stores/auth-store.ts (güncelle):
   - Yeni state: permissions: string[] | null
   - Login başarısı sonrası veya hydrate sonrası:
       PermissionService'i doğrudan çağırmak yerine TanStack Query
       önbelleği kullanılır (use-permissions hook). auth-store'da
       permissions tutulması gerekmez; hook yeterlidir.
   - Logout: queryClient.clear() zaten permissions cache'ini siler.
     İlk logout'ta açık kalma ihtimaline karşı:
       queryClient.removeQueries({ queryKey: ['permissions'] })
   - Bu nedenle auth-store değişikliği minimal: forceLogout ve logout
     metodlarında query client temizleme eklenir (eğer provider'a erişim
     yoksa ZustandQueryClient wrapper üzerinden yapılır).

3. apps/mobile/lib/query-keys.ts (güncelle):
   permissions: {
     me: ['permissions', 'me'] as const,
   }

Etkilenen dosyalar:
  YENİ:    hooks/use-permissions.ts
  DEĞIŞEN: stores/auth-store.ts (minimal — logout cleanup),
           lib/query-keys.ts

Bağımlılık: F32 backend hazır (/permissions/me endpoint)
Commit:
  feat(mobile): add use-permissions hook with staleTime cache

Durum: [x]

----------------------------------------------------------------------
MP-2 — Tab Navigasyon İzin Kontrolleri
----------------------------------------------------------------------

Amaç: Raporlar ve AI Analiz sekmelerini ilgili izne sahip olmayan
kullanıcılardan gizlemek veya erişime kapatmak.

Web referansı: F32 — nav.ts güncelleme + sayfa guard'ları

Mevcut durum: Tüm sekmeler tüm authenticated kullanıcılara görünüyor.

Yapılacaklar:

1. apps/mobile/app/(drawer)/(tabs)/_layout.tsx (güncelle):
   - usePermissions() ile izinleri çek.
   - Rapor sekmesi (reports):
       hasReports = permissions.includes('sales_reporter') ||
                   permissions.includes('manager_reporter')
   - Chat sekmesi (chat):
       hasChat = permissions.includes('ai_analyst')

   Yaklaşım A (sekmeyi gizle — önerilir):
     <Tabs.Screen name="reports" options={{ href: hasReports ? undefined : null }} />
     <Tabs.Screen name="chat"    options={{ href: hasChat    ? undefined : null }} />
     (Expo Router href: null → sekme tab bar'da görünmez)

   Yaklaşım B (sekmeye git ama içerikte blokla):
     Eğer Expo Router versiyonu href: null desteklemiyorsa, sekme
     görünmeye devam eder; sayfa içinde MP-3/MP-4 guard'ları devreye girer.

   Admin: her zaman tüm sekmelere erişir.
     user?.role === 'admin' → tüm sekmeleri göster.

2. Yükleme durumu:
   - usePermissions() isLoading iken sekmeler admin'e göre gösterilir
     veya tüm sekmeler gösterilip sayfa içinde guard devreye girer.
   - Aşırı kırpma yaşanmaması için "loading tamamlanana kadar full
     erişim, sonra kırp" stratejisi tercih edilir.

Etkilenen dosyalar:
  DEĞIŞEN: app/(drawer)/(tabs)/_layout.tsx

Bağımlılık: MP-1
Commit:
  feat(mobile): hide reports/chat tabs based on permissions

Durum: [x]

----------------------------------------------------------------------
MP-3 — Raporlar Sayfası — İzin Filtrelemesi
----------------------------------------------------------------------

Amaç: Raporlar sayfasında kullanıcının erişebildiği raporları
göstermek; yetkisiz kullanıcıya erişim engeli eklemek.

Web referansı: F32 — reports/page.tsx katalog filtresi +
               reports/[slug]/page.tsx guard

Mevcut durum: reports.tsx tüm REPORT_CATALOG'u herkese gösteriyor;
executive-summary dashboard'u yetki olmaksızın açık.

Yapılacaklar:

1. apps/mobile/app/(drawer)/(tabs)/reports.tsx (güncelle):
   const { data: permsData, isLoading } = usePermissions();
   const allowedSlugs = permsData?.allowedReportSlugs ?? [];
   const hasReports = permsData?.permissions.some(
     (p) => p === 'sales_reporter' || p === 'manager_reporter'
   ) ?? false;

   Yükleme: ActivityIndicator göster.

   Yetkisiz kullanıcı (hasReports === false && !isLoading):
     - Hata ekranı: "Bu bölüme erişim yetkiniz bulunmamaktadır.
       Yöneticinizle iletişime geçin." + geri dön butonu.

   Yetkili kullanıcı:
   a) Dashboard sekmesi:
       - executive-summary KPI'ları yalnızca manager_reporter'a göster.
       - sales_reporter ise dashboard'da yetkili raporların listesi veya
         boş durum gösterilir. (ExecutiveSummaryMini → sadece
         manager_reporter için render edilir.)
   b) Tüm Raporlar kataloğu:
       - REPORT_CATALOG üzerinde flatMap ile tüm raporlar filtrelenir:
         report.slug ∈ allowedSlugs ise göster.
       - Kategori tamamen boşsa kategori başlığı da gösterilmez.
       - Her rapor kartı "Web" rozeti korunur (mobilde detay sayfası yok).

Etkilenen dosyalar:
  DEĞIŞEN: app/(drawer)/(tabs)/reports.tsx

Bağımlılık: MP-1, MP-2
Commit:
  feat(mobile): filter report catalog by allowed slugs and permission guard

Durum: [x]

----------------------------------------------------------------------
MP-4 — AI Analiz Sayfası — ai_analyst Guard
----------------------------------------------------------------------

Amaç: Chat sayfasına ai_analyst izni olmayan kullanıcıların erişimini
engellemek.

Web referansı: F32 — chat/page.tsx guard

Mevcut durum: chat.tsx herhangi bir guard olmaksızın tüm kullanıcılara açık.

Yapılacaklar:

1. apps/mobile/app/(drawer)/(tabs)/chat.tsx (güncelle):
   const hasChat = useHasPermission('ai_analyst');
   const { isLoading } = usePermissions();

   if (isLoading): LoadingView render et.
   if (!hasChat && !isLoading):
     Erişim engeli ekranı:
       "AI Analiz özelliğine erişim yetkiniz bulunmamaktadır."
       Yeşil/turuncu bir kart veya boş state bileşeni kullan.
   if (hasChat): mevcut <ChatPanel /> render edilir.

Etkilenen dosyalar:
  DEĞIŞEN: app/(drawer)/(tabs)/chat.tsx

Bağımlılık: MP-1
Commit:
  feat(mobile): ai_analyst permission guard on chat screen

Durum: [x]

----------------------------------------------------------------------
MP-5 — CRUD Buton Görünürlük Kontrolleri
----------------------------------------------------------------------

Amaç: Fırsat ve müşteri düzenleme/silme butonlarını kullanıcının
içerik iznine göre göstermek veya gizlemek.

Web referansı: F32 — frontend-enforcement (buton gizleme)

Yetki kuralı (webden aktarım):
  - İçerik görüntüleme: HERKES (okuma her zaman açık)
  - POST + PATCH (Ekle/Düzenle): content_editor VEYA content_manager
  - DELETE (Sil): yalnızca content_manager
  - Admin: her zaman tüm erişim

Mevcut durum: Tüm butonlar (Düzenle/Sil/Ekle) yetkiden bağımsız herkese
görünüyor.

Yapılacaklar:

1. apps/mobile/components/opportunity/OpportunityCard.tsx (güncelle):
   const canEdit   = useHasPermission('content_editor') ||
                     useHasPermission('content_manager') ||
                     user?.role === 'admin';
   const canDelete = useHasPermission('content_manager') ||
                     user?.role === 'admin';

   - ✏️ Düzenle butonu: canEdit yoksa gizle.
   - 🗑 Sil butonu: canDelete yoksa gizle.
   - "Kartvizit Ekle" Pressable: canEdit yoksa devre dışı.
   - Aşama Değiştir butonu: canEdit yoksa gizle.

2. apps/mobile/components/customer/CustomerProfileScroll.tsx (güncelle):
   const canEdit   = useHasPermission('content_editor') ||
                     useHasPermission('content_manager') ||
                     user?.role === 'admin';
   const canDelete = useHasPermission('content_manager') ||
                     user?.role === 'admin';

   - ✏️ Düzenle (firma) butonu: canEdit yoksa gizle.
   - 🗑 Sil (firma) butonu: canDelete yoksa gizle.
   - Her temsilci satırında ✏️ Düzenle: canEdit yoksa gizle.
   - Her temsilci satırında 🗑 Sil: canDelete yoksa gizle.
   - "+ Temsilci Ekle" butonu: canEdit yoksa gizle.

3. apps/mobile/app/(drawer)/(tabs)/_layout.tsx (güncelle):
   FAB ekleme butonu — yeni fırsat veya fuar:
   const canCreate = useHasPermission('content_editor') ||
                     useHasPermission('content_manager') ||
                     user?.role === 'admin';
   - FAB'a basınca: canCreate yoksa Alert.alert("Bu işlem için
     content_editor yetkisi gereklidir.") göster; formu açma.
   - Alternatif: FAB tamamen gizlenir (canCreate === false ise).

4. apps/mobile/components/customer/CustomerForm.tsx (güncelle):
   - Form açılmadan önce canCreate kontrolü eklenir.
   - Fuar detay ekranında da kontrol edilir.

Not: Notlar için özel kural (web ile aynı):
  - Not ekle/düzenle/sil: note.createdBy.id === user.id VEYA admin.
  - İçerik izinlerine bağlı değil. Bu mevcut canEditNote mantığı ile
    aynıdır ve değiştirilmez.

Etkilenen dosyalar:
  DEĞIŞEN: components/opportunity/OpportunityCard.tsx,
           components/customer/CustomerProfileScroll.tsx,
           app/(drawer)/(tabs)/_layout.tsx,
           components/customer/CustomerForm.tsx

Bağımlılık: MP-1
Commit:
  feat(mobile): hide CRUD buttons based on content_editor/manager permission
  feat(mobile): FAB disabled for users without content_editor permission

Durum: [x]

==============================
UYGULAMA SIRASI
==============================

MM serisi (Müşteri/Temsilci) — sıralı bağımlılık:
  MM-1 → MM-2 → MM-3 → MM-4 → MM-5

MP serisi (Yetkilendirme) — sıralı bağımlılık:
  MP-1 → MP-2 → MP-3 → MP-4 → MP-5

İki seri birbirinden bağımsızdır. Paralel branch açılabilir:
  - feature/MM1-contact-edit-sheet
  - feature/MP1-use-permissions
Ancak her branch kendi içinde sequential olmalıdır.

Tam sıra önerisi (tek geliştirici için):
  MM-1 → MM-2 → MM-3 → MM-4 → MM-5 → MP-1 → MP-2 → MP-3 → MP-4 → MP-5

==============================
RİSKLER VE DİKKAT NOKTALARI
==============================

1. Expo Router href: null — Sekme gizleme:
   Expo Router versiyonuna bağlıdır. Mevcut mobil package.json'unda
   hangi sürümün olduğu kontrol edilmeli. href: null desteklenmiyorsa
   Yaklaşım B (sayfa içi guard) tercih edilir.
   → Action: package.json'da expo-router versiyonunu doğrula.

2. TanStack Query cache boyutu — çoklu invalidation:
   MM-2 temsilci silme, MM-3 fırsat oluşturma akışları birçok query
   key'i invalidate ediyor. Fazla re-render'dan kaçınmak için
   invalidation'lar tek onSuccess bloğunda toplanmalı.

3. usePermissions isLoading flash — CRUD butonları:
   Sayfa ilk açıldığında izinler yüklenmeden butonlar görünüp
   sonradan kaybolabilir. Çözüm: isLoading iken butonları
   gizle (null render) veya placeholder (devre dışı buton).

4. MM-3 contactId = null → mevcut fırsatlar:
   OpportunityForm düzenleme modunda initial.contact === null olabilir
   (MT-2 data migration öncesi veya contact silinmiş fırsatlar).
   selectedContact başlangıçta null olmalı; null ile kaydedildiğinde
   fırsatın contactId'si null'a çekilir (SetNull davranışı).

5. CustomerForm OCR pivot (MM-4) karmaşıklığı:
   Pivot akışı birden fazla BottomSheet arasında geçiş gerektirir.
   Basit tutmak için store üzerinden sinyal kullanmak tercih edilir;
   callback prop zinciri bileşen hiyerarşisini karmaşıklaştırır.

6. Admin bypass — izinler:
   user.role === 'admin' kontrolleri her bileşende tekrarlanır.
   Bunu merkezileştirmek için useHasPermission içinde admin bypass'ı
   dahil etmek mümkündür:
     if (user?.role === 'admin') return true;
   → MP-1 aşamasında bu kuralı useHasPermission'a ekle.

7. Build doğrulaması:
   Her MM ve MP tamamlandıktan sonra:
     npm run build -w apps/mobile
     npm run lint -w apps/mobile
   MM ve MP serileri tamamlandıktan sonra tam uçtan uca mobil test:
   - Yeni müşteri + kartvizit tara → pivot kontrol
   - Fırsat oluştur → firma seç → temsilci seç → kaydet
   - Temsilci sil → fırsatın contactId null olduğunu doğrula
   - user rolü ile giriş → Raporlar sekmesi yok → Chat sekmesi yok
   - content_editor ile giriş → Sil butonu yok → Düzenle var
   - content_manager ile giriş → tüm CRUD var

==============================
UYGULAMA GATELERİ (her feature dalı için)
==============================

Her MM ve MP tamamlandığında:
  1. npm run build -w apps/mobile   → hatasız
  2. npm run lint -w apps/mobile    → hatasız
  3. Expo simülatörde ilgili akış test edildi
  4. main'e merge → branch sil → sıradaki feature

==============================
ÖZET — ETKİLENEN DOSYALAR
==============================

YENİ dosyalar:
  apps/mobile/components/customer/CustomerContactEditSheet.tsx  (MM-1)
  apps/mobile/hooks/use-permissions.ts                          (MP-1)

DEĞIŞEN dosyalar:
  apps/mobile/hooks/use-customer-contacts.ts     (MM-1)
  apps/mobile/lib/query-keys.ts                  (MP-1)
  apps/mobile/stores/auth-store.ts               (MP-1 minimal)
  apps/mobile/stores/customer-form-store.ts      (MM-4)
  apps/mobile/components/customer/CustomerProfileScroll.tsx     (MM-2)
  apps/mobile/components/customer/CustomerSelectInput.tsx       (MM-3)
  apps/mobile/components/customer/CustomerListCard.tsx          (MM-5)
  apps/mobile/components/customer/CustomerForm.tsx              (MM-4)
  apps/mobile/components/opportunity/OpportunityForm.tsx        (MM-3)
  apps/mobile/components/opportunity/OpportunityCard.tsx        (MP-5)
  apps/mobile/components/layout/DrawerContent.tsx               (opsiyonel — permissions-aware)
  apps/mobile/app/(drawer)/(tabs)/_layout.tsx    (MP-2, MP-5)
  apps/mobile/app/(drawer)/(tabs)/reports.tsx    (MP-3)
  apps/mobile/app/(drawer)/(tabs)/chat.tsx       (MP-4)
  apps/mobile/app/(drawer)/(tabs)/fairs/[id].tsx (MM-4 pivot dinleyici)

Toplam: 2 yeni, 16 değişen dosya.
Seri toplam: 10 feature (MM-1..5 + MP-1..5).

==============================
ÖNEMLİ NOTLAR
==============================

- Bu fazda backend değişikliği YOKTUR; tüm API uç noktaları hazırdır.
- Admin sayfaları (kullanıcı yönetimi, yetkilendirme sayfası, audit log)
  mobilde HİÇBİR ZAMAN yer almaz — web-only kalır.
- MM serisi bittikten sonra müşteri-temsilci ayrıştırması web ile tam
  pariteye gelir; Phase 5 mobile docs/phase-5-customer360-MOBILE.md ile
  çakışma yoktur (bu doküman MT-15 öncesi aşamayı kapsamaktaydı).
- MP serisi bittikten sonra mobil, web ile aynı yetki politikasını
  uygular; backend zaten tüm endpointleri guard'lıyor.
- Tüm geliştirme .cursor/rules/feature-development-protocol.mdc kurallarına
  göre ayrı feature dallarında yapılır.
