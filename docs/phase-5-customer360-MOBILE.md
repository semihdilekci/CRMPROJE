# Phase 5 — Müşteri 360 (Mobil)

Bu doküman, web tarafında `docs/phase-5-customer360-WEB.md` ve görsel referans `docs/musteri-profil.html` ile tanımlanan **Müşteriler** ve **Müşteri Profili** deneyiminin **mobil uygulamaya** taşınması için uygulanacak geliştirme planıdır.

**Amaç:** Bottom tab’a **Müşteriler** ve **Raporlar** sekmelerini eklemek; müşteri listesi (kartlar), müşteri detay/profil ekranı ve web ile aynı API sözleşmesini kullanmak. **Backend veya Prisma şeması bu iş kapsamında değiştirilmez** (mevcut REST API tüketilir).

**İlke:** Diğer ekranlar (Fuarlar, Fuar detay, FAB, AI Analiz, formlar, auth) **davranış olarak etkilenmemeli**; değişiklikler yeni route’lar, yeni bileşenler ve sınırlı entegrasyon noktalarıyla izole edilir.

**Tipografi:** Müşteriler ve müşteri profili ekranlarında **yalnızca uygulamanın geri kalanıyla aynı font ve tipografi kullanımı** geçerlidir. Başlık, gövde ve etiketler için mevcut ekranlardaki kalıplar (ör. `Header`, `FairCard`, `OpportunityCard`, `fairs/index` — `font-semibold`, `text-lg`, `text-[12px]` …) referans alınır; `musteri-profil.html` veya web’deki Playfair/DM Sans **mobilde yeni font yükleme veya farklı font ailesi** olarak uygulanmaz. Renk ve hiyerarşi `docs/design-system.md` ve `apps/mobile/constants/theme.ts` ile uyumlu kalır.

---

## 1. Referans dokümanlar

| Doküman | Rol |
|--------|-----|
| `docs/phase-5-customer360-WEB.md` | İş kuralları, API yanıt şekilleri, bölüm sırası (Hero, KPI, Bekleyen, Timeline, Notlar), sıralama seçenekleri |
| `docs/musteri-profil.html` | Profil ekranı düzeni ve renk hiyerarşisi (mobilde layout; **fontlar web HTML’e kopyalanmaz**, aşağıdaki tipografi kuralı geçerli) |
| `docs/phase-4-mobil.md` | Genel mobil mimari, tasarım dili, drawer kapsamı (admin yok) |
| `docs/design-system.md` | Tema token’ları, fontlar |

Web implementasyonu (parite kontrolü için): `apps/web` içindeki müşteri listesi, profil sayfası ve `CustomerListCard` — mobilde aynı veri ve benzer UX hedeflenir.

---

## 2. Kapsam

### 2.1 Dahil

- Tab bar’a iki yeni sekme: **Müşteriler**, **Raporlar** (boş placeholder).
- **Müşteriler** sekmesi: arama, sıralama (web ile aynı `sortBy` değerleri), `FlatList` + müşteri kartları; karta basınca profil ekranı.
- **Müşteri profili** (`/customers/[id]`): Web dokümanındaki bölüm sırası — Hero, KPI (4), Bekleyen aksiyonlar (koşullu), Fuar/timeline, Notlar (ve gerekli not mutasyonları + cache invalidation).
- **Raporlar** sekmesi: Web’deki empty state metni ile uyumlu statik ekran.
- **Hooks:** `useCustomerList`, `useCustomerProfile` — web ile aynı endpoint ve `@crm/shared` tipleri (`CustomerListItem`, `CustomerProfileResponse`, `CustomerListSortBy`).
- **`queryKeys.customers`:** Web `apps/web/src/lib/query-keys.ts` ile hizalı anahtarlar (liste + profil invalidation tutarlılığı).
- **OpportunityCard:** Müşteri adı / firma satırına dokunulunca profil ekranına git; kartın genişlemesini tetikleme (`stopPropagation` benzeri — React Native’de `Pressable` iç içe ve `e.stopPropagation` veya üst aksiyonu ayırma).

