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

Toplam: 14 feature (F32–F45), 7 branch, 5 bağımsız DB migration.

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

Veritabanı (apps/api/prisma/):
  DEĞİŞECEK:
    - schema.prisma (5 yeni model, Opportunity ve Fair model güncellemesi, User relations)
  YENİ:
    - migrations/YYYYMMDD_urun_tonaj/     (Branch 1)
    - migrations/YYYYMMDD_pipeline/        (Branch 2)
    - migrations/YYYYMMDD_notlar/          (Branch 3)
    - migrations/YYYYMMDD_etiketler/       (Branch 4)
    - migrations/YYYYMMDD_fuar_kpi/        (Branch 5)

Backend (apps/api/src/):
  YENİ:
    - modules/tag/tag.module.ts
    - modules/tag/tag.service.ts
    - modules/tag/tag.controller.ts
  DEĞİŞECEK:
    - modules/opportunity/opportunity.service.ts (her branch'te genişleyecek)
    - modules/opportunity/opportunity.controller.ts (her branch'te genişleyecek)
    - modules/opportunity/opportunity.module.ts (import'lar)
    - modules/fair/fair.service.ts (KPI metrikleri)
    - modules/fair/fair.controller.ts (KPI endpoint)
    - app.module.ts (TagModule eklenecek)

Frontend (apps/web/src/):
  YENİ:
    - components/opportunity/ProductQuantityList.tsx
    - components/opportunity/PipelineProgressBar.tsx
    - components/opportunity/StageTransitionModal.tsx
    - components/opportunity/StageHistory.tsx
    - components/opportunity/OpportunityNotes.tsx
    - components/opportunity/ActivityTimeline.tsx
    - components/fair/FairKPIDrawer.tsx
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

Toplam tahmini etki: ~30 yeni dosya, ~20 değişen dosya, 5 migration dosyası.

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

Fırsat pipeline'ı 7 aşamadan oluşur:

  Sıra  Enum Değeri       Görünen Ad              Tür
  ────  ──────────────    ──────────────────────  ──────────
  1     tanisma           Tanışma                 Normal
  2     toplanti          Toplantı                Normal
  3     proje             Proje                   Normal
  4     teklif            Teklif                  Normal
  5     sozlesme          Sözleşme                Normal
  6     satisa_donustu    Satışa Dönüştü          Terminal (+)
  7     olumsuz           Olumsuz Sonuçlandı      Terminal (−)

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

  6. Branch 6 (Timeline)      → main'e merge
     Branch 2, 3, 4'ten aşama, not ve etiket verileri gerekir.

  7. Branch 7 (Test)          → main'e merge
     Uçtan uca entegrasyon testi.

Her branch merge öncesi zorunlu kontroller:
  [ ] npm run build -w packages/shared — hatasız
  [ ] npm run build -w apps/api — hatasız
  [ ] npm run build -w apps/web — hatasız
  [ ] Özellik browser'da uçtan uca test edildi
  [ ] Migration sonrası veri doğrulaması yapıldı (varsa)

Her branch merge öncesi DB yedeği:
  Migration içeren branch'lerde (1, 2, 3, 4, 5) merge öncesi
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
FEATURE LİSTESİ (F32 — F45)
==============================

Önemli: Feature'lar branch'ler içinde sırayla uygulanır.
Her branch kendi içinde sıralıdır, branch'ler arası sıra yukarıda belirtilmiştir.
Her feature tamamlandığında Durum alanı [x] olarak işaretlenir.

╔══════════════════════════════════════════════════════════╗
║  BRANCH 1: ÜRÜN TONAJ                                   ║
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
      { value: 'proje', label: 'Proje', order: 3, terminal: false },
      { value: 'teklif', label: 'Teklif', order: 4, terminal: false },
      { value: 'sozlesme', label: 'Sözleşme', order: 5, terminal: false },
      { value: 'satisa_donustu', label: 'Satışa Dönüştü', order: 6, terminal: true },
      { value: 'olumsuz', label: 'Olumsuz Sonuçlandı', order: 7, terminal: true }]
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

Durum: [ ]

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

Durum: [ ]

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

Durum: [ ]

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

Durum: [ ]

╔══════════════════════════════════════════════════════════╗
║  BRANCH 6: AKTİVİTE ZAMAN ÇİZELGESİ                    ║
║  Branch: feature/F44-timeline                            ║
║  Bağımlılık: Branch 2 + 3 + 4                           ║
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
║  BRANCH 7: TEST & DOĞRULAMA                             ║
║  Branch: feature/F45-test                                ║
║  Bağımlılık: Tüm branch'ler                             ║
╚══════════════════════════════════════════════════════════╝

----------------------------------------------------------------------
F45 — Entegrasyon, Test & Doğrulama
----------------------------------------------------------------------

Amaç: Tüm Faz 3 özelliklerinin uçtan uca doğru çalıştığını test etmek.

Test senaryoları:

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

Bağımlılık: F32 — F44 tamamlanmış olmalı
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

Branch 6: Timeline
  F44 → Backend (timeline endpoint) + Frontend (ActivityTimeline bileşeni)

Branch 7: Test
  F45 → Uçtan uca entegrasyon testi

Toplam: 14 feature, 7 branch, 5 DB migration
Tahmini etki: ~30 yeni dosya, ~20 değişen dosya

Bağımlılık grafiği:

  Branch 1 (Ürün Tonaj) ──┐
                           ├──→ Branch 5 (Fuar KPI) ──┐
  Branch 2 (Pipeline)   ──┤                            │
                           ├──→ Branch 6 (Timeline) ──┼──→ Branch 7 (Test)
  Branch 3 (Notlar)     ──┤                            │
                           │                            │
  Branch 4 (Etiketler)  ──┘                            │
                                                        │
  Branch 1–4 bağımsız ──────────────────────────────────┘

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
