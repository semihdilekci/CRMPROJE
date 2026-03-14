Phase 3 — Fırsat Takibi, Pipeline & Raporlama
==============================================

Bu doküman, Fırsat Geçişi Fazı tamamlandıktan sonra uygulanacak
Faz 3 özelliklerini detaylandırır.

Ön koşul: Fırsat Geçişi Fazı (docs/firsat-gecisi-fazi.md) tamamlanmış olmalıdır.
Mobil uygulama bu fazda kapsam dışıdır.

Phase 3, fırsat takibini derinleştiren ve satış sürecini profesyonelleştiren
özellikleri kapsar: ürün tonaj girişi, pipeline statü yönetimi, notlar,
etiketleme, fuar KPI hedefleri ve aktivite zaman çizelgesi.

==============================
DEĞİŞİKLİĞİN ÖZETİ
==============================

Mevcut Durum (As-Is):
- Fırsat içinde ürünler sadece isim olarak seçiliyor (String[]).
- Fırsat statüsü yok — tüm fırsatlar aynı "düz listede" duruyor.
- Not ekleme mekanizması yok.
- Etiketleme/tagging yok — fırsatlar sadece dönüşüm oranıyla sınıflandırılıyor.
- Fuar bazında hedef/gerçekleşme metrikleri yok.
- Fırsat üzerindeki değişikliklerin birleşik bir zaman çizelgesi yok.

Hedef Durum (To-Be):
- Her ürün için tonaj/ağırlık bilgisi girilebiliyor (OpportunityProduct).
- Fırsatlar pipeline aşamalarından geçiyor (Tanışma → Toplantı → Proje → Teklif → Sözleşme → Satışa Dönüştü / Olumsuz Sonuçlandı).
- Her aşama geçişinde not yazılabiliyor, geçmiş izlenebiliyor.
- Fırsatlara serbest notlar eklenebiliyor.
- Admin tarafından yönetilen kategori bazlı etiketler fırsatlara atanabiliyor.
- Fuar bazında KPI hedefleri tanımlanıp gerçekleşme metrikleri izlenebiliyor.
- Tüm aktiviteler (aşama, not, etiket) tek bir zaman çizelgesinde görünüyor.

Neden:
Fuarlarda toplanan fırsatların satışa dönüşüm sürecini uçtan uca takip etmek,
satış ekibinin performansını ölçmek ve fuar yatırımının geri dönüşünü hesaplamak
için bu özellikler gereklidir. Ürün bazında tonaj bilgisi, endüstriyel B2B
satışlarda temel bir ihtiyaçtır.

==============================
GELİŞTİRME YAKLAŞIMI: DİKEY DİLİM (VERTICAL SLICE)
==============================

Bu faz, yatay katman (tüm shared → tüm DB → tüm backend → tüm frontend)
yerine DİKEY DİLİM yaklaşımıyla geliştirilir:

Her özellik kendi içinde tamamen bitirilir (shared → DB → backend → frontend),
uçtan uca test edilir ve main'e merge edilir. Ardından bir sonraki özelliğe geçilir.

Avantajları:
- Her branch küçük ve odaklı → context window taşmaz.
- Her branch sonunda uçtan uca test edilebilir → hatalar erken yakalanır.
- DB migration'ları küçük ve bağımsız → rollback kolay.
- Bir branch'te sorun çıkarsa sadece o branch geri alınır.
- Her merge sonrası main her zaman çalışır durumda kalır.

Toplam: 16 feature (F32–F47), 8 branch, 6 bağımsız DB migration.

==============================
ETKİLENEN DOSYALAR (TAM LİSTE)
==============================