### 2.2 Hariç (bilinçli)

- Admin paneli, kullanıcı/ekip yönetimi, audit, ürün listesi (web-only).
- Yeni API endpoint veya `@crm/shared`’de **yeni** domain modeli (gerekirse sadece mevcut tiplerin import edilmesi).
- Drawer menüye yeni ana modül (isteğe bağlı ileride; bu fazda tab yeterli).

---

## 3. Mevcut mobil yapı (çıkış noktası)

- Tab layout: `apps/mobile/app/(drawer)/(tabs)/_layout.tsx`
- Mevcut sekmeler: `fairs` (Stack: liste + detay), `add` (FAB placeholder), `chat` (AI Analiz).
- Örnek liste sayfası: `fairs/index.tsx` (`Header`, `GradientBackground`, `FlatList`, alt padding ~80).
- Müşteri CRUD hook’ları: `hooks/use-customers.ts` — liste şu an basit `Customer[]` ile `GET /customers`; **profil ve zengin liste için genişletilecek** (aşağıda).

---

## 4. Hedef navigasyon ve route yapısı

### 4.1 Tab sırası (önerilen)

Mobil bottom bar’da merkez **FAB** korunur; okuma akışı web sırasına yakın olur:

| Sıra | Tab route | Açıklama |
|------|-----------|----------|
| 1 | `fairs` | Değişmez |
| 2 | `customers` | **Yeni** — Stack (liste + profil) |
| 3 | `add` | Mevcut FAB (placeholder route) |
| 4 | `reports` | **Yeni** — tek ekran, boş içerik |
| 5 | `chat` | Değişmez |

**Not:** `Tabs.Screen` ekleme sırası ve `tabBarButton` ile FAB’ın ortada kalması mevcut `_layout.tsx` tasarımına bağlıdır; uygulama sırasında ikonların eşit dağılımı ve FAB hizası **regresyon kontrolü** ile doğrulanır (aşağıdaki test listesi).

### 4.2 Dosya ağacı (yeni / güncellenecek)

```
apps/mobile/app/(drawer)/(tabs)/
  _layout.tsx                 # Güncelle: customers + reports Tabs.Screen
  reports.tsx                 # Yeni: boş sayfa
  customers/                  # Yeni
    _layout.tsx               # Stack: index + [id]
    index.tsx                 # Müşteri listesi
    [id].tsx                  # Müşteri profili
```

`fairs/` ile aynı pattern: sekme adı `customers`, iç Stack `customers/index` ↔ `customers/[id]`.

### 4.3 Derin bağlantı

- Profil: `router.push(\`/customers/${id}\`)` veya Expo Router `href`.
- Fırsat kartından profil: `/(drawer)/(tabs)/customers/${customerId}` (projedeki grup yapısına göre tam path doğrulanır).
- Müşteri profilinden fuar: `/(drawer)/(tabs)/fairs/{fairId}?opportunityId={opportunityId}` ve ayrıca `stores/fair-opportunity-focus-store.ts` ile hedef fırsat id’si taşınır (tab/stack içinde sorgu parametresi kaybolabildiği için store birincil, URL yedek).

---

## 5. API ve veri katmanı

### 5.1 Liste

- **GET** `/api/v1/customers?search=&sortBy=`
- `sortBy`: `lastContact` | `company` | `opportunityCount` (`CustomerListSortBy` — `@crm/shared`)
- Yanıt: `CustomerListItem[]` (web ile aynı)

### 5.2 Profil

- **GET** `/api/v1/customers/:id/profile`
- Yanıt: `CustomerProfileResponse` (`@crm/shared`)

### 5.3 Not mutasyonları (profil ekranındaki notlar bölümü)

Web dokümanıyla aynı:

- Not düzenle / sil: mevcut opportunity notes endpoint’leri (`PATCH` / `DELETE` …) — web’de kullanılan hook’larla parity; invalidation: `['customers', id, 'profile']` ve gerekirse ilgili opportunity cache’leri.

### 5.4 `hooks/use-customers.ts` evrimi

| Konu | Aksiyon |
|------|---------|
| Eski `useCustomers(search)` | Müşteri seçimi / fuar içi kullanım bozulmasın diye **korunur** veya içeride aynı endpoint’e delegasyon; liste ekranı **yeni** `useCustomerList` kullanır |
| Yeni `useCustomerList(search, sortBy)` | `queryKeys.customers.list(search, sortBy)`, `ApiSuccessResponse<CustomerListItem[]>` |
| Yeni `useCustomerProfile(id)` | `queryKeys.customers.profile(id)`, `enabled: !!id` |

### 5.5 `lib/query-keys.ts`

Web ile uyum için örnek yapı:

```ts
customers: {
  all: ['customers'] as const,
  list: (search?: string, sortBy?: string) => ['customers', 'list', { search, sortBy }] as const,
  profile: (id: string) => ['customers', id, 'profile'] as const,
},
```

Mevcut `byFair` anahtarı varsa **silmeden** genişletilir (fuar içi müşteri listesi kırılmaz).

---

## 6. Ekran özeti

### 6.1 Müşteriler (`customers/index.tsx`)

- **Header:** Mevcut `Header` + drawer menü (fuar listesi ile aynı).
- **Başlık alanı:** “Müşteriler” + alt satır: `{N} müşteri · {M} farklı firma” — `CustomerListItem` üzerinden türetme (web ile aynı mantık: benzersiz `company` sayımı).
- **Toolbar:** Arama (`Input` veya mevcut pattern), sıralama: **Son Temas / Firma Adı / Fırsat Sayısı** (dropdown veya native picker — `Dropdown` bileşeni varsa reuse).
- **Liste:** `CustomerListCard` (yeni) — firma, kişi, fırsat sayısı rozeti, son temas tarihi (`formatDate` — `@crm/shared`).
- **Boş / yükleme / hata:** `LoadingView`, `ErrorState`, `isNetworkError` — `fairs/index.tsx` ile aynı kalıp.
- **Alt safe area:** Mevcut tab bar için `paddingBottom` fuar listesi ile uyumlu (~80).

### 6.2 Müşteri profili (`customers/[id].tsx`)

`phase-5-customer360-WEB.md` bölümleri:

1. **Geri:** `Stack` geri veya üstte “Müşterilere dön” (`router.back` veya liste route’una reset).
2. **Hero:** Avatar / baş harfler, firma, kişi, `tel:` / `mailto:` (`Linking`), İlk/Son temas (Türkçe ay formatı — `formatDate` veya mevcut util).
3. **Düzenle / Sil:** Web’deki gibi — mobilde müşteri düzenleme **mevcut** `CustomerForm` + bottom sheet store varsa reuse; silme için onay dialog’u ve API `DELETE` / mevcut akış (web parity).
4. **KPI:** 4 kutu — grid 2×2 veya yatay scroll (küçük ekran).
5. **Bekleyen aksiyonlar:** `pendingOpportunities.length === 0` → bölüm yok.
6. **Timeline:** Sıralama, durum renkleri, pipeline mini bar, “Fırsata git” → `/(drawer)/(tabs)/fairs/${fairId}` veya mevcut fair detay path.
7. **Notlar:** Sıralama, chip’ler, düzenle/sil; “Not ekle” web’deki gibi iş kuralına uygun.

**Performans:** Uzun liste için `ScrollView` + bölüm bileşenleri veya `SectionList`; timeline öğeleri alt bileşenlere bölünür (150 satır kuralı — `code-standards.mdc`).

### 6.3 Raporlar (`reports.tsx`)

Web empty state ile aynı metin (📋, başlık, açıklama); `GradientBackground` + `Header`.

---

## 7. Yeni bileşenler (önerilen konumlar)

| Bileşen | Dosya | Not |
|---------|-------|-----|
| `CustomerListCard` | `apps/mobile/components/customer/CustomerListCard.tsx` | `FairCard` / web `CustomerListCard` görsel diline yakın; Pressable |
| `CustomerProfileHero` | `.../customer/profile/CustomerProfileHero.tsx` | İsteğe bağlı alt klasör |
| `CustomerProfileKpiRow` | `.../customer/profile/CustomerProfileKpiRow.tsx` | |
| `CustomerPendingSection` | `.../customer/profile/CustomerPendingSection.tsx` | |
| `CustomerTimelineSection` | `.../customer/profile/CustomerTimelineSection.tsx` | Pipeline bar: web’deki stage sırası sabitleri `@crm/shared` |
| `CustomerNotesSection` | `.../customer/profile/CustomerNotesSection.tsx` | Mevcut not hook’ları reuse |
| Tab ikonları | `apps/mobile/components/ui/CustomersTabIcon.tsx`, `ReportsTabIcon.tsx` | `FairTabIcon` / `ChartTabIcon` ile aynı API: `{ focused?: boolean }` |

İkon seti: mevcut SVG/emoji tutarlılığı — tasarımda mor aktif renk `#8b5cf6` (`_layout.tsx` ile uyumlu).