Shared Package (packages/shared/src/):
  YENİ:
    - types/opportunity-product.ts
    - types/opportunity-stage.ts
    - types/opportunity-note.ts
    - types/tag.ts
    - types/timeline.ts
    - schemas/opportunity-product.ts
    - schemas/opportunity-stage.ts
    - schemas/opportunity-note.ts
    - schemas/tag.ts
    - constants/pipeline.ts
    - constants/tags.ts
  DEĞİŞECEK:
    - types/opportunity.ts (currentStage, lossReason, relations eklenecek)
    - types/fair.ts (KPI hedef alanları eklenecek)
    - types/index.ts (yeni export'lar)
    - schemas/opportunity.ts (products alanı kaldırılacak, opportunityProducts eklenecek)
    - schemas/fair.ts (KPI alanları eklenecek)
    - schemas/index.ts (yeni export'lar)
    - constants/api-endpoints.ts (yeni endpoint'ler)
    - constants/index.ts (yeni export'lar)
    - types/auth.ts (MfaRequiredResponse, VerifyMfaDto)
    - types/user.ts (phone alanı)
    - schemas/auth.ts (verifyMfaSchema)

Veritabanı (apps/api/prisma/):
  DEĞİŞECEK:
    - schema.prisma (5 yeni model, Opportunity ve Fair model güncellemesi, User relations)
  YENİ:
    - migrations/YYYYMMDD_urun_tonaj/     (Branch 1)
    - migrations/YYYYMMDD_pipeline/        (Branch 2)
    - migrations/YYYYMMDD_notlar/          (Branch 3)
    - migrations/YYYYMMDD_etiketler/       (Branch 4)
    - migrations/YYYYMMDD_fuar_kpi/        (Branch 5)
    - migrations/YYYYMMDD_mfa_sms/         (Branch 6)

Backend (apps/api/src/):
  YENİ:
    - modules/tag/tag.module.ts
    - modules/tag/tag.service.ts
    - modules/tag/tag.controller.ts
    - modules/sms/sms.module.ts
    - modules/sms/sms.service.ts
    - common/guards/dynamic-throttler.guard.ts
  DEĞİŞECEK:
    - modules/opportunity/opportunity.service.ts (her branch'te genişleyecek)
    - modules/opportunity/opportunity.controller.ts (her branch'te genişleyecek)
    - modules/opportunity/opportunity.module.ts (import'lar)
    - modules/fair/fair.service.ts (KPI metrikleri)
    - modules/fair/fair.controller.ts (KPI endpoint)
    - modules/auth/auth.service.ts (MFA 2-step flow)
    - modules/auth/auth.controller.ts (verify-mfa endpoint)
    - modules/settings/settings.service.ts (MFA, rate limit ayarları)
    - app.module.ts (TagModule, SmsModule, ThrottlerModule eklenecek)

Frontend (apps/web/src/):
  YENİ:
    - components/opportunity/ProductQuantityList.tsx
    - components/opportunity/PipelineProgressBar.tsx
    - components/opportunity/StageTransitionModal.tsx
    - components/opportunity/StageHistory.tsx
    - components/opportunity/OpportunityNotes.tsx
    - components/opportunity/ActivityTimeline.tsx
    - components/fair/FairKPIDrawer.tsx
    - components/auth/MfaCodeInput.tsx
    - components/tag/TagCategoryManager.tsx
    - components/tag/TagManager.tsx
    - app/(dashboard)/admin/tags/page.tsx
    - hooks/use-opportunity-stages.ts
    - hooks/use-opportunity-notes.ts
    - hooks/use-opportunity-timeline.ts
    - hooks/use-tags.ts
    - hooks/use-fair-metrics.ts
  DEĞİŞECEK:
    - components/opportunity/OpportunityFormModal.tsx (ürün tonaj UI, etiket seçimi)
    - components/opportunity/OpportunityCard.tsx (aşama badge, not ikonu, etiket noktaları, timeline)
    - components/fair/OpportunityToolbar.tsx (aşama filtresi, etiket filtresi)
    - components/fair/FairStats.tsx (KPI entegrasyonu, opsiyonel)
    - hooks/use-opportunities.ts (response type güncellemeleri)
    - lib/query-keys.ts (yeni key'ler)
    - app/(dashboard)/fairs/[id]/page.tsx (KPI drawer, timeline entegrasyonu)
    - components/layout/ (admin menüsüne "Etiketler" ekleme)
    - app/(auth)/login/page.tsx (2 aşamalı MFA akışı)
    - stores/auth-store.ts (verifyMfa)
    - components/user/UserFormModal.tsx (phone alanı)

Toplam tahmini etki: ~35 yeni dosya, ~25 değişen dosya, 6 migration dosyası.

==============================
VERİ MODELİ DEĞİŞİKLİĞİ
==============================

ÖNCESİ — Opportunity Modeli (Fırsat Geçişi sonrası):
  id, fairId, customerId,
  budgetRaw, budgetCurrency, conversionRate,
  products (String[]),
  cardImage,
  createdAt, updatedAt

SONRASI — Opportunity Modeli (Phase 3 sonrası):
  id, fairId, customerId,
  budgetRaw, budgetCurrency, conversionRate,
  cardImage,
  currentStage (String, default: "tanisma"),    ← YENİ
  lossReason (String?),                          ← YENİ
  createdAt, updatedAt
  ─── İlişkiler ───
  opportunityProducts: OpportunityProduct[]      ← YENİ (products[] yerine)
  stageLogs: OpportunityStageLog[]               ← YENİ
  notes: OpportunityNote[]                       ← YENİ
  tags: OpportunityTag[]                         ← YENİ

NOT: products String[] alanı kaldırılır, OpportunityProduct tablosuyla değiştirilir.
NOT: conversionRate alanı KALIR — kullanıcı satışa dönüşme tahminini kendisi belirlemeye devam eder.

--- YENİ MODELLER ---

OpportunityProduct:
  id, opportunityId, productId,
  quantity (Float?),    — tonaj/ağırlık
  unit (String, default: "ton"),    — ton | kg | adet
  note (String?),
  createdAt, updatedAt
  @@unique([opportunityId, productId])

OpportunityStageLog:
  id, opportunityId, changedById,
  stage (String),    — pipeline aşama değeri
  note (String?),
  createdAt

OpportunityNote:
  id, opportunityId, createdById,
  content (String @db.Text),
  createdAt, updatedAt

TagCategory:
  id, name (unique), description?,
  createdAt, updatedAt
  tags: Tag[]

Tag:
  id, categoryId, name, color (hex),
  createdAt, updatedAt
  opportunities: OpportunityTag[]
  @@unique([categoryId, name])

OpportunityTag:
  opportunityId, tagId,
  assignedAt
  @@id([opportunityId, tagId])

--- GÜNCELLENMİŞ MODELLER ---

Fair (KPI hedef alanları eklenir):
  + targetBudget (String?)       — hedef bütçe (ham değer)
  + targetTonnage (Float?)       — hedef tonaj
  + targetLeadCount (Int?)       — hedef fırsat sayısı

User (yeni relation'lar):
  + stageLogs: OpportunityStageLog[] @relation("StageLogChangedBy")
  + opportunityNotes: OpportunityNote[] @relation("NoteCreatedBy")

Product (yeni relation):
  + opportunityProducts: OpportunityProduct[]

İLİŞKİLER:
  Opportunity (1) → OpportunityProduct (N) [cascade delete]
  Opportunity (1) → OpportunityStageLog (N) [cascade delete]
  Opportunity (1) → OpportunityNote (N)     [cascade delete]
  Opportunity (N) ↔ Tag (N)                 [OpportunityTag pivot, cascade delete]
  Product (1) → OpportunityProduct (N)      [restrict delete]
  TagCategory (1) → Tag (N)                 [cascade delete]
  User (1) → OpportunityStageLog (N)        [restrict delete]
  User (1) → OpportunityNote (N)            [restrict delete]

==============================
PİPELINE AŞAMALARI
==============================

Fırsat pipeline'ı 6 aşamadan oluşur:

  Sıra  Enum Değeri       Görünen Ad              Tür
  ────  ──────────────    ──────────────────────  ──────────
  1     tanisma           Tanışma                 Normal
  2     toplanti          Toplantı                Normal
  3     teklif            Teklif                  Normal
  4     sozlesme          Sözleşme                Normal
  5     satisa_donustu    Satışa Dönüştü          Terminal (+)
  6     olumsuz           Olumsuz Sonuçlandı      Terminal (−)

Aşama geçiş kuralları:
  - Yeni fırsat oluşturulduğunda varsayılan aşama: "tanisma"
  - İleri yönde herhangi bir aşamaya atlanabilir (Tanışma → Teklif mümkün)
  - Geri gitme mümkün değil (Teklif → Toplantı yasak)
  - "Olumsuz Sonuçlandı" herhangi bir normal aşamadan ulaşılabilir
  - Terminal aşamalardan (Satışa Dönüştü, Olumsuz) çıkış yok
  - Her geçişte not yazılabilir (opsiyonel)
  - "Olumsuz Sonuçlandı" aşamasında kayıp nedeni zorunludur

NOT: Pipeline aşamalarında otomatik olasılık yüzdesi YOKTUR.
Kullanıcı satışa dönüşme tahminini (conversionRate) fırsatın içinde
kendisi belirlemeye devam eder. Pipeline aşamaları ve dönüşüm tahmini
birbirinden bağımsız iki boyuttur.

Kayıp nedenleri (lossReason enum):
  Enum Değeri            Görünen Ad
  ─────────────────────  ────────────────────────────
  price_high             Fiyat yüksek
  competitor             Rakip tercih edildi
  need_gone              İhtiyaç ortadan kalktı
  timing                 Zamanlama uyumsuzluğu
  communication_lost     İletişim koptu
  budget_not_approved    Bütçe onaylanmadı
  other                  Diğer

==============================
ETİKET KATEGORİLERİ (VARSAYILAN SEED DATA)
==============================

Admin tarafından yönetilen etiket kategorileri ve başlangıç etiketleri:

  Kategori: Öncelik / Değer
    - VIP (#8B5CF6)
    - Sıcak Lead (#EF4444)
    - Büyük Hacim (#F59E0B)

  Kategori: Durum
    - Numune Gönderildi (#3B82F6)
    - Referans Müşteri (#10B981)
    - Tekrar Müşteri (#06B6D4)

  Kategori: Uyarı
    - Acil Takip (#EF4444)
    - Beklemede (#F59E0B)
    - Bütçe Onayı Bekleniyor (#F97316)

  Kategori: Rekabet
    - Rakip Var (#DC2626)
    - Fiyat Hassas (#FB923C)

Admin istediği zaman yeni kategori ve etiket ekleyebilir, düzenleyebilir, silebilir.
Etiketler fırsat kartında küçük renkli noktalar olarak, detayda ise tam chip olarak görünür.

==============================
DATA MİGRATİON STRATEJİSİ
==============================

5 bağımsız migration, her biri kendi branch'inde:

--- Migration 1: Ürün Tonaj (Branch 1) ---

Mevcut Opportunity.products (String[]) → OpportunityProduct satırlarına dönüşüm.
Bu migration GERİ DÖNÜŞÜMSÜZDÜR — öncesinde veritabanı yedeği alınmalıdır.

Adım 1: OpportunityProduct tablosunu oluştur.
         Opportunity.products alanını HENÜZ kaldırma.

Adım 2: SQL ile mevcut Opportunity.products verilerini OpportunityProduct'a aktar:
         Her Opportunity.products dizisindeki her ürün adı için:
           a. Product tablosunda eşleşen kaydı bul (name ile).
           b. OpportunityProduct satırı oluştur:
              - opportunityId: mevcut Opportunity.id
              - productId: eşleşen Product.id
              - quantity: NULL (tonaj bilgisi henüz mevcut değil)
              - unit: "ton" (varsayılan)

         NOT: Product tablosunda eşleşme bulunamazsa satır oluşturulmaz.
         Migration sonrası bu durum raporlanmalıdır.

Adım 3: Opportunity.products String[] alanını kaldır.

Adım 4: Doğrulama:
         - Her Opportunity için beklenen sayıda OpportunityProduct var mı?
         - Product referansları doğru mu?

--- Migration 2: Pipeline (Branch 2) ---

Yeni alanlar ve tablo eklenir. Mevcut verilere initial state atanır.

Adım 1: Opportunity modeline currentStage ve lossReason alanlarını ekle.
         currentStage default: "tanisma"
Adım 2: OpportunityStageLog tablosunu oluştur.
Adım 3: Mevcut her Opportunity için ilk StageLog kaydı oluştur:
         INSERT INTO "OpportunityStageLog" (id, "opportunityId", "changedById", stage, "createdAt")
         SELECT gen_random_uuid(), opp.id, fair."createdById", 'tanisma', opp."createdAt"
         FROM "Opportunity" opp
         JOIN "Fair" fair ON opp."fairId" = fair.id
         (changedById olarak fuarı oluşturan kullanıcı atanır)

--- Migration 3: Notlar (Branch 3) ---

Basit tablo ekleme, data migration gerekmez.
OpportunityNote tablosu oluşturulur.

--- Migration 4: Etiketler (Branch 4) ---

Tablo ekleme + seed data.
TagCategory, Tag, OpportunityTag tabloları oluşturulur.
Seed script ile varsayılan 4 kategori ve 11 etiket oluşturulur.

--- Migration 5: Fuar KPI (Branch 5) ---

Basit alan ekleme, data migration gerekmez.
Fair modeline targetBudget, targetTonnage, targetLeadCount alanları eklenir.

--- Migration 6: MFA SMS (Branch 6) ---

User modeline phone String? alanı eklenir (E.164 format).
Mevcut kullanıcılar için phone null kalır; admin UserFormModal üzerinden girebilir.

==============================
BRANCH YÖNETİMİ STRATEJİSİ
==============================

7 branch, her biri bağımsız bir dikey dilim:

  Branch                              Feature'lar   Bağımlılık
  ──────────────────────────────────  ────────────  ──────────────
  feature/F32-F33-urun-tonaj         F32, F33      Yok
  feature/F34-F36-pipeline           F34, F35, F36 Yok
  feature/F37-F38-notlar             F37, F38      Yok
  feature/F39-F41-etiketler          F39, F40, F41 Yok
  feature/F42-F43-fuar-kpi           F42, F43      Branch 1 + 2
  feature/F46-F47-mfa-sms            F46, F47      Yok
  feature/F44-timeline               F44           Branch 2 + 3 + 4
  feature/F45-test                   F45           Hepsi

Zorunlu uygulama sırası:

  1. Branch 1 (Ürün Tonaj)    → main'e merge
     products[] yapısını değiştiren en kritik migration ilk yapılır.

  2. Branch 2 (Pipeline)      → main'e merge
     En kapsamlı özellik. Erken yapılması hataların erken yakalanmasını sağlar.

  3. Branch 3 (Notlar)        → main'e merge
     Bağımsız ve küçük. Hızlıca tamamlanır.

  4. Branch 4 (Etiketler)     → main'e merge
     Bağımsız ama orta büyüklükte. TagModule yeni bir modül oluşturur.

  5. Branch 5 (Fuar KPI)      → main'e merge
     Branch 1'den tonaj toplamı ve Branch 2'den pipeline verileri gerekir.

  6. Branch 6 (MFA SMS)       → main'e merge
     Login sırasında SMS OTP ile iki faktörlü kimlik doğrulama.

  7. Branch 7 (Timeline)      → main'e merge
     Branch 2, 3, 4'ten aşama, not ve etiket verileri gerekir.

  8. Branch 8 (Test)          → main'e merge
     Uçtan uca entegrasyon testi.

Her branch merge öncesi zorunlu kontroller:
  [ ] npm run build -w packages/shared — hatasız
  [ ] npm run build -w apps/api — hatasız
  [ ] npm run build -w apps/web — hatasız
  [ ] Özellik browser'da uçtan uca test edildi
  [ ] Migration sonrası veri doğrulaması yapıldı (varsa)

Her branch merge öncesi DB yedeği:
  Migration içeren branch'lerde (1, 2, 3, 4, 5, 6) merge öncesi
  pg_dump ile veritabanı yedeği alınır.

==============================
CONTEXT WINDOW YÖNETİMİ
==============================

Her feature, tek bir context window (conversation) içinde tamamlanabilecek
büyüklükte tasarlanmıştır. Tahmini boyutlar:

  Feature  Tahmini Yeni/Değişen Satır  Dosya Sayısı  Büyüklük
  ───────  ──────────────────────────  ────────────  ────────────
  F32      ~350 satır                  ~10 dosya     Orta
  F33      ~300 satır                  ~4 dosya      Orta
  F34      ~250 satır                  ~8 dosya      Küçük
  F35      ~400 satır                  ~5 dosya      Orta
  F36      ~500 satır                  ~8 dosya      Orta–Büyük ⚠
  F37      ~250 satır                  ~7 dosya      Küçük
  F38      ~250 satır                  ~5 dosya      Küçük
  F39      ~550 satır                  ~10 dosya     Orta–Büyük ⚠
  F40      ~300 satır                  ~4 dosya      Orta
  F41      ~200 satır                  ~5 dosya      Küçük
  F42      ~300 satır                  ~6 dosya      Orta
  F43      ~350 satır                  ~5 dosya      Orta
  F46      ~450 satır                  ~12 dosya     Orta–Büyük ⚠
  F47      ~350 satır                  ~6 dosya      Orta
  F44      ~400 satır                  ~6 dosya      Orta
  F45      Test — dosya değişikliği minimal         Küçük

⚠ işaretli feature'lar context window sınırına yaklaşabilir.
Bu durumda şu strateji uygulanır:
  - Feature'ın backend ve frontend kısımları ayrı session'larda yapılır.
  - Aynı branch üzerinde devam edilir, sadece conversation yenilenir.
  - Her session başında "Bu branch'te F36 frontend'ini yapıyorum,
    backend tamamlandı" gibi bağlam özeti verilir.

F36 (Frontend Pipeline) özellikle büyüktür (5 bileşen). Gerekirse:
  - Session A: PipelineProgressBar + StageTransitionModal
  - Session B: StageHistory + OpportunityCard/Toolbar güncellemeleri

==============================
FEATURE LİSTESİ (F32 — F47)
==============================

Önemli: Feature'lar branch'ler içinde sırayla uygulanır.
Her branch kendi içinde sıralıdır, branch'ler arası sıra yukarıda belirtilmiştir.
Her feature tamamlandığında Durum alanı [x] olarak işaretlenir.

╔══════════════════════════════════════════════════════════╗
║  BRANCH 1: ÜRÜN TONAJ                                    ║
║  Branch: feature/F32-F33-urun-tonaj                      ║
║  Bağımlılık: Yok (ilk branch)                            ║
╚══════════════════════════════════════════════════════════╝

----------------------------------------------------------------------
F32 — Ürün Tonaj: Shared + DB + Backend
----------------------------------------------------------------------

Amaç: Fırsat içindeki ürün seçimini String[] yerine ayrı bir tabloya
taşımak ve her ürün için tonaj/ağırlık bilgisi girilmesini sağlamak.

Yapılacaklar:

1. packages/shared/src/types/opportunity-product.ts oluştur:
   - OpportunityProduct interface:
     id: string
     opportunityId: string
     productId: string
     productName: string (populated, Product.name)
     quantity: number | null
     unit: string (default: "ton")
     note: string | null
     createdAt: string
     updatedAt: string

2. packages/shared/src/types/opportunity.ts güncelle:
   - OpportunityWithCustomer → OpportunityWithDetails olarak genişlet:
     + opportunityProducts: OpportunityProduct[]
   - products: string[] alanını kaldır
   (Geriye uyumluluk: geçiş sırasında her iki alan da olabilir)

3. packages/shared/src/schemas/opportunity-product.ts oluştur:
   - opportunityProductItemSchema:
     productId: z.string().min(1)
     quantity: z.number().positive().nullable().optional()
     unit: z.enum(['ton', 'kg', 'adet']).optional().default('ton')
     note: z.string().nullable().optional()
   - opportunityProductsSchema:
     z.array(opportunityProductItemSchema).optional().default([])

4. packages/shared/src/schemas/opportunity.ts güncelle:
   - createOpportunitySchema: products alanını kaldır
   - opportunityProducts alanını ekle (opportunityProductsSchema)

5. packages/shared/src/types/index.ts ve schemas/index.ts güncelle

6. apps/api/prisma/schema.prisma güncelle:
   - OpportunityProduct modeli ekle (yukarıdaki veri modeline göre)
   - Product modeline opportunityProducts relation ekle
   - Opportunity modeline opportunityProducts relation ekle

7. Migration çalıştır (3 adımlı, data migration dahil):
   - Adım 1: OpportunityProduct tablosu oluştur
   - Adım 2: Mevcut products[] → OpportunityProduct data migration
   - Adım 3: Opportunity.products alanını kaldır
   npx prisma migrate dev --name urun-tonaj

8. modules/opportunity/opportunity.service.ts güncelle:
   - create(): opportunityProducts nested create ile birlikte oluştur
     prisma.opportunity.create({
       data: { ...dto, opportunityProducts: { create: dto.opportunityProducts.map(...) } },
       include: { customer: true, opportunityProducts: { include: { product: true } } }
     })
   - findByFair(): response'a opportunityProducts dahil et
   - update(): opportunityProducts gönderildiğinde mevcut kayıtları sil, yenilerini oluştur
     (deleteMany + createMany transaction)
   - toOpportunityResponse(): opportunityProducts mapping ekle

9. modules/opportunity/opportunity.controller.ts güncelle:
   - Response type'larını güncelle (opportunityProducts dahil)

10. Migration sonrası doğrulama:
    - Mevcut Opportunity'lerin products[] verisi OpportunityProduct'a aktarılmış mı?
    - Product referansları doğru mu?

Etkilenen dosyalar:
  YENİ: types/opportunity-product.ts, schemas/opportunity-product.ts
  DEĞİŞEN: types/opportunity.ts, types/index.ts,
            schemas/opportunity.ts, schemas/index.ts,
            schema.prisma, opportunity.service.ts, opportunity.controller.ts
  YENİ: migrations/YYYYMMDD_urun_tonaj/

Bağımlılık: Yok (ilk adım)
Commit: feat(shared): add OpportunityProduct types and schemas
Commit: feat(prisma): add OpportunityProduct model, migrate products data
Commit: feat(api): update Opportunity service for product tonnage

Durum: [x]

----------------------------------------------------------------------
F33 — Ürün Tonaj: Frontend UI
----------------------------------------------------------------------

Amaç: OpportunityFormModal'da ürün seçimi + tonaj girişini kullanıcı dostu
bir deneyimle sunmak. OpportunityCard'da tonaj bilgisini göstermek.

Yapılacaklar:

1. components/opportunity/ProductQuantityList.tsx oluştur:

   Props:
     selectedProducts: Array<{ productId, productName, quantity, unit, note }>
     availableProducts: Product[] (useProducts hook'undan)
     onChange: (products: Array<...>) => void

   Tasarım — İki bölümlü alan:

   a) Ürün seçim alanı (üst):
      - Mevcut ToggleChip yapısı korunur (ürün listesi DB'den)
      - Ürün seçildiğinde alt listeye eklenir
      - Seçili ürünler vurgulu (accent) gösterilir

   b) Seçili ürünler listesi (alt):
      - Her seçili ürün bir satır:
        Sol: Ürün adı (14px, muted-text)
        Orta: Miktar input (number, placeholder: "Miktar",
              compact, 80px genişlik, sağa hizalı)
            + Birim select (ton/kg/adet, 70px, varsayılan: ton)
        Sağ: × kaldır butonu (muted, hover: danger)
      - Satırlar arası 8px gap
      - Ürün eklendiğinde/kaldırıldığında smooth animasyon (opacity + translateY)
      - Liste boşken gizli

   c) Toplam özet (listenin altında):
      - Tonaj girilmiş ürünler varsa: "Toplam: 270 ton" (muted, 12px)
      - Farklı birimler varsa birim bazında gruplama: "150 ton, 500 kg"

2. components/opportunity/OpportunityFormModal.tsx güncelle:
   - Mevcut ToggleChip ürün seçim alanını ProductQuantityList ile değiştir
   - Form state: products string[] → opportunityProducts array
   - Submit DTO: opportunityProducts: [{ productId, quantity, unit, note }]
   - Düzenleme modunda mevcut ürün + tonaj bilgileri dolu gelir

3. components/opportunity/OpportunityCard.tsx güncelle:
   - Kapalı kart: ürün badge'leri yanına tonaj bilgisi ekle
     Örnek: "Kompresörler (50t)" şeklinde kısaltılmış gösterim
   - Genişletilmiş kart: ürün listesinde tam tonaj bilgisi
     Örnek: "Kompresörler — 50 ton"
              "Vana Sistemleri — 120 ton"

4. hooks/use-opportunities.ts güncelle:
   - Response type'larını OpportunityProduct dahil edecek şekilde güncelle

Etkilenen dosyalar:
  YENİ: components/opportunity/ProductQuantityList.tsx
  DEĞİŞEN: components/opportunity/OpportunityFormModal.tsx,
            components/opportunity/OpportunityCard.tsx,
            hooks/use-opportunities.ts

Bağımlılık: F32 (backend + DB hazır)
Commit: feat(web): add ProductQuantityList component
Commit: feat(web): integrate product tonnage in OpportunityFormModal and Card

Durum: [x]

╔══════════════════════════════════════════════════════════╗
║  BRANCH 2: PİPELINE (STATÜ YÖNETİMİ)                     ║
║  Branch: feature/F34-F36-pipeline                        ║
║  Bağımlılık: Yok                                         ║
╚══════════════════════════════════════════════════════════╝

----------------------------------------------------------------------
F34 — Pipeline: Shared + DB
----------------------------------------------------------------------

Amaç: Pipeline aşamaları için tip tanımları, Zod şemaları, sabitler
oluşturmak ve veritabanı değişikliklerini yapmak.

Yapılacaklar:

1. packages/shared/src/constants/pipeline.ts oluştur:
   - PIPELINE_STAGES dizisi:
     [{ value: 'tanisma', label: 'Tanışma', order: 1, terminal: false },
      { value: 'toplanti', label: 'Toplantı', order: 2, terminal: false },
      { value: 'teklif', label: 'Teklif', order: 3, terminal: false },
      { value: 'sozlesme', label: 'Sözleşme', order: 4, terminal: false },
      { value: 'satisa_donustu', label: 'Satışa Dönüştü', order: 5, terminal: true },
      { value: 'olumsuz', label: 'Olumsuz Sonuçlandı', order: 6, terminal: true }]
   - PIPELINE_STAGE_VALUES: string[] (Zod enum için)
   - LOSS_REASONS dizisi:
     [{ value: 'price_high', label: 'Fiyat yüksek' }, ...]
   - LOSS_REASON_VALUES: string[] (Zod enum için)
   - getStageLabel(value) → Türkçe label
   - getStageOrder(value) → sıra numarası
   - isTerminalStage(value) → boolean
   - getStageBadgeColor(value) → hex renk kodu
   - getLossReasonLabel(value) → Türkçe label

2. packages/shared/src/types/opportunity-stage.ts oluştur:
   - PipelineStage type (enum değerlerinden)
   - LossReason type
   - OpportunityStageLog interface:
     id, opportunityId, stage, note, createdAt,
     changedBy: { id, name, email }

3. packages/shared/src/schemas/opportunity-stage.ts oluştur:
   - stageTransitionSchema:
     stage: z.enum(PIPELINE_STAGE_VALUES)
     note: z.string().nullable().optional()
     lossReason: z.enum(LOSS_REASON_VALUES).nullable().optional()
   - Custom refine: stage === 'olumsuz' ise lossReason zorunlu

4. packages/shared/src/types/opportunity.ts güncelle:
   - Opportunity interface'e ekle: currentStage: string, lossReason: string | null
   - OpportunityWithDetails'a ekle: stageLogs: OpportunityStageLog[]

5. Export'ları güncelle (types/index.ts, schemas/index.ts, constants/index.ts)

6. apps/api/prisma/schema.prisma güncelle:
   - Opportunity modeline ekle:
     currentStage String @default("tanisma")
     lossReason   String?
     stageLogs    OpportunityStageLog[]
     @@index([currentStage])
   - OpportunityStageLog modeli ekle
   - User modeline ekle:
     stageLogs OpportunityStageLog[] @relation("StageLogChangedBy")

7. Migration çalıştır (data migration dahil):
   - Adım 1: Alanlar ve tablo oluştur
   - Adım 2: Mevcut Opportunity'ler için initial StageLog oluştur
   npx prisma migrate dev --name pipeline

Etkilenen dosyalar:
  YENİ: constants/pipeline.ts, types/opportunity-stage.ts, schemas/opportunity-stage.ts
  DEĞİŞEN: types/opportunity.ts, types/index.ts, schemas/index.ts,
            constants/index.ts, schema.prisma
  YENİ: migrations/YYYYMMDD_pipeline/

Bağımlılık: Yok
Commit: feat(shared): add pipeline stage types, schemas and constants
Commit: feat(prisma): add OpportunityStageLog model and currentStage field

Durum: [x]

----------------------------------------------------------------------
F35 — Pipeline: Backend
----------------------------------------------------------------------

Amaç: Fırsat aşama geçişi, geçmiş görüntüleme ve pipeline
istatistikleri için backend endpoint'leri oluşturmak.

Yapılacaklar:

1. modules/opportunity/opportunity.service.ts'e ekle:

   - transitionStage(id, dto, auditUser):
     Validasyonlar:
       a. Opportunity mevcut mu?
       b. Mevcut aşama terminal değil mi? (Satışa Dönüştü/Olumsuz'dan geçiş yasak)
       c. Hedef aşama mevcut aşamadan ileri mi? (order karşılaştırması)
          VEYA hedef aşama terminal mi? (Olumsuz her aşamadan ulaşılabilir)
       d. Hedef aşama 'olumsuz' ise lossReason var mı?
     İşlem (transaction):
       - OpportunityStageLog oluştur (stage, note, changedById)
       - Opportunity.currentStage güncelle
       - Olumsuz ise Opportunity.lossReason güncelle
     Audit log yaz.

   - getStageHistory(opportunityId):
     OpportunityStageLog kayıtlarını getir (createdAt ASC).
     changedBy bilgisini include et (id, name, email).

   - getPipelineStats(fairId):
     Fuar bazında pipeline istatistikleri:
       - Her aşamadaki fırsat sayısı
       - Toplam açık fırsat sayısı (terminal olmayan)
       - Terminal aşamadaki sayılar (kazanılan, kaybedilen)
     SQL veya Prisma groupBy ile hesapla.

2. modules/opportunity/opportunity.service.ts findByFair güncelle:
   - Query param: currentStage (opsiyonel filtre)
   - Response'a currentStage dahil et

3. modules/opportunity/opportunity.controller.ts'e ekle:
   - POST /opportunities/:id/transition — Aşama geçişi
     @UsePipes(ZodValidationPipe) + stageTransitionSchema
   - GET /opportunities/:id/stages — Aşama geçmişi
   - GET /fairs/:fairId/pipeline-stats — Pipeline istatistikleri
   - GET /fairs/:fairId/opportunities?currentStage=toplanti — Aşama filtresi

4. Opportunity oluşturulduğunda otomatik ilk StageLog kaydet:
   - opportunity.service.ts create() metodunda:
     Opportunity oluştur → StageLog(stage: 'tanisma') oluştur (aynı transaction)

Etkilenen dosyalar:
  DEĞİŞEN: opportunity.service.ts, opportunity.controller.ts

Bağımlılık: F34 (shared + DB hazır)
Commit: feat(api): add pipeline stage transition and history endpoints
Commit: feat(api): add pipeline stats and stage filtering

Durum: [x]

----------------------------------------------------------------------
F36 — Pipeline: Frontend
----------------------------------------------------------------------

Amaç: Pipeline progress bar, aşama geçiş modalı, geçmiş görünümü
ve ilgili kart/toolbar güncellemelerini oluşturmak.

⚠ CONTEXT WINDOW NOTU: Bu feature büyüktür (5 bileşen). Gerekirse
iki session'a bölünebilir:
  Session A: PipelineProgressBar + StageTransitionModal + hooks
  Session B: StageHistory + OpportunityCard/Toolbar güncellemeleri

Yapılacaklar:

1. hooks/use-opportunity-stages.ts oluştur:
   - useTransitionStage(opportunityId):
     POST /opportunities/:id/transition
     onSuccess: invalidate opportunity queries + fair queries
   - useStageHistory(opportunityId):
     GET /opportunities/:id/stages

2. lib/query-keys.ts güncelle:
   - opportunityStages key'leri ekle

3. components/opportunity/PipelineProgressBar.tsx oluştur:

   Props:
     currentStage: string
     onStageClick: (stage: string) => void
     compact?: boolean (kart içi küçük versiyon)

   Tasarım:
     - Yatay bar: PIPELINE_STAGES'ten oluşan adımlar
     - Her adım: yuvarlak ikon + etiket (altta)
     - Adımlar arası çizgi (connecting line)
     - Geçmiş aşamalar: dolu renk (#4ADE80) + ✓ ikon
     - Mevcut aşama: vurgulu renk + subtle pulse animasyon
     - Gelecek aşamalar: muted/disabled (#2A2A3E)
     - Terminal aşamalar özel:
       Satışa Dönüştü: yeşil (#4ADE80) tam bar
       Olumsuz: kırmızı (#F87171) özel gösterim
     - Compact modda etiketler gizli, sadece noktalar
     - Tıklanabilir: ileri yöndeki aşamalara tıklanınca onStageClick

4. components/opportunity/StageTransitionModal.tsx oluştur:

   Props:
     open: boolean
     onClose: () => void
     opportunityId: string
     currentStage: string
     targetStage: string

   İçerik:
     - Başlık: "[Aşama Adı] Aşamasına Geçir"
     - Not textarea (opsiyonel):
       Placeholder aşamaya göre değişir:
         toplanti → "Toplantı notlarınız..."
         teklif → "Teklif detayları..."
         olumsuz → "Olumsuz sonuçlanma hakkında notunuz..."
     - targetStage === 'olumsuz' ise:
       Kayıp nedeni select (ZORUNLU, LOSS_REASONS'tan)
       "Diğer" seçildiğinde ek serbest metin input
     - "Onayla" (accent) + "İptal" (surface) butonları
     - useTransitionStage mutation çağrısı

5. components/opportunity/StageHistory.tsx oluştur:

   Props:
     opportunityId: string
     compact?: boolean

   Tasarım:
     - Dikey zaman çizgisi
     - Her kayıt: aşama badge (renkli) + tarih + kullanıcı adı + not
     - Compact modda son 3 kayıt, "Tümünü göster" bağlantısı

6. components/opportunity/OpportunityCard.tsx güncelle:
   - Kapalı kart: badge satırına currentStage badge'i ekle
     (pipeline.ts'ten renk ve label alınır, küçük chip)
   - Genişletilmiş kart: PipelineProgressBar (compact) + StageHistory (compact)

7. components/fair/OpportunityToolbar.tsx güncelle:
   - Yeni filtre: "Tüm Aşamalar" + PIPELINE_STAGES select dropdown
   - onStageFilterChange prop ekle

Etkilenen dosyalar:
  YENİ: PipelineProgressBar.tsx, StageTransitionModal.tsx,
        StageHistory.tsx, use-opportunity-stages.ts
  DEĞİŞEN: OpportunityCard.tsx, OpportunityToolbar.tsx, query-keys.ts

Bağımlılık: F35 (backend hazır)
Commit: feat(web): add PipelineProgressBar and StageTransitionModal
Commit: feat(web): add StageHistory and integrate pipeline in Card/Toolbar

Durum: [x]


╔══════════════════════════════════════════════════════════╗
║  BRANCH 2.5: AI ANALİTİK CHATBOT                         ║
║  Branch: feature/F46-F47-ai-chatbot                      ║
║  Bağımlılık: Branch 1 + Branch 2                        ║
║  Plan: F46 → F47 → F46a → F47b                              ║
╚══════════════════════════════════════════════════════════╝

----------------------------------------------------------------------
F46 — AI Chatbot: Backend (Claude Entegrasyonu)
----------------------------------------------------------------------

Amaç: Kullanıcının doğal dilde sorduğu sorulara, Fuar/Müşteri/Fırsat
verilerine dayalı analiz üreten AI endpoint'i.

Yapılacaklar:

1. Ortam değişkeni: ANTHROPIC_API_KEY (console.anthropic.com'dan alınır)

2. modules/chat/ modülü oluştur:
   - chat.module.ts
   - chat.service.ts: Claude API çağrısı, veri toplama, prompt oluşturma
   - chat.controller.ts: POST /chat/query

3. Veri toplama (auth user'a göre):
   - Fair listesi (id, name, startDate, endDate, opportunityCount)
   - Opportunity özeti (fair bazında sayı, bütçe toplamı, aşama dağılımı)
   - Customer özeti (firma sayısı, ürün bazlı ilgi)
   - StageLog özeti (aşama geçiş istatistikleri)

4. Request body: { message: string, messages?: { role, content }[], provider?: 'ollama'|'claude' }
   - messages: Opsiyonel. Frontend'den gelen konuşma geçmişi (son N mesaj).
     Kullanıcı çıktı üzerine yorum yaparak düzenleme istediğinde ("bunu
     Excel'e aktar", "grafiği değiştir" vb.) context için kullanılır.
   - Backend messages'ı Claude'a context olarak iletir. DB'de saklanmaz.

5. System prompt (Claude'a gönderilecek):

   Sen bir Fuar CRM Kıdemli Analisti olarak çalışıyorsun. Görevin,
   kullanıcının sorduğu soruyu yanıtlamak ve verilen JSON veriyi
   kullanarak zengin, eyleme geçirilebilir analiz sunmaktır.

   Yanıt stratejin:
   a) Özet: Soruyu kısa bir cümleyle özetle, neyi analiz ettiğini belirt.
   b) Metin yorumu: Veriyi yorumlayarak ana bulguları, trendleri ve
      dikkat çeken noktaları açık, anlaşılır Türkçe ile yaz. Sayıları
      ve oranları vurgula. "Örneğin...", "Bu da şu anlama gelir...",
      "Dikkat edilmesi gereken..." gibi ifadelerle yorumunu zenginleştir.
   c) Grafik önerisi: Soruya uygun tüm grafik türlerini düşün, mümkünse
      birden fazla grafik öner: bar, line, pie, donut, stackedBar,
      tablo, heatmap. Her grafik için JSON: chartType, title, labels,
      data, açıklama metni ("Bu grafik şunu gösterir...").
   d) Proaktif öneriler: Kullanıcının sormadığı ama faydalı olabilecek
      ek analizleri öner (örn. "Ayrıca X fuarının dönüşüm oranını da
      inceleyebilirsiniz").
   e) Excel export: Sadece kullanıcı açıkça Excel/indirme/dışa aktarma
      istediğinde (excel, xlsx, indir, export, dışa aktar vb.) response'a
      exportId ve exportDescription ekle. İstek yoksa Excel üretme.

6. Response formatı:
   { text: string, charts?: ChartData[], tables?: TableData[],
     exportId?: string, exportDescription?: string }

7. Excel export (sadece kullanıcı istediğinde):
   - Kullanıcı mesajında excel/xlsx/indir/export/dışa aktar geçiyorsa
     backend Excel oluşturur (exceljs).
   - Geçici dosya veya signed URL ile indirme sağlanır.
   - GET /chat/export/:exportId — Excel dosyası indirilir.

Etkilenen dosyalar:
  YENİ: modules/chat/*
  DEĞİŞEN: app.module.ts, .env.example

Bağımlılık: Branch 1 + Branch 2
Commit: feat(api): add Claude-powered chat analytics endpoint

Durum: [x]

----------------------------------------------------------------------
F47 — AI Chatbot: Frontend
----------------------------------------------------------------------

Amaç: Chat UI, grafik/tablo render, Excel indirme.

Konuşma geçmişi stratejisi:
- Mevcut oturumda: Frontend mesaj listesini state'te tutar. Her API
  çağrısında son 10 mesaj (user + assistant) backend'e gönderilir.
  Kullanıcı çıktı üzerine yorum yaparak içeriği düzenleyebilir
  ("Excel'e aktar", "bu grafiği değiştir" vb.).
- Ekran kapatıldığında (sayfa değişimi, refresh, tab kapatma) geçmiş
  silinir. Kalıcı konuşma kaydı yok.
- Gelecek: ChatGPT tarzı kalıcı konuşma geçmişi (sol menüde sohbet
  listesi, eski sohbetlere dönüş, DB'de ChatConversation + ChatMessage)
  ayrı bir feature olarak eklenecektir.

Yapılacaklar:

1. hooks/use-chat.ts oluştur:
   - useChatQuery(): POST /chat/query { message, messages }
     messages: son 10 mesaj (role, content) — context için
   - useChatExport(exportId): GET /chat/export/:exportId (blob indirme)

2. lib/query-keys.ts güncelle: chat key'leri

3. app/(dashboard)/chat/page.tsx oluştur:
   - Tam sayfa chat arayüzü
   - Layout: Sol menüye "AI Analiz" veya "Chat" linki eklenir

4. components/chat/ChatPanel.tsx oluştur:

   Tasarım:
   - Üst: Sayfa başlığı "AI Analiz Asistanı" + kısa açıklama
     ("Fuar ve müşteri verilerinizi sorarak analiz edin.")
   - Orta: Konuşma alanı (scroll, flex-1)
     - Kullanıcı mesajları: sağda, accent border, rounded-xl
     - AI yanıtları: solda, surface bg, rounded-xl
     - Her mesajda avatar (kullanıcı: 👤, AI: 🤖)
     - AI yanıtı: önce metin (whitespace-pre-wrap), sonra grafikler,
       sonra tablolar, en sonda exportId varsa "📥 Excel İndir" butonu
   - Alt: Input alanı (sticky, max-w-960px ortalı)
     - Textarea (min 2 satır, max 6 satır, resize vertical)
     - "Gönder" butonu (accent)
     - Loading: Buton "Analiz ediliyor...", mesaj alanında "Analiz Hazırlanıyor" bounce animasyonu

5. components/chat/ChartRenderer.tsx oluştur:

   Props: chart: { chartType, title, labels, data, description? }

   Tasarım:
   - chartType'a göre recharts bileşeni: BarChart, LineChart, PieChart,
     AreaChart, ComposedChart (stacked bar)
   - Başlık: 14px font-semibold, text rengi
   - Grafik: rounded-xl border, bg-surface, padding
   - Altında description varsa: 12px muted, italic
   - Responsive: container max-width, grafik %100

6. components/chat/TableRenderer.tsx oluştur:

   Props: table: { columns: string[], rows: any[][] }

   Tasarım:
   - Overflow-x-auto ile yatay scroll
   - Header: bg-surface, font-semibold, border-b
   - Satırlar: zebra striping (alternatif satır rengi)
   - Hücre: padding, truncate uzun metinlerde
   - Max-height + scroll (çok satırda)

7. components/chat/ChatMessage.tsx oluştur:

   Props: message: { role, content, charts?, tables?, exportId? }

   Tasarım:
   - role === 'user': sağa hizalı, compact
   - role === 'assistant': sola hizalı, geniş
   - content: paragraf boşlukları korunarak render
   - charts: her biri ChartRenderer ile, aralarında gap-4
   - tables: her biri TableRenderer ile, aralarında gap-4
   - exportId: "📥 Excel İndir" butonu, onClick → download

8. Layout güncellemesi:
   - components/layout/Sidebar veya Navigation: "AI Analiz" menü öğesi
   - İkon: 💬 veya chart/analytics ikonu

Etkilenen dosyalar:
  YENİ: app/(dashboard)/chat/page.tsx, ChatPanel.tsx, ChartRenderer.tsx,
        TableRenderer.tsx, ChatMessage.tsx, use-chat.ts
  DEĞİŞEN: query-keys.ts, layout/navigation

Bağımlılık: F46 (backend hazır)
Commit: feat(web): add AI chat analytics UI
Commit: feat(web): add chart/table renderers and Excel download

Durum: [x]


----------------------------------------------------------------------
F46a — AI Chatbot: Çoklu Model Desteği (Ollama + Claude)
----------------------------------------------------------------------

Amaç: Chat ekranında dropdown ile AI modeli seçimi. Local Ollama
(qwen2.5-coder:7b) veya bulut Claude API kullanılabilir.

Yapılacaklar:

1. packages/shared güncelle:

   types/chat.ts:
   - AIProvider tipi ekle: type AIProvider = 'ollama' | 'claude';
   - ChatQueryInput interface'ine provider?: AIProvider ekle (opsiyonel)

   schemas/chat.schema.ts:
   - chatQueryObjectSchema'ya provider alanı ekle:
     provider: z.enum(['ollama', 'claude']).optional().default('ollama')
   - ChatQueryInput artık { message, messages?, provider? } içerir

2. Backend — modules/chat/chat.service.ts güncelle:

   Provider routing:
   - dto.provider === 'ollama' ise Ollama API çağrısı
   - else (varsayılan) Claude API çağrısı, mevcut implementasyon

   Ollama entegrasyonu:
   - Ortam: OLLAMA_BASE_URL (default: http://localhost:11434)
   - Model: OLLAMA_MODEL (default: qwen2.5-coder:7b)
   - API: POST {OLLAMA_BASE_URL}/api/chat
       Body: {
         model: OLLAMA_MODEL,
         messages: [{ role: 'system', content: systemPrompt }, ...userMessages],
         stream: false
       }
   - System prompt: Mevcut buildSystemPrompt ile aynı
   - User messages: input.messages + input.message, format Ollama'ya uygun
   - Yanıt: response.message.content — JSON parse (text, charts, tables)
   - Hata: ECONNREFUSED / Ollama erişilemezse:
     "Ollama çalışmıyor. Lütfen 'ollama serve' ile başlatın veya Claude seçin."

   Claude: Mevcut implementasyon korunur (ANTHROPIC_API_KEY)

3. Backend — .env.example güncelle:
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_MODEL=qwen2.5-coder:7b
   (ANTHROPIC_API_KEY mevcut — Claude için)

4. Frontend — components/chat/ChatPanel.tsx güncelle:
   - Üst bölüme (başlık altına) model seçim dropdown ekle
   - Seçenekler:
     - "Claude (Bulut)" — value: claude
     - "Ollama Qwen (Yerel)" — value: ollama
   - Seçilen değer useState ile tutulur
   - useChatQuery mutation'a provider parametresi geçirilir

5. Frontend — hooks/use-chat.ts güncelle:
   - useChatQuery(input) — input'a provider eklenir
   - POST body: { message, messages, provider }

6. docs/deployment-and-env-strategy.md güncelle:
   - OLLAMA_BASE_URL, OLLAMA_MODEL (opsiyonel, sadece Ollama kullanılacaksa)

Etkilenen dosyalar:
  DEĞİŞEN: packages/shared (types/chat, schemas/chat),
            chat.service.ts, ChatPanel.tsx, use-chat.ts,
            .env.example, deployment-and-env-strategy.md

Bağımlılık: F46, F47 tamamlanmış olmalı
Commit: feat(shared): add AIProvider type and provider to chat schema
Commit: feat(api): add Ollama provider support in ChatService
Commit: feat(web): add model selector dropdown to ChatPanel

Durum: [x]


----------------------------------------------------------------------
F47b — AI Chatbot: Grafik Tasarımı ve Chat İçi Dashboard Layout
----------------------------------------------------------------------

Amaç: Grafikleri daha çekici hale getirmek ve AI yanıtlarını chat içinde
doğrudan dashboard düzeninde göstermek. Kullanıcı soru sorduğunda
grafikler buton olmadan, mesaj içinde grid layout ile gösterilir.

Yapılacaklar:

1. ChartRenderer tasarım iyileştirmeleri:

   Renk paleti (mevcut tek sarı kaldırılır):
   - Bar / Line / Area grafikler için:
     [#3B82F6, #10B981, #F59E0B, #8B5CF6, #EC4899, #6366F1]
     (mavi, yeşil, amber, mor, pembe, indigo)
   - Pie / Donut grafikler için:
     Aynı palet, her dilim farklı renk (Cell fill)
   - StackedBar / Composed: Her seri farklı renk (barKeys sırasına göre)

   Gradient ve görsel efektler:
   - Area grafiklerde: fill için linear-gradient (açık → koyu)
     SVG defs: <defs><linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
       <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.4} />
       <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
     </linearGradient></defs>
     Area: fill="url(#areaGradient)"
   - Bar grafiklerde: fill için solid renk (paletten, seri sırasına göre)
   - Line grafiklerde: stroke paletten, dot fill aynı renk

   Tasarım sistemi uyumu:
   - Container: border-border, bg-surface (mevcut)
   - Başlık: text-text, font-semibold
   - Tooltip: CustomTooltip mevcut, bg-surface, border-border
   - Altında description: text-muted, italic

   Responsive:
   - Grafik yüksekliği: 240px (mevcut)
   - ResponsiveContainer genişlik %100

2. ChatMessage — Chat içi dashboard layout:

   Mevcut davranış: charts ve tables alt alta, flex-col gap-4
   Yeni davranış: Grafikler grid layout ile dashboard hissi

   Layout yapısı:
   - Önce metin (content): paragraf, whitespace-pre-wrap (değişmez)
   - Sonra grafikler + tablolar birlikte: CSS Grid
   - Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3, gap-4
   - Her grafik/tablo bir kart: rounded-xl, border, bg-surface, p-4
   - Tablolar: 1 grafik = 1 grid item, geniş tablolar grid-column: span 2

   Responsive:
   - Mobil (< 768px): 1 sütun
   - Tablet (768–1024px): 2 sütun
   - Desktop (> 1024px): 3 sütun

   Özel durumlar:
   - 1 grafik: Tam genişlik (tek sütun)
   - 2 grafik: 2 sütun yan yana (md+)
   - 3+ grafik: Grid doldurur, 3. sütun lg+ breakpoint'te
   - Tablo + grafik karışık: Her biri grid item, tablolar genişse span-2

   Görsel hiyerarşi:
   - Metin özeti en üstte (okunabilir, 14px)
   - Grid alanı: gap-4, kartlar eşit yükseklikte (min-h) değil, içerik kadar
   - Her kart: shadow-sm (opsiyonel), hover'da subtle border vurgusu
   - Export butonu: Grafiklerin/tabloların altında, aynı hizada (değişmez)

3. ChatPanel — Üst alan düzeni:

   Başlık + model dropdown (F46a) zaten varsa:
   - "AI Analiz Asistanı" + kısa açıklama
   - Model dropdown sağda veya hemen altında

   Konuşma alanı:
   - AI mesajları geniş: max-w-[85%] yerine max-w-[95%] veya tam genişlik
     (dashboard grid için daha fazla alan)
   - Scroll: overflow-y-auto, flex-1

4. TableRenderer — Tutarlı kart stili:

   - ChartRenderer ile aynı kart: rounded-xl, border-border, bg-surface
   - Header ve satırlar mevcut

Etkilenen dosyalar:
  DEĞİŞEN: ChartRenderer.tsx (renk paleti, gradient)
  DEĞİŞEN: ChatMessage.tsx (grid layout)
  DEĞİŞEN: ChatPanel.tsx (mesaj genişliği, gerekirse)
  DEĞİŞEN: TableRenderer.tsx (kart stili)

Bağımlılık: F47
Commit: feat(web): improve chart styling and inline dashboard grid layout

Durum: [x]


╔══════════════════════════════════════════════════════════╗
║  BRANCH 3: FIRSAT NOTLARI                                ║
║  Branch: feature/F37-F38-notlar                          ║
║  Bağımlılık: Yok                                         ║
╚══════════════════════════════════════════════════════════╝

----------------------------------------------------------------------
F37 — Notlar: Shared + DB + Backend
----------------------------------------------------------------------

Amaç: Fırsat içinde serbest not ekleme, düzenleme ve silme altyapısı.

Yapılacaklar:

1. packages/shared/src/types/opportunity-note.ts oluştur:
   - OpportunityNote interface:
     id, opportunityId, content, createdAt, updatedAt,
     createdBy: { id, name, email }

2. packages/shared/src/schemas/opportunity-note.ts oluştur:
   - createOpportunityNoteSchema:
     content: z.string().min(1, 'Not içeriği zorunludur').max(5000)
   - updateOpportunityNoteSchema:
     content: z.string().min(1).max(5000)

3. Export'ları güncelle

4. apps/api/prisma/schema.prisma güncelle:
   - OpportunityNote modeli ekle
   - Opportunity modeline notes relation ekle
   - User modeline opportunityNotes relation ekle
   npx prisma migrate dev --name notlar

5. modules/opportunity/opportunity.service.ts'e ekle:
   - addNote(opportunityId, content, userId):
     Opportunity varlığını kontrol et. Not oluştur. Audit log yaz.
   - getNotes(opportunityId):
     Notları getir (createdAt DESC). createdBy include et.
   - updateNote(noteId, content, userId):
     Not varlığını kontrol et. Yetki kontrolü (yazan kişi veya admin).
     Güncelle. Audit log yaz.
   - deleteNote(noteId, userId):
     Not varlığını kontrol et. Yetki kontrolü.
     Sil. Audit log yaz.

6. modules/opportunity/opportunity.controller.ts'e ekle:
   - POST   /opportunities/:id/notes        → addNote
   - GET    /opportunities/:id/notes         → getNotes
   - PATCH  /opportunities/:oppId/notes/:noteId  → updateNote
   - DELETE /opportunities/:oppId/notes/:noteId  → deleteNote

7. Opportunity detay response'a son 5 notu dahil et (notes preview)

Etkilenen dosyalar:
  YENİ: types/opportunity-note.ts, schemas/opportunity-note.ts
  DEĞİŞEN: types/index.ts, schemas/index.ts, schema.prisma,
            opportunity.service.ts, opportunity.controller.ts
  YENİ: migrations/YYYYMMDD_notlar/

Bağımlılık: Yok
Commit: feat(shared): add OpportunityNote types and schemas
Commit: feat(prisma): add OpportunityNote model
Commit: feat(api): add note CRUD endpoints for opportunities

Durum: [ ]

----------------------------------------------------------------------
F38 — Notlar: Frontend
----------------------------------------------------------------------

Amaç: Fırsat kartında not ekleme, listeleme, düzenleme, silme UI'ı.

Yapılacaklar:

1. hooks/use-opportunity-notes.ts oluştur:
   - useOpportunityNotes(opportunityId): GET /opportunities/:id/notes
   - useCreateNote(opportunityId): POST
     onSuccess: invalidate notes + opportunity queries
   - useUpdateNote(opportunityId): PATCH
   - useDeleteNote(opportunityId): DELETE

2. lib/query-keys.ts güncelle: opportunityNotes key'leri

3. components/opportunity/OpportunityNotes.tsx oluştur:

   Props:
     opportunityId: string
     compact?: boolean

   Tasarım:
     a) "Not Ekle" alanı (üst):
        - Kapalı hali: "+ Not ekle" butonu (muted, dashed border)
        - Açık hali: textarea + "Kaydet" (accent) + "İptal" (muted) butonları
        - Kaydet sonrası textarea temizlenir ve kapanır

     b) Not listesi (alt):
        - Her not:
          İçerik metni (14px, text rengi)
          Alt satır: kullanıcı adı (muted) + tarih (muted, formatDateTime)
          Hover'da sağ üstte: ✏️ düzenle + 🗑 sil ikonları
            (sadece yazan kişi + admin için görünür)
        - Düzenleme: tıklanınca textarea'ya dönüşür (inline edit)
        - Silme: ConfirmDialog
        - Compact modda: son 3 not + "{N} not daha" bağlantısı

4. components/opportunity/OpportunityCard.tsx güncelle:
   - Kapalı kart: not sayısı > 0 ise küçük 💬 ikonu + sayı badge
   - Genişletilmiş kart: "Notlar" bölümü → OpportunityNotes (compact)

Etkilenen dosyalar:
  YENİ: OpportunityNotes.tsx, use-opportunity-notes.ts
  DEĞİŞEN: OpportunityCard.tsx, query-keys.ts

Bağımlılık: F37 (backend hazır)
Commit: feat(web): add OpportunityNotes component with CRUD
Commit: feat(web): integrate notes in OpportunityCard

Durum: [ ]

╔══════════════════════════════════════════════════════════╗
║  BRANCH 4: ETİKETLER                                     ║
║  Branch: feature/F39-F41-etiketler                       ║
║  Bağımlılık: Yok                                         ║
╚══════════════════════════════════════════════════════════╝

----------------------------------------------------------------------
F39 — Etiketler: Shared + DB + Backend
----------------------------------------------------------------------

Amaç: Admin tarafından yönetilen etiket kategori/etiket CRUD ve
fırsatlara etiket atama backend altyapısı.

Yapılacaklar:

1. packages/shared/src/types/tag.ts oluştur:
   - TagCategory interface: id, name, description?, createdAt, updatedAt, tags: Tag[]
   - Tag interface: id, categoryId, name, color, createdAt, updatedAt
   - OpportunityTag interface: opportunityId, tagId, assignedAt, tag: Tag

2. packages/shared/src/schemas/tag.ts oluştur:
   - createTagCategorySchema: name (zorunlu, unique), description (opsiyonel)
   - updateTagCategorySchema: partial
   - createTagSchema: name (zorunlu), color (zorunlu, hex format)
   - updateTagSchema: partial
   - assignTagSchema: tagId (zorunlu)

3. packages/shared/src/constants/tags.ts oluştur:
   - DEFAULT_TAG_CATEGORIES: seed data (4 kategori, 11 etiket)

4. packages/shared/src/types/opportunity.ts güncelle:
   - OpportunityWithDetails'a ekle: tags: OpportunityTag[]

5. packages/shared/src/constants/api-endpoints.ts güncelle:
   - TAG_CATEGORIES, TAGS endpoint'leri

6. Export'ları güncelle

7. apps/api/prisma/schema.prisma güncelle:
   - TagCategory, Tag, OpportunityTag modelleri ekle
   - Opportunity modeline tags relation ekle
   npx prisma migrate dev --name etiketler

8. Seed script güncelle veya oluştur:
   - Varsayılan 4 kategori + 11 etiket (upsert ile idempotent)

9. modules/tag/ oluştur (yeni NestJS modülü):

   tag.service.ts:
     Admin:
     - createCategory(dto): kategori oluştur
     - getCategories(): tüm kategoriler + etiketleriyle
     - updateCategory(id, dto): güncelle
     - deleteCategory(id): sil (cascade: altındaki etiketler silinir)
     - createTag(categoryId, dto): etiket oluştur
     - updateTag(id, dto): güncelle
     - deleteTag(id): sil (cascade: OpportunityTag'ler silinir,
       silme öncesi kullanan fırsat sayısını kontrol et/logla)
     Genel:
     - getAllTags(): tüm etiketleri kategorileriyle getir (form için)

   tag.controller.ts:
     Admin endpoint'leri (@Roles('admin')):
     - POST   /admin/tag-categories                   → createCategory
     - GET    /admin/tag-categories                    → getCategories
     - PATCH  /admin/tag-categories/:id                → updateCategory
     - DELETE /admin/tag-categories/:id                → deleteCategory
     - POST   /admin/tag-categories/:categoryId/tags   → createTag
     - PATCH  /admin/tags/:id                          → updateTag
     - DELETE /admin/tags/:id                          → deleteTag
     Genel endpoint'ler:
     - GET    /tags                                    → getAllTags

   tag.module.ts:
     - TagController, TagService kaydet
     - TagService export et

10. modules/opportunity/opportunity.service.ts'e ekle:
    - assignTag(opportunityId, tagId, userId): etiket ata, audit log yaz
    - removeTag(opportunityId, tagId, userId): etiket kaldır, audit log yaz
    - findByFair güncelle: tagId query param ile filtreleme desteği
    - Response'a tags dahil et

11. modules/opportunity/opportunity.controller.ts'e ekle:
    - POST   /opportunities/:id/tags        → assignTag
    - DELETE /opportunities/:id/tags/:tagId  → removeTag
    - GET /fairs/:fairId/opportunities?tagId=... → etiket filtresi

12. app.module.ts güncelle: TagModule ekle

Etkilenen dosyalar:
  YENİ: types/tag.ts, schemas/tag.ts, constants/tags.ts,
        tag.module.ts, tag.service.ts, tag.controller.ts
  DEĞİŞEN: types/opportunity.ts, types/index.ts, schemas/index.ts,
            constants/api-endpoints.ts, constants/index.ts,
            schema.prisma, opportunity.service.ts, opportunity.controller.ts,
            app.module.ts
  YENİ: migrations/YYYYMMDD_etiketler/

Bağımlılık: Yok
Commit: feat(shared): add Tag types, schemas and constants
Commit: feat(prisma): add TagCategory, Tag, OpportunityTag models
Commit: feat(api): add TagModule with admin CRUD
Commit: feat(api): add opportunity tagging endpoints and filtering

Durum: [ ]

----------------------------------------------------------------------
F40 — Etiketler: Admin Yönetim Sayfası
----------------------------------------------------------------------

Amaç: Admin için etiket kategori ve etiket yönetim arayüzü.

Yapılacaklar:

1. hooks/use-tags.ts oluştur:
   - useTagCategories(): GET /admin/tag-categories
   - useCreateTagCategory(): POST
   - useUpdateTagCategory(): PATCH
   - useDeleteTagCategory(): DELETE
   - useCreateTag(categoryId): POST
   - useUpdateTag(): PATCH
   - useDeleteTag(): DELETE
   - useAllTags(): GET /tags (form dropdown'ları için)

2. lib/query-keys.ts güncelle: tagCategories, tags key'leri

3. app/(dashboard)/admin/tags/page.tsx oluştur:

   Sayfa düzeni — İki panelli:

   Sol panel: Etiket Kategorileri
     - Liste: her kategori satır olarak (ad + etiket sayısı)
     - Seçili kategori vurgulu (accent border)
     - Alt kısımda: "Yeni Kategori" butonu
     - Kategori ekleme: inline input + kaydet/iptal
     - Hover'da düzenle/sil ikonları

   Sağ panel: Seçili Kategorinin Etiketleri
     - Kategori seçilmediyse: "Sol panelden bir kategori seçin" mesajı
     - Etiket listesi: her etiket bir kart
       - Renkli daire (16px, tag.color) + etiket adı
       - Hover'da düzenle/sil ikonları
     - Silme uyarısı: "Bu etiketi kullanan {N} fırsat var. Silmek istiyor musunuz?"
     - "Yeni Etiket" butonu:
       - Inline form: Etiket adı input + renk seçici
       - Renk seçici: 12 preset renk palette + custom hex input
       - Kaydet/İptal butonları

4. components/layout/ güncelle:
   - Admin menüsüne "Etiketler" (/admin/tags) öğesi ekle

Etkilenen dosyalar:
  YENİ: app/(dashboard)/admin/tags/page.tsx, use-tags.ts
  DEĞİŞEN: query-keys.ts, components/layout/ (admin menü)

Bağımlılık: F39 (backend hazır)
Commit: feat(web): add admin tag management page
Commit: feat(web): add Etiketler to admin navigation

Durum: [ ]

----------------------------------------------------------------------
F41 — Etiketler: Fırsat Etiketleme UI
----------------------------------------------------------------------

Amaç: Fırsat formunda etiket seçimi, kartta etiket gösterimi ve
listede etiket filtreleme.

Yapılacaklar:

1. components/opportunity/OpportunityFormModal.tsx güncelle:
   - "Etiketler" bölümü ekle (İlgilenilen Ürünler'in altında):
     - useAllTags() ile tüm etiketleri çek
     - Kategorilere göre gruplanmış gösterim:
       Kategori başlığı (12px, muted, uppercase)
       Altında: etiket chip'leri (renkli border + ad, tıkla seç/kaldır)
     - Seçili etiketler vurgulu (tag.color arka plan %20 opacity)
   - Submit DTO'suna tagIds ekle (veya form submit sonrası ayrı API çağrıları)

2. components/opportunity/OpportunityCard.tsx güncelle:
   - Kapalı kart: badge satırının SONUNDA renkli noktalar
     - Her atanmış etiket için 6px yuvarlak nokta (tag.color)
     - Max 5 nokta göster, fazlası için "+N" tooltip
     - Noktalar arası 3px gap
   - Genişletilmiş kart: "Etiketler" bölümünde tam chip gösterimi
     - Her etiket: renkli chip (border: tag.color, bg: tag.color %15, text: tag.color)
     - × ile kaldırabilme (inline)

3. components/fair/OpportunityToolbar.tsx güncelle:
   - Etiket filtresi ekle: multi-select dropdown
     - Etiketler kategoriye göre gruplanmış
     - Seçili etiketler badge olarak gösterilir
   - onTagFilterChange prop ekle

Etkilenen dosyalar:
  DEĞİŞEN: OpportunityFormModal.tsx, OpportunityCard.tsx,
            OpportunityToolbar.tsx

Bağımlılık: F39 (backend), F40 (admin sayfası — zorunlu değil ama
  etiketlerin mevcut olması gerekir, seed data yeterli)
Commit: feat(web): add tag selection in OpportunityFormModal
Commit: feat(web): add tag dots in Card and tag filter in Toolbar

Durum: [ ]

╔══════════════════════════════════════════════════════════╗
║  BRANCH 5: FUAR KPI HEDEFLERİ & METRİKLERİ             ║
║  Branch: feature/F42-F43-fuar-kpi                        ║
║  Bağımlılık: Branch 1 (tonaj) + Branch 2 (pipeline)     ║
╚══════════════════════════════════════════════════════════╝

----------------------------------------------------------------------
F42 — Fuar KPI: Shared + DB + Backend
----------------------------------------------------------------------

Amaç: Fuar bazında KPI hedefleri tanımlama ve gerçekleşme metriklerini
hesaplayan backend altyapısı.

Yapılacaklar:

1. packages/shared/src/types/fair.ts güncelle:
   - Fair interface'e ekle:
     targetBudget: string | null
     targetTonnage: number | null
     targetLeadCount: number | null
   - FairMetrics interface oluştur:
     totalOpportunities: number
     wonOpportunities: number
     lostOpportunities: number
     openOpportunities: number
     proposalSentCount: number  (teklif+ aşamadaki)
     totalTonnage: number
     wonTonnage: number
     totalPipelineValue: number (tüm açık bütçe toplamı)
     wonPipelineValue: number
     conversionRate: number (%)
     targetBudgetProgress: number | null (%)
     targetTonnageProgress: number | null (%)
     targetLeadCountProgress: number | null (%)

2. packages/shared/src/schemas/fair.ts güncelle:
   - createFairSchema ve updateFairSchema'ya ekle:
     targetBudget: z.string().nullable().optional()
     targetTonnage: z.number().positive().nullable().optional()
     targetLeadCount: z.number().int().positive().nullable().optional()

3. apps/api/prisma/schema.prisma güncelle:
   - Fair modeline ekle:
     targetBudget    String?
     targetTonnage   Float?
     targetLeadCount Int?
   npx prisma migrate dev --name fuar-kpi

4. modules/fair/fair.service.ts'e ekle:
   - getMetrics(fairId): FairMetrics hesapla
     - Opportunity'leri grupla: currentStage bazında count
     - Tonaj: OpportunityProduct.quantity toplamı (tüm + sadece won)
     - Pipeline değeri: budgetRaw toplamı (parseBudgetRaw ile sayıya çevir)
     - Dönüşüm oranı: won / total × 100
     - Hedef ilerleme: gerçekleşen / hedef × 100 (hedef varsa)
   - findAll(): response'a hedef alanlarını dahil et
   - findById(): response'a hedef alanlarını dahil et

5. modules/fair/fair.controller.ts'e ekle:
   - GET /fairs/:id/metrics → getMetrics

Etkilenen dosyalar:
  DEĞİŞEN: types/fair.ts, schemas/fair.ts, schema.prisma,
            fair.service.ts, fair.controller.ts
  YENİ: migrations/YYYYMMDD_fuar_kpi/

Bağımlılık: Branch 1 (OpportunityProduct mevcut), Branch 2 (currentStage mevcut)
Commit: feat(shared): add Fair KPI types and schema fields
Commit: feat(prisma): add Fair KPI target fields
Commit: feat(api): add Fair metrics calculation endpoint

Durum: [x]

----------------------------------------------------------------------
F43 — Fuar KPI: Frontend (Çekmece)
----------------------------------------------------------------------

Amaç: Fuar detayında animasyonlu çekmece yapısında KPI hedef/gerçekleşme
bölümü oluşturmak.

Yapılacaklar:

1. hooks/use-fair-metrics.ts oluştur:
   - useFairMetrics(fairId): GET /fairs/:id/metrics

2. lib/query-keys.ts güncelle: fairMetrics key'i

3. components/fair/FairKPIDrawer.tsx oluştur:

   Props:
     fairId: string
     targets: { targetBudget, targetTonnage, targetLeadCount }

   Çekmece mekanizması:
     - Başlangıçta kapalı (collapsed)
     - Açma/kapama butonu: FairStats'ın hemen altında
       "📊 Hedefler & Metrikler" başlığı + chevron ikonu
       Chevron 180° rotate animasyonu (0.3s ease)
     - Açılma: max-height transition (0s → calculated height)
       + opacity 0→1 (0.2s delay ile)
     - Kapanma: ters sırada (önce opacity, sonra height)
     - overflow: hidden (animasyon sırasında)

   Çekmece içeriği:

   a) Hedef progress bar'ları (üst bölüm):
      3 kart yan yana (responsive: mobilde alt alta):

      Fırsat Hedefi:
        "{gerçekleşen} / {hedef}" (büyük sayılar)
        Progress bar (genişlik: yüzdeye göre)
        Yüzde badge: "%75"

      Tonaj Hedefi:
        "{gerçekleşen} ton / {hedef} ton"
        Progress bar + yüzde

      Bütçe Hedefi:
        "{gerçekleşen} / {hedef}" (formatBudget)
        Progress bar + yüzde

      Progress bar renkleri:
        %0–50: kırmızı (#F87171)
        %50–80: turuncu (#FFB347)
        %80–100: yeşil (#4ADE80)
        %100+: parlak yeşil + "🎯 Hedef Aşıldı!" badge

      Hedef tanımlanmamışsa:
        Kart yerine "Hedef belirlenmemiş" mesajı + "Fuarı düzenleyerek hedef ekleyin" link

   b) Ek metrik kartları (alt bölüm):
      Küçük KPI kartları grid (auto-fill, minmax(150px, 1fr)):
        - Kazanılan Fırsat (yeşil sayı)
        - Kaybedilen Fırsat (kırmızı sayı)
        - Teklif Verilen (mavi sayı)
        - Kazanılan Tonaj (gold sayı + " ton")
        - Dönüşüm Oranı (yüzde, renk kodlu)
        - Pipeline Değeri (formatBudget)

4. Fuar düzenleme formuna KPI hedef alanları ekle:
   - FairForm bileşenine (veya modal'a) 3 yeni input:
     "Fırsat Hedefi" (number)
     "Tonaj Hedefi" (number + ton)
     "Bütçe Hedefi" (formatBudget + para birimi)
   - Bu alanlar opsiyonel

5. app/(dashboard)/fairs/[id]/page.tsx güncelle:
   - FairStats altına FairKPIDrawer ekle
   - useFairMetrics hook'unu entegre et

Etkilenen dosyalar:
  YENİ: FairKPIDrawer.tsx, use-fair-metrics.ts
  DEĞİŞEN: query-keys.ts,
            FairForm veya fuar düzenleme modal'ı (KPI alanları),
            fairs/[id]/page.tsx (drawer entegrasyonu)

Bağımlılık: F42 (backend metrikleri)
Commit: feat(web): add FairKPIDrawer with animated collapse
Commit: feat(web): add KPI target fields to Fair form
Commit: feat(web): integrate KPI drawer in Fair detail page

Durum: [x]

╔══════════════════════════════════════════════════════════╗
║  BRANCH 6: MFA SMS OTP                                  ║
║  Branch: feature/F46-F47-mfa-sms                        ║
║  Bağımlılık: Yok                                        ║
╚══════════════════════════════════════════════════════════╝

----------------------------------------------------------------------
F46 — MFA SMS OTP: Shared + DB + Backend + Sistem Ayarları
----------------------------------------------------------------------

Amaç: Login sırasında Twilio Verify API ile 6 haneli SMS OTP doğrulaması
eklemek. MFA açık/kapalı ve rate limit parametrelerini sistem ayarlarından
yönetmek. Kurumsal güvenlik standartlarına uygun yapı kurmak.

Yapılacaklar:

1. packages/shared/src/types/auth.ts (veya mevcut auth types) güncelle:
   - MfaRequiredResponse interface:
     tempToken: string
     requiresMfa: true
   - VerifyMfaDto type (verifyMfaSchema'dan infer)
   - LoginResponse union: LoginResponse | MfaRequiredResponse
     (MFA açıkken requiresMfa: true dönüldüğünde tokens yok, tempToken var)

2. packages/shared/src/schemas/auth.ts güncelle:
   - verifyMfaSchema:
     tempToken: z.string().min(1, 'Geçersiz oturum')
     code: z.string().length(6, 'Kod 6 haneli olmalıdır').regex(/^\d{6}$/, 'Sadece rakam giriniz')
   - Export VerifyMfaDto type

3. packages/shared/src/types/user.ts güncelle:
   - User interface'e phone: string | null ekle (E.164 format)

4. packages/shared/src/types/index.ts ve schemas/index.ts export'ları güncelle

5. apps/api/prisma/schema.prisma güncelle:
   - User modeline phone String? ekle (E.164: +905551234567)
   - Migration: npx prisma migrate dev --name add_user_phone_mfa

6. modules/settings/settings.service.ts güncelle — DEFAULTS'a ekle:
   - MFA_SMS_ENABLED: 'false' — SMS OTP açık (true) / kapalı (false)
   - RATE_LIMIT_LOGIN_ATTEMPTS: '5' — Login max deneme sayısı
   - RATE_LIMIT_LOGIN_WINDOW_MINUTES: '1' — Login rate limit penceresi (dakika)
   - RATE_LIMIT_MFA_ATTEMPTS: '5' — OTP doğrulama max deneme
   - RATE_LIMIT_MFA_WINDOW_MINUTES: '5' — OTP rate limit penceresi
   - RATE_LIMIT_REGISTER_ATTEMPTS: '3' — Kayıt max deneme
   - RATE_LIMIT_REGISTER_WINDOW_MINUTES: '1' — Kayıt rate limit penceresi

7. twilio paketi kur: npm install twilio -w apps/api

8. apps/api/.env.example güncelle:
   - TWILIO_ACCOUNT_SID
   - TWILIO_AUTH_TOKEN
   - TWILIO_VERIFY_SERVICE_SID (Verify Service oluştur: Twilio Console → Verify → Services)

9. modules/sms/ oluştur (veya auth içinde):
   - sms.module.ts: Twilio client provider
   - sms.service.ts: sendOtp(phone: string): Promise<void>
     Twilio Verify v2: client.verify.v2.services(serviceSid).verifications.create({
       channel: 'sms', to: phone
     })
   - SmsModule'ü AppModule'e ekle

10. modules/auth/auth.service.ts güncelle:
    - SettingsService inject et
    - login() başında: mfaEnabled = await settings.get('MFA_SMS_ENABLED') === 'true'
    - mfaEnabled false ise: mevcut davranış (parola doğru → direkt tokens dön)
    - mfaEnabled true ise:
      a. Parola doğru → user.phone kontrol et
      b. phone yok/boş → throw UnauthorizedException('Telefon numaranız kayıtlı değil. Yöneticinize başvurun.')
      c. Twilio Verify API ile OTP gönder (SmsService)
      d. tempToken üret (JWT, sub: userId, 5 dk süre, farklı secret veya claim)
      e. return { tempToken, requiresMfa: true }
    - verifyMfa(tempToken, code) metodu ekle:
      a. tempToken verify et → userId al
      b. user.phone ile Twilio verificationChecks.create({ to: phone, code })
      c. status === 'approved' ise → generateTokens, return { user, tokens }
      d. değilse → UnauthorizedException('Geçersiz veya süresi dolmuş kod. Lütfen tekrar giriş yapın.')

11. modules/auth/auth.controller.ts güncelle:
    - POST /auth/verify-mfa endpoint ekle
    - Body: { tempToken, code } — ZodValidationPipe(verifyMfaSchema)
    - Response: ApiSuccessResponse<LoginResponse>

12. @nestjs/throttler kur: npm install @nestjs/throttler -w apps/api

13. common/guards/dynamic-throttler.guard.ts oluştur (veya ThrottlerGuard extend):
    - SettingsService'den RATE_LIMIT_* değerlerini oku
    - Path'a göre (login, verify-mfa, register) farklı limit uygula
    - IP bazlı sayaç (memory veya Redis)
    - Limit aşımında ThrottlerException (429)

14. auth.controller.ts'e throttle guard uygula:
    - @UseGuards(DynamicThrottlerGuard) login, verify-mfa, register endpoint'lerinde

15. Güvenlik — Kullanıcı enumeration önleme:
    - login: email/parola hatalı → her zaman "E-posta veya parola hatalı" (aynı mesaj)
    - verify-mfa: kod hatalı/süresi dolmuş → "Geçersiz veya süresi dolmuş kod. Lütfen tekrar giriş yapın."

16. Audit log: Başarısız login ve OTP denemelerini logla (IP, timestamp, email — parola loglanmaz)

17. components/user/UserFormModal.tsx güncelle:
    - phone alanı ekle (Input, placeholder: +905551234567)
    - E.164 format validasyonu (Zod: regex veya refine)
    - Admin kullanıcı oluştururken/düzenlerken telefon girebilmeli

18. docs/deployment-and-env-strategy.md güncelle:
    - TWILIO_* env değişkenleri
    - MFA ve rate limit ayarlarının sistem ayarlarından yönetildiği notu

Etkilenen dosyalar:
  YENİ: schemas/mfa.ts (veya auth schema genişletme), modules/sms/, common/guards/dynamic-throttler.guard.ts
  DEĞİŞEN: types/auth.ts, types/user.ts, schema.prisma, settings.service.ts,
            auth.service.ts, auth.controller.ts, UserFormModal.tsx,
            app.module.ts, deployment-and-env-strategy.md
  YENİ: migrations/YYYYMMDD_add_user_phone_mfa/

Bağımlılık: Yok
Commit: feat(shared): add MFA types and verifyMfaSchema
Commit: feat(prisma): add User.phone for MFA
Commit: feat(api): add MFA SMS settings, Twilio Verify, auth 2-step flow
Commit: feat(api): add dynamic rate limiting for auth endpoints
Commit: feat(web): add phone field to UserFormModal

Durum: [x]

----------------------------------------------------------------------
F47 — MFA SMS OTP: Frontend
----------------------------------------------------------------------

Amaç: Login sayfasında 2 aşamalı akış (email/parola → OTP), hata mesajları
ve sistem ayarları sayfasında MFA/rate limit ayarlarının görünmesi.

Yapılacaklar:

1. components/auth/MfaCodeInput.tsx oluştur:
   - Props: value, onChange, error?, disabled?, onComplete? (6 hane dolunca)
   - 6 haneli OTP input (6 ayrı kutu veya tek input maxLength 6)
   - Sadece rakam kabul (type="tel" veya inputMode="numeric")
   - Otomatik focus: ilk kutuya, sonra sırayla
   - Paste desteği: 6 haneli kod yapıştırıldığında tüm kutulara dağıt
   - Tasarım: mevcut Input stiliyle uyumlu, glassmorphism

2. app/(auth)/login/page.tsx güncelle:
   - State: step 'credentials' | 'otp', tempToken, email, password
   - login() çağrısı → response.requiresMfa === true ise:
     step = 'otp', tempToken sakla, OTP ekranı göster
   - response.requiresMfa !== true ise: mevcut davranış (tokens, redirect)
   - OTP ekranı: "Telefonunuza gelen 6 haneli kodu girin" + MfaCodeInput
   - "Doğrula" butonu → POST /auth/verify-mfa { tempToken, code }
   - Başarı: tokens, redirect /fairs
   - Hata: setError ile ekranda göster

3. stores/auth-store.ts güncelle:
   - login: response tipi kontrol et, requiresMfa ise { tempToken } dön (tokens set etme)
   - verifyMfa(tempToken, code) metodu ekle:
     POST /auth/verify-mfa → { user, tokens } → localStorage + set state

4. Hata mesajları (ekranda gösterilecek):
   - E-posta veya parola hatalı (login)
   - Telefon numaranız kayıtlı değil. Yöneticinize başvurun. (MFA açık, phone yok)
   - Geçersiz veya süresi dolmuş kod. Lütfen tekrar giriş yapın. (OTP hatalı)
   - Çok fazla deneme. Lütfen birkaç dakika bekleyin. (429 rate limit)
   - E-posta zorunludur / Geçerli e-posta giriniz (validation)
   - Parola en az 6 karakter olmalıdır (validation)
   - Kod 6 haneli olmalıdır (validation)
   - API 401/403/429/500 için Axios interceptor: uygun Türkçe mesaj

5. Sistem ayarları sayfası (app/(dashboard)/admin/settings/page.tsx):
   - Mevcut tablo bu branch'te değişmez; settings.service DEFAULTS'a eklenen
     MFA_SMS_ENABLED, RATE_LIMIT_* anahtarları otomatik tabloda görünür
   - Admin "Düzenle" ile değerleri değiştirebilir (MFA_SMS_ENABLED: true/false)
   - Opsiyonel: Boolean ayarlar için dropdown (Açık/Kapalı) — SettingFormModal
     value tipine göre farklı input render edebilir

6. lib/api.ts güncelle (eğer yoksa):
   - 429 response → error message: "Çok fazla deneme. Lütfen birkaç dakika bekleyin."
   - 401 → "Oturumunuz sona erdi. Lütfen tekrar giriş yapın." (login sayfasında farklı)

7. Login sayfası validasyon:
   - E-posta: boş, hatalı format → inline hata
   - Parola: 6 karakterden az → inline hata
   - OTP: 6 hane değilse "Doğrula" disabled

Etkilenen dosyalar:
  YENİ: components/auth/MfaCodeInput.tsx
  DEĞİŞEN: app/(auth)/login/page.tsx, stores/auth-store.ts, lib/api.ts

Bağımlılık: F46 (backend + settings hazır)
Commit: feat(web): add MfaCodeInput and 2-step login flow
Commit: feat(web): add verifyMfa to auth store, error messages
Commit: feat(web): handle rate limit and auth errors in login

Durum: [x]

╔══════════════════════════════════════════════════════════╗
║  BRANCH 7: AKTİVİTE ZAMAN ÇİZELGESİ                     ║
║  Branch: feature/F44-timeline                             ║
║  Bağımlılık: Branch 2 + 3 + 4                            ║
╚══════════════════════════════════════════════════════════╝

----------------------------------------------------------------------
F44 — Aktivite Zaman Çizelgesi (Backend + Frontend)
----------------------------------------------------------------------

Amaç: Fırsat detayında tüm aktiviteleri (aşama geçişleri, notlar,
etiket değişiklikleri) kronolojik tek bir akışta göstermek.

Yapılacaklar:

1. packages/shared/src/types/timeline.ts oluştur:
   - TimelineEntryType: 'stage_change' | 'note' | 'tag_added' | 'tag_removed'
   - TimelineEntry interface:
     id: string
     type: TimelineEntryType
     date: string (ISO)
     user: { id, name, email }
     content: StageChangeContent | NoteContent | TagChangeContent
   - StageChangeContent: { fromStage, toStage, note?, lossReason? }
   - NoteContent: { noteId, content (kırpılmış, max 200 char) }
   - TagChangeContent: { tagId, tagName, tagColor }

2. Export'ları güncelle

3. modules/opportunity/opportunity.service.ts'e ekle:
   - getTimeline(opportunityId, page?, limit?):
     3 kaynaktan veri topla:
       a. OpportunityStageLog → stage_change entry'leri
       b. OpportunityNote → note entry'leri
       c. AuditLog (entityType: 'opportunity', action: 'update',
          before/after'da tags farkı olan) → tag_added/tag_removed entry'leri
     Birleştir, tarihe göre sırala (yeniden eskiye), sayfalama uygula.

4. modules/opportunity/opportunity.controller.ts'e ekle:
   - GET /opportunities/:id/timeline?page=1&limit=20 → getTimeline

5. hooks/use-opportunity-timeline.ts oluştur:
   - useOpportunityTimeline(opportunityId, page?):
     GET /opportunities/:id/timeline

6. lib/query-keys.ts güncelle: opportunityTimeline key'i

7. components/opportunity/ActivityTimeline.tsx oluştur:

   Props:
     opportunityId: string
     compact?: boolean

   Tasarım — Dikey zaman çizelgesi:
     - Sol taraf: dikey çizgi (2px, border rengi) + noktalar (8px, tip renginde)
     - Sağ taraf: entry kartları

     Entry tipleri ve görünümleri:

     stage_change (mavi):
       🔄 ikon + "Tanışma → Toplantı" (badge'ler) + not (varsa, kırpılmış)
       Olumsuz: kırmızı, kayıp nedeni label'ı
       Satışa Dönüştü: yeşil, kutlama stili

     note (gri):
       📝 ikon + not içeriği (kırpılmış, tıkla genişlet)

     tag_added (yeşil):
       🏷 ikon + etiket chip'i + "eklendi"

     tag_removed (kırmızı):
       🏷 ikon + etiket chip'i (üstü çizili) + "kaldırıldı"

     Her satırda sağda:
       Tarih + saat (muted, 12px)
       Kullanıcı adı (muted, 11px)

     Compact mod:
       Son 8 entry + "Tüm geçmişi göster" butonu

     Pagination:
       "Daha fazla göster" butonu (lazy load, sayfa arttır)

8. components/opportunity/OpportunityCard.tsx güncelle:
   - Genişletilmiş kart düzenini yeniden organize et:
     Üst:     PipelineProgressBar (compact)
     Orta:    Detay bilgileri (bütçe, ürünler+tonaj, etiketler, iletişim)
     Alt:     ActivityTimeline (compact) — Notlar bölümünü kapsayacak şekilde
              (Ayrı OpportunityNotes bölümü kaldırılabilir, timeline zaten
              notları gösterir. Ancak "not ekle" butonu korunur.)

   NOT: OpportunityNotes bileşeni not EKLEME için korunur.
   Timeline sadece GÖRÜNTÜLEME içindir. Ekleme ayrıdır.

Etkilenen dosyalar:
  YENİ: types/timeline.ts, ActivityTimeline.tsx, use-opportunity-timeline.ts
  DEĞİŞEN: types/index.ts, opportunity.service.ts, opportunity.controller.ts,
            OpportunityCard.tsx, query-keys.ts

Bağımlılık: Branch 2 (stages), Branch 3 (notes), Branch 4 (tags)
Commit: feat(shared): add Timeline types
Commit: feat(api): add timeline aggregation endpoint
Commit: feat(web): add ActivityTimeline component
Commit: feat(web): integrate timeline in OpportunityCard

Durum: [ ]

╔══════════════════════════════════════════════════════════╗
║  BRANCH 8: TEST & DOĞRULAMA                             ║
║  Branch: feature/F45-test                                ║
║  Bağımlılık: Tüm branch'ler                             ║
╚══════════════════════════════════════════════════════════╝

----------------------------------------------------------------------
F45 — Entegrasyon, Test & Doğrulama
----------------------------------------------------------------------

Amaç: Tüm Faz 3 özelliklerinin uçtan uca doğru çalıştığını test etmek.

Test senaryoları:

MFA SMS OTP:
  [ ] MFA kapalı: email+parola → direkt giriş
  [ ] MFA açık: email+parola doğru → OTP ekranı
  [ ] MFA açık: OTP doğru → giriş başarılı
  [ ] MFA açık: OTP yanlış → hata mesajı
  [ ] MFA açık: OTP süresi dolmuş → yeniden login
  [ ] Telefonu olmayan kullanıcı (MFA açık) → uygun hata
  [ ] Admin: MFA_SMS_ENABLED değiştir → login davranışı güncellenir
  [ ] Admin: RATE_LIMIT_LOGIN_ATTEMPTS değiştir → limit uygulanır
  [ ] Rate limit aşımı → 429 mesajı
  [ ] Login sayfası: tüm hata mesajları ekranda görünüyor

Ürün Tonaj:
  [ ] Fırsat oluşturma: ürün seçimi + tonaj girişi çalışıyor
  [ ] Birden fazla ürün farklı tonajlarla seçilebiliyor
  [ ] Tonajsız ürün seçimi mümkün (quantity = null)
  [ ] Fırsat güncelleme: ürün ekleme/kaldırma/tonaj değiştirme
  [ ] Kart: ürünlerin yanında tonaj bilgisi gösteriliyor
  [ ] Toplam tonaj özeti formda görünüyor

Pipeline:
  [ ] Yeni fırsat: varsayılan aşama "Tanışma"
  [ ] Aşama geçişi: ileri yönde atlamalı geçiş (Tanışma → Teklif)
  [ ] Aşama geçişi: not yazılabiliyor
  [ ] Olumsuz Sonuçlandı: kayıp nedeni zorunlu
  [ ] Terminal aşamadan geri dönüş engeli
  [ ] Aşama geçiş geçmişi doğru görünüyor
  [ ] Pipeline progress bar doğru vurgulama
  [ ] Fırsat listesinde aşamaya göre filtreleme
  [ ] Pipeline istatistikleri doğru

Notlar:
  [ ] Not ekleme çalışıyor
  [ ] Not düzenleme (sadece yazan + admin)
  [ ] Not silme (sadece yazan + admin)
  [ ] Kart üzerinde not sayısı ikonu doğru
  [ ] Not listesi kronolojik sırada

Etiketler:
  [ ] Admin: kategori CRUD çalışıyor
  [ ] Admin: etiket CRUD çalışıyor (renk seçiciyle)
  [ ] Admin: etiket silme uyarısı (kullanan fırsat sayısı)
  [ ] Fırsat: etiket atama/kaldırma çalışıyor
  [ ] Kart kapalı: renkli noktalar görünüyor
  [ ] Kart açık: etiket chip'leri görünüyor
  [ ] Fırsat listesinde etiket filtreleme

Fuar KPI:
  [ ] Fuar düzenleme: KPI hedef alanları kaydediliyor
  [ ] Çekmece: açma/kapama animasyonu akıcı
  [ ] Progress bar'lar doğru yüzde gösteriyor
  [ ] Hedef aşıldığında özel gösterim
  [ ] Hedef tanımsızken uygun mesaj
  [ ] Metrik kartları doğru hesaplanıyor

Aktivite Timeline:
  [ ] Aşama geçişleri timeline'da görünüyor
  [ ] Notlar timeline'da görünüyor
  [ ] Etiket değişiklikleri timeline'da görünüyor
  [ ] Kronolojik sıralama doğru
  [ ] "Daha fazla göster" pagination çalışıyor

Entegrasyon:
  [ ] Tüm özellikler birlikte çalışıyor (fırsat oluştur → ürün+tonaj →
      aşama geçir → not ekle → etiket ata → timeline'da hepsi görünür)
  [ ] Fuar silme: tüm ilişkili veriler (opportunities, products, stages,
      notes, tags) cascade siliniyor
  [ ] Responsive tasarım (1-3 kolon geçişleri)

Build kontrolü:
  [ ] npm run build -w packages/shared — hatasız
  [ ] npm run build -w apps/api — hatasız
  [ ] npm run build -w apps/web — hatasız

Edge case'ler:
  [ ] Ürünsüz fırsat oluşturulabilir
  [ ] Notlu aşama geçişi + notsuz geçiş
  [ ] Çok sayıda etiket atanmış fırsat kartı taşmıyor
  [ ] Uzun not metni düzgün görünüyor
  [ ] Boş fuar (0 fırsat) KPI drawer'da uygun mesaj

Bağımlılık: F32 — F44, F46, F47 tamamlanmış olmalı
Commit: test: verify Phase 3 features end-to-end

Durum: [ ]

==============================
ÖZET — İŞ SIRASI
==============================

Branch 1: Ürün Tonaj
  F32 → Shared + DB + Backend (OpportunityProduct)
  F33 → Frontend (ProductQuantityList + form/kart güncelleme)

Branch 2: Pipeline
  F34 → Shared + DB (aşamalar, StageLog, constants)
  F35 → Backend (transition, history, stats)
  F36 → Frontend (ProgressBar, TransitionModal, History, kart/toolbar)

Branch 3: Notlar
  F37 → Shared + DB + Backend (OpportunityNote CRUD)
  F38 → Frontend (OpportunityNotes bileşeni + kart entegrasyonu)

Branch 4: Etiketler
  F39 → Shared + DB + Backend (TagModule + fırsat etiketleme)
  F40 → Frontend admin etiket yönetim sayfası
  F41 → Frontend fırsat etiketleme UI + filtreleme

Branch 5: Fuar KPI
  F42 → Shared + DB + Backend (Fair KPI alanları + metrik hesaplama)
  F43 → Frontend (FairKPIDrawer + hedef form)

Branch 6: MFA SMS OTP
  F46 → Shared + DB + Backend (Twilio Verify, sistem ayarları, rate limit)
  F47 → Frontend (2 aşamalı login, MfaCodeInput, hata mesajları)

Branch 7: Timeline
  F44 → Backend (timeline endpoint) + Frontend (ActivityTimeline bileşeni)

Branch 8: Test
  F45 → Uçtan uca entegrasyon testi

Toplam: 16 feature, 8 branch, 6 DB migration
Tahmini etki: ~30 yeni dosya, ~20 değişen dosya

Bağımlılık grafiği:

  Branch 1 (Ürün Tonaj) ──┐
                           ├──→ Branch 5 (Fuar KPI) ──┐
  Branch 2 (Pipeline)   ──┤                            │
                           ├──→ Branch 7 (Timeline) ──┼──→ Branch 8 (Test)
  Branch 3 (Notlar)     ──┤                            │
                           │                            │
  Branch 4 (Etiketler)  ──┘                            │
                           │
  Branch 6 (MFA SMS)    ───┘ (bağımsız)

  Branch 1–4, 6 bağımsız

==============================
ÖNEMLİ NOTLAR
==============================

- Bu faz, Fırsat Geçişi Fazı tamamlandıktan sonra uygulanır.
- Her branch merge öncesi DB yedeği alınır (migration içerenler için).
- Dikey dilim yaklaşımı: her branch kendi içinde shared → DB → backend → frontend
  sırasını takip eder ve merge öncesi uçtan uca test edilir.
- conversionRate (satışa dönüşme tahmini) pipeline aşamalarından BAĞIMSIZDIR.
  Kullanıcı her iki değeri de ayrı ayrı yönetir.
- Pipeline aşamalarında otomatik olasılık yüzdesi yoktur.
- Terminal aşamalardan (Satışa Dönüştü, Olumsuz) geri dönüş yoktur.
- Etiket kategorileri ve etiketler admin tarafından yönetilir.
  Kullanıcılar sadece mevcut etiketleri fırsatlara atayabilir.
- Fuar KPI hedefleri opsiyoneldir — tanımlanmamışsa ilgili UI
  "hedef belirlenmemiş" mesajı gösterir.
- ActivityTimeline salt okunurdur — not ekleme ve aşama geçişi
  kendi ayrı UI bileşenleriyle yapılır.
- Context window dolması riski olan feature'lar (F36, F39) gerekirse
  iki session'a bölünebilir, aynı branch üzerinde devam edilir.
- Mobil uygulama bu fazın kapsamı dışındadır.
- Phase 3 tamamlandıktan sonra future-vision.md'deki özellikler değerlendirilir.