---

## 8. Tasarım (mobil uyarlama)

### 8.1 Tipografi (zorunlu)

- Tüm metinler **mevcut mobil uygulama ile aynı font** üzerinden gider: projede özel `fontFamily` / `expo-font` ile yüklenmiş global bir font yoksa **sistem varsayılanı** + NativeWind `font-*` / `text-*` sınıfları kullanılır; yeni ekranlar da **Fuarlar listesi, fuar detayı, fırsat kartı** ile aynı stil dilini takip eder.
- **Yapılmayacaklar:** `musteri-profil.html` veya web’deki başlık/gövde font isimlerini mobilde tek başına ekran bazında tanımlamak; yalnızca bu müşteri ekranlarına özel font yükleme veya farklı font ailesi seçmek.
- **Yapılacaklar:** Aynı bileşenlerdeki gibi tutarlı boyut ve ağırlık (ör. sayfa başlığında `Header`’a benzer; kart başlığında `FairCard`’a benzer; küçük etiketlerde `uppercase tracking-wider` + `text-[12px]` gibi mevcut pattern’ler).

### 8.2 Genel

- **HTML piksel mükemmelliği** mobilde zorunlu değil; renk ve hiyerarşi `docs/design-system.md`, `apps/mobile/constants/theme.ts` ve mevcut mobil ekranlarla uyumlu olmalı.
- Glass: `bg-white/10`, `border-white/20`, `rounded-2xl`, `backdrop` (mevcut bileşenler).
- Animasyon: Opsiyonel `LayoutAnimation` veya hafif fade; zorunlu değil.

---

## 9. İzolasyon ve risk azaltma

### 9.1 Dokunulmaması gerekenler (regresyon)

- `add` sekmesi FAB mantığı: `usePathname()` ile `openFairForm` / `openOpportunityForm` — **customers ve reports path’lerinde** beklenen davranış dokümante edilir (ör. fuar detayı değilse yeni fuar formu).
- `useFairs`, `useOpportunities`, login, chat, OCR akışları — bu dosyalarda **gereksiz refactor yok**.
- `CustomerForm`, `CustomerSelectInput` — sadece profil “Düzenle” entegrasyonu için **minimal** dokunuş.

### 9.2 Kabul edilebilir minimal dokunuşlar

- `OpportunityCard.tsx`: müşteri başlığına `Pressable` + `router.push` — dış `Pressable` ile çakışmayı önleme.
- `hooks/use-customers.ts` + `query-keys.ts`: yeni sorgular ve anahtarlar.
- `(tabs)/_layout.tsx`: yeni `Tabs.Screen` iki satır + ikon.

---

## 10. Branch yönetimi ve Git

Proje kuralları: `main` üzerinde doğrudan feature kodu yok; feature branch kullanılır (`.cursor/rules/git-conventions.mdc`).

### 10.1 Önerilen branch adı

```text
feature/phase5-mobile-customer360
```

Alternatif (daha kısa):

```text
feature/m5-customers-reports-mobile
```

### 10.2 Akış

1. `git checkout main && git pull` (uzak varsa)
2. `git checkout -b feature/phase5-mobile-customer360`
3. Geliştirme: anlamlı atomik commit’ler (ör. `feat(mobile): add customers tab stack`, `feat(mobile): customer profile screen`, `feat(mobile): reports placeholder tab`)
4. Yerel doğrulama: `npm run lint -w apps/mobile`, `npx tsc --noEmit` (workspace script’e göre), cihaz/simülatörde tab + liste + profil + geri + FAB
5. Merge: sadece doğrulama tamamlandıktan sonra `main` ← feature (solo akışta `git merge`)

**Önemli:** Bu dokümandaki “Phase 5” tek bir feature branch içinde tamamlanabilir; çok büyük parçalanma gerekirse alt dallar yerine **commit**’lere bölün (rebase/merge karmaşasını azaltır).

---

## 11. Uygulama sırası (checklist)

Aşağıdaki sıra, bağımlılıkları minimize eder.

1. [x] `query-keys.ts` — `customers.list`, `customers.profile` (mevcut anahtarları bozmadan)
2. [x] `useCustomerList`, `useCustomerProfile` — `use-customers.ts` içinde veya aynı dosyada düzenli export
3. [x] `reports.tsx` + `Tabs.Screen` kaydı — hızlı görsel doğrulama (tab bar regresyonu)
4. [x] `customers/_layout.tsx` + boş `index` + boş `[id]` — navigasyon iskeleti
5. [x] `CustomerListCard` + tam `customers/index.tsx` (arama, sıralama, liste)
6. [x] Profil ekranı: Hero → KPI → … sırayla alt bileşenler
7. [x] `OpportunityCard` müşteri linki
8. [x] FAB davranışı tüm sekmelerde smoke test
9. [x] Lint / typecheck / manuel test

---

## 12. Test ve doğrulama (Definition of Done)

- [x] Tab bar: 5 slot + FAB; ikonlar doğru sekmede aktif
- [x] Müşteriler: arama ve her `sortBy` seçeneği API’ye doğru parametreyle gidiyor
- [x] Profil: tüm bölümler veri varken görünüyor; bekleyen yoksa C bölümü yok
- [x] Timeline “Fırsata git” fair detaya açılıyor
- [x] Profil → “Fırsata Git” sonrası fuar sayfasında `?opportunityId=` ile arama, dönüşüm ve aşama filtreleri ilgili fırsata göre dolu
- [x] Not işlemleri sonrası profil verisi yenileniyor
- [x] Fuar listesi, fuar detay, fırsat kartı, AI Analiz, login — önceki davranış korunmuş
- [x] Hata durumlarında Türkçe mesajlar (`error-handling.mdc`)
- [x] Tipografi: Fuarlar / fırsat kartları ile aynı font ve `font-*` / `text-*` kalıpları; yalnızca bu modüle özel font yok

---

## 13. Doküman / env güncellemesi

- **Yeni API veya env yoksa** `docs/deployment-and-env-strategy.md` değişmez.
- Bu dosya tamamlandığında: isteğe bağlı olarak `docs/phase-4-mobil.md` içine “Phase 5 mobil tamamlandı” notu eklenebilir (çakışmayı önlemek için ayrı commit).

---

## 14. Özet

| Madde | Karar |
|-------|--------|
| Backend | Değişiklik yok |
| Shared | Mevcut `@crm/shared` tipleri |
| Ana risk | Tab bar + FAB hizası ve OpportunityCard jest |
| Ana çıktı | `customers/*`, `reports.tsx`, hook/query güncellemesi, sınırlı `OpportunityCard` ve `_layout` |
| Tipografi | Uygulamanın geri kalanı ile aynı; HTML/web font adları mobilde kopyalanmaz |

Bu checklist tamamlandığında geliştirme bu dokümana göre kabul edilir; sonraki iterasyonlar (drawer’dan müşteri kısayolu, rapor grafikleri) ayrı dokümanla yapılır.
