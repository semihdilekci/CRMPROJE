Fırsat Geçişi Fazı — Mimari Dönüşüm Planı
==========================================

Bu doküman, projenin "Müşteri merkezli" yapıdan "Fırsat (Opportunity) merkezli" yapıya
geçişi için gereken tüm değişiklikleri detaylandırır.

Phase 2 Feature 26–30 tamamlandıktan sonra, Phase 2 Feature 31 (ve sonrası) uygulanmadan
ÖNCE bu faz tamamlanmalıdır.

==============================
DEĞİŞİKLİĞİN ÖZETİ
==============================

Mevcut Durum (As-Is):
- Fuar altında doğrudan Müşteri yaratılıyor.
- Customer tablosu hem kişi bilgilerini (firma, ad, telefon, email)
  hem de satış bilgilerini (bütçe, dönüşüm, ürünler, kartvizit) içeriyor.
- DB: Fair → Customer (1:N)

Hedef Durum (To-Be):
- Fuar altında Fırsat (Opportunity) yaratılıyor.
- Müşteri bağımsız bir entity haline geliyor (firma, ad, telefon, email).
- Fırsat, bir Müşteri ve bir Fuar ile ilişkilendiriliyor.
- Satış bilgileri (bütçe, dönüşüm, ürünler, kartvizit) Fırsat üzerinde tutuluyor.
- DB: Fair → Opportunity (1:N), Customer → Opportunity (1:N)

Neden:
Kullanıcılar fuarlarda müşterilerle tanışarak Satış Fırsatları oluşturuyor.
Her fırsat bir müşteriye ait. Aynı müşteri farklı fuarlarda farklı fırsatlara sahip olabilir.
Bu mimari, müşteri bazlı çapraz fuar analizini ve fırsat takibini mümkün kılar.

==============================
ETKİLENEN DOSYALAR (TAM LİSTE)
==============================

Shared Package (packages/shared/src/):
  YENİ:
    - types/opportunity.ts
    - schemas/opportunity.ts
  DEĞİŞECEK:
    - types/customer.ts (budget/conversion/products/cardImage/fairId alanları kaldırılacak)
    - types/fair.ts (FairWithCustomers → FairWithOpportunities)
    - types/index.ts (opportunity export eklenecek)
    - schemas/customer.ts (basitleştirilecek)
    - schemas/index.ts (opportunity export eklenecek)
    - constants/api-endpoints.ts (opportunity endpoint'leri eklenecek)

Veritabanı (apps/api/prisma/):
  DEĞİŞECEK:
    - schema.prisma (Opportunity modeli eklenecek, Customer modeli değişecek)
  YENİ:
    - migrations/YYYYMMDD_firsat_gecisi/ (data migration dahil)

Backend (apps/api/src/):
  YENİ:
    - modules/opportunity/opportunity.module.ts
    - modules/opportunity/opportunity.controller.ts
    - modules/opportunity/opportunity.service.ts
  DEĞİŞECEK:
    - modules/customer/customer.controller.ts (bağımsız CRUD'a dönüşecek)
    - modules/customer/customer.service.ts (basitleştirilecek)
    - modules/customer/customer.module.ts (import'lar güncellenecek)
    - modules/fair/fair.service.ts (customers → opportunities)
    - modules/fair/fair.controller.ts (response type güncellenecek)
    - app.module.ts (OpportunityModule eklenecek)

Frontend (apps/web/src/):
  YENİ:
    - components/opportunity/OpportunityCard.tsx
    - components/opportunity/OpportunityFormModal.tsx
    - components/opportunity/CustomerSelectInput.tsx
    - hooks/use-opportunities.ts
  DEĞİŞECEK:
    - components/fair/CustomerToolbar.tsx → OpportunityToolbar.tsx (yeniden adlandırma + güncelleme)
    - components/fair/FairStats.tsx (Customer[] → Opportunity[] prop)
    - components/fair/FairCard.tsx (_count.customers → _count.opportunities, "müşteri" → "fırsat")
    - hooks/use-customers.ts (basitleştirilecek, bağımsız müşteri CRUD)
    - lib/query-keys.ts (opportunity key'leri eklenecek)
    - app/(dashboard)/fairs/[id]/page.tsx (tam refactor: opportunity yapısına geçiş)
  SİLİNECEK:
    - components/customer/CustomerCard.tsx (OpportunityCard ile değiştirilecek)
    - components/customer/CustomerFormModal.tsx (OpportunityFormModal ile değiştirilecek)

==============================
VERİ MODELİ DEĞİŞİKLİĞİ (ÖNCESİ / SONRASI)
==============================

ÖNCESİ — Customer Modeli:
  id, company, name, phone, email,
  budgetRaw, budgetCurrency, conversionRate, products, cardImage,
  fairId, createdAt, updatedAt

SONRASI — Customer Modeli (basitleştirilmiş):
  id, company, name, phone, email, createdAt, updatedAt

SONRASI — Opportunity Modeli (yeni):
  id, fairId, customerId,
  budgetRaw, budgetCurrency, conversionRate, products, cardImage,
  createdAt, updatedAt

İLİŞKİLER:
  Fair (1) → Opportunity (N)     [Fair silinince Opportunity'ler cascade silinir]
  Customer (1) → Opportunity (N) [Customer silinince Opportunity'ler cascade silinir]
  Opportunity → Fair + Customer  [her opportunity bir fuar ve bir müşteriye aittir]

==============================
DATA MİGRATİON STRATEJİSİ
==============================

Mevcut Customer verileri hem Customer hem Opportunity olarak ayrılacak:

1. Opportunity tablosu oluşturulur.
2. Mevcut her Customer satırı için:
   a. Customer satırı korunur (id değişmez).
   b. Opportunity satırı oluşturulur:
      - fairId: mevcut Customer.fairId
      - customerId: mevcut Customer.id
      - budgetRaw, budgetCurrency, conversionRate, products, cardImage: Customer'dan kopyalanır
3. Customer tablosundan fairId, budgetRaw, budgetCurrency, conversionRate, products, cardImage
   alanları kaldırılır.

NOT: Aynı kişi farklı fuarlarda ayrı Customer satırı olarak mevcut olabilir.
Bu fazda otomatik dedup yapılmaz. Her eski Customer satırı 1:1 korunur.
İleride "Müşteri Birleştirme" özelliği eklenebilir.

==============================
FEATURE LİSTESİ (FG-1 — FG-15)
==============================

Önemli: Bu feature'lar sırayla uygulanmalıdır.
Her FG, bir öncekine bağımlıdır (aksi belirtilmedikçe).
Her FG tamamlandığında Durum alanı [x] olarak işaretlenir.

----------------------------------------------------------------------
FG-1 — Shared: Opportunity Tip ve Schema Tanımları
----------------------------------------------------------------------

Amaç: Opportunity entity'si için TypeScript interface ve Zod validasyon
şemalarını @crm/shared paketinde tanımlamak. Customer tipini basitleştirmek.

Yapılacaklar:

1. packages/shared/src/types/opportunity.ts oluştur:
   - Opportunity interface:
     id: string
     fairId: string
     customerId: string
     budgetRaw: string | null
     budgetCurrency: Currency | null
     conversionRate: ConversionRate | null
     products: string[]
     cardImage: string | null
     createdAt: string
     updatedAt: string
   - OpportunityWithCustomer interface (Opportunity + iç içe Customer bilgisi):
     Opportunity alanları + customer: Customer (populated)

2. packages/shared/src/types/customer.ts güncelle:
   - Kaldırılacak alanlar: budgetRaw, budgetCurrency, conversionRate, products, cardImage, fairId
   - Kalacak alanlar: id, company, name, phone, email, createdAt, updatedAt

3. packages/shared/src/types/fair.ts güncelle:
   - FairWithCustomers → FairWithOpportunities olarak yeniden adlandır
   - customers: Customer[] → opportunities: OpportunityWithCustomer[]

4. packages/shared/src/types/index.ts güncelle:
   - export * from './opportunity' ekle

5. packages/shared/src/schemas/opportunity.ts oluştur:
   - createOpportunitySchema:
     customerId: z.string().min(1, 'Müşteri seçimi zorunludur')
     budgetRaw: z.string().nullable().optional()
     budgetCurrency: z.enum(CURRENCIES).nullable().optional()
     conversionRate: z.enum(CONVERSION_RATES).nullable().optional()
     products: z.array(z.string()).optional().default([])
     cardImage: z.string().nullable().optional()
   - updateOpportunitySchema: createOpportunitySchema.partial()
   - CreateOpportunityDto, UpdateOpportunityDto type export'ları

6. packages/shared/src/schemas/customer.ts güncelle:
   - createCustomerSchema basitleştir:
     company: z.string().min(1, 'Firma adı zorunludur')
     name: z.string().min(1, 'Ad soyad zorunludur')
     phone: z.string().nullable().optional()
     email: z.string().email(...).nullable().optional()
   - Budget, conversion, products, cardImage alanlarını kaldır

7. packages/shared/src/schemas/index.ts güncelle:
   - export * from './opportunity' ekle

8. packages/shared/src/constants/api-endpoints.ts güncelle (varsa):
   - Opportunity endpoint'lerini ekle

Etkilenen dosyalar:
  YENİ: types/opportunity.ts, schemas/opportunity.ts
  DEĞİŞEN: types/customer.ts, types/fair.ts, types/index.ts,
            schemas/customer.ts, schemas/index.ts, constants/api-endpoints.ts

Bağımlılık: Yok (ilk adım)
Commit: feat(shared): add Opportunity types/schemas, simplify Customer

Durum: [x]

----------------------------------------------------------------------
FG-2 — Veritabanı: Opportunity Modeli, Schema Değişikliği & Migration
----------------------------------------------------------------------

Amaç: Prisma schema'da Opportunity modeli oluşturmak, Customer modelini
basitleştirmek ve mevcut verileri migrate etmek.

Yapılacaklar:

1. apps/api/prisma/schema.prisma'da Opportunity modeli ekle:

   model Opportunity {
     id             String   @id @default(cuid())
     budgetRaw      String?
     budgetCurrency String?
     conversionRate String?
     products       String[]
     cardImage      String?
     createdAt      DateTime @default(now())
     updatedAt      DateTime @updatedAt

     fair       Fair     @relation(fields: [fairId], references: [id], onDelete: Cascade)
     fairId     String

     customer   Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
     customerId String

     @@index([fairId])
     @@index([customerId])
     @@index([conversionRate])
   }

2. Customer modelini güncelle:
   - fairId, fair relation, budgetRaw, budgetCurrency, conversionRate,
     products, cardImage alanlarını kaldır
   - opportunities Opportunity[] relation ekle
   - @@index([fairId]) ve @@index([conversionRate]) kaldır

3. Fair modelini güncelle:
   - customers Customer[] → opportunities Opportunity[]

4. Migration stratejisi (ÖNEMLİ — veri kaybını önlemek için adımlar):

   Adım 1: Opportunity tablosunu oluştur (henüz Customer'dan alan kaldırma)
   Adım 2: SQL ile mevcut Customer verilerinden Opportunity satırları oluştur:
     INSERT INTO "Opportunity" (id, "fairId", "customerId", "budgetRaw",
       "budgetCurrency", "conversionRate", products, "cardImage", "createdAt", "updatedAt")
     SELECT gen_random_uuid(), "fairId", id, "budgetRaw", "budgetCurrency",
       "conversionRate", products, "cardImage", NOW(), NOW()
     FROM "Customer"
   Adım 3: Customer tablosundan fırsat alanlarını ve fairId'yi kaldır
   Adım 4: Fair-Customer ilişkisini kaldır, Fair-Opportunity ilişkisini ekle

   NOT: Bu migration custom SQL içerecek. prisma migrate dev --create-only ile
   oluşturup migration dosyasını manuel düzenlemek gerekebilir.

5. Migration'ı çalıştır: npx prisma migrate dev --name firsat-gecisi
6. Prisma client'ı yeniden oluştur: npx prisma generate
7. Migration sonrası veri doğrulaması:
   - Tüm eski Customer kayıtları hâlâ mevcut mu?
   - Her eski Customer için bir Opportunity oluşturulmuş mu?
   - Opportunity.customerId → Customer.id referansları doğru mu?

Etkilenen dosyalar:
  DEĞİŞEN: apps/api/prisma/schema.prisma
  YENİ: apps/api/prisma/migrations/YYYYMMDD_firsat_gecisi/migration.sql

Bağımlılık: FG-1 (shared types mevcut olmalı)
Commit: feat(prisma): add Opportunity model and simplify Customer
Commit: chore(prisma): run firsat-gecisi migration with data transfer

Durum: [x]

----------------------------------------------------------------------
FG-3 — Backend: Customer Modülünü Bağımsız CRUD'a Dönüştür
----------------------------------------------------------------------

Amaç: Customer artık Fair'e doğrudan bağlı değil. Bağımsız müşteri CRUD
endpoint'leri oluşturmak.

Yapılacaklar:

1. customer.controller.ts güncelle:
   Eski endpoint'ler:
     POST   /fairs/:fairId/customers     → KALDIRILACAK
     GET    /fairs/:fairId/customers      → KALDIRILACAK
     PATCH  /customers/:id               → KALACAK
     DELETE /customers/:id               → KALACAK (fırsat bağımlılığı kontrolü ekle)
   Yeni endpoint'ler:
     POST   /customers                   → Yeni müşteri oluştur
     GET    /customers                   → Müşteri listesi (search desteği)
     GET    /customers/:id               → Tekil müşteri
     PATCH  /customers/:id               → Müşteri güncelle
     DELETE /customers/:id               → Müşteri sil

2. customer.service.ts güncelle:
   - create(): fairId parametresini kaldır, sadece müşteri bilgileri al
   - findAll(search?: string): tüm müşterileri listele, opsiyonel arama
     (name veya company üzerinden case-insensitive)
   - findById(id): tekil müşteri getir
   - update(): sadece müşteri alanlarını güncelle (company, name, phone, email)
   - remove(): müşteriye bağlı fırsat varsa uyarı ver veya cascade sil
   - ensureFairExists() kaldır (artık gerekli değil)
   - toCustomerResponse(): basitleştir (budget/conversion/products/cardImage kaldır)

3. customer.module.ts güncelle:
   - Gerekli import'ları düzenle

4. Audit logging'i güncelle:
   - entityType: 'customer' olarak kalır
   - Kaydedilen before/after snapshot'ları basitleştirilmiş Customer yapısında olacak

Etkilenen dosyalar:
  DEĞİŞEN: customer.controller.ts, customer.service.ts, customer.module.ts

Bağımlılık: FG-2 (DB migration tamamlanmış olmalı)
Commit: refactor(api): convert Customer module to standalone CRUD

Durum: [x]

----------------------------------------------------------------------
FG-4 — Backend: Opportunity Modülü Oluştur
----------------------------------------------------------------------

Amaç: Fırsat CRUD işlemlerini yöneten yeni NestJS modülü oluşturmak.
Fair modülündeki eski customer template'ini referans alarak aynı pattern'ı
Opportunity için uygular.

Yapılacaklar:

1. apps/api/src/modules/opportunity/opportunity.module.ts oluştur:
   - AuditModule import et
   - OpportunityController, OpportunityService kaydet
   - OpportunityService export et

2. apps/api/src/modules/opportunity/opportunity.service.ts oluştur:
   - create(fairId, dto, auditUser):
     - Fair varlığını kontrol et (ensureFairExists)
     - Customer varlığını kontrol et (dto.customerId)
     - Opportunity oluştur, customer bilgisini include et
     - Audit log yaz
   - findByFair(fairId, search?, conversionRate?):
     - Fair varlığını kontrol et
     - Opportunity'leri getir, customer bilgisini include et
     - search: Customer.name veya Customer.company üzerinden filtrele
       (Prisma: customer: { OR: [{ name: contains }, { company: contains }] })
     - conversionRate: Opportunity.conversionRate üzerinden filtrele
     - Sıralama: createdAt desc
   - update(id, dto, auditUser):
     - Opportunity varlığını kontrol et
     - Eğer customerId değiştiyse yeni Customer varlığını kontrol et
     - Güncelle, customer include et
     - Audit log yaz
   - remove(id, auditUser):
     - Opportunity varlığını kontrol et
     - Sil
     - Audit log yaz
   - toOpportunityResponse(): Prisma → API response mapping
   - toOpportunityWithCustomerResponse(): customer nested included

3. apps/api/src/modules/opportunity/opportunity.controller.ts oluştur:
   - @Controller() + @UseGuards(JwtAuthGuard)
   - POST   /fairs/:fairId/opportunities    → create
   - GET    /fairs/:fairId/opportunities     → findByFair (query: search, conversionRate)
   - PATCH  /opportunities/:id              → update
   - DELETE /opportunities/:id              → remove
   - ZodValidationPipe ile createOpportunitySchema ve updateOpportunitySchema kullan
   - Standardize response format: { success, message, data }

Etkilenen dosyalar:
  YENİ: opportunity.module.ts, opportunity.controller.ts, opportunity.service.ts

Bağımlılık: FG-2 (DB), FG-1 (shared schemas)
Commit: feat(api): add Opportunity module with CRUD endpoints

Durum: [x]

----------------------------------------------------------------------
FG-5 — Backend: Fair Modülünü Güncelle
----------------------------------------------------------------------

Amaç: Fair modülünün Opportunity yapısıyla çalışmasını sağlamak.

Yapılacaklar:

1. fair.service.ts güncelle:
   - findAll():
     - include: { _count: { select: { customers: true } } }
       → include: { _count: { select: { opportunities: true } } }
     - Response type: Fair & { _count: { opportunities: number } }
   - findById():
     - include: { customers: ... }
       → include: { opportunities: { include: { customer: true }, orderBy: { createdAt: 'desc' } } }
     - Response type: FairWithOpportunities
     - Customer mapping kaldır, Opportunity + Customer mapping ekle
   - remove():
     - Cascade: Fair silinince Opportunity'ler silinir (Customer'lar korunur)
     - Silme uyarı mesajı güncellenir

2. fair.controller.ts güncelle:
   - Response type'ları güncellenecek (FairWithCustomers → FairWithOpportunities)

3. Mevcut fair.module.ts'te değişiklik gerekmez (Prisma üzerinden zaten erişiyor).

Etkilenen dosyalar:
  DEĞİŞEN: fair.service.ts, fair.controller.ts

Bağımlılık: FG-2 (DB), FG-1 (shared types)
Commit: refactor(api): update Fair module to use Opportunities

Durum: [x]

----------------------------------------------------------------------
FG-6 — Backend: Module Kaydı & Entegrasyon Kontrolü
----------------------------------------------------------------------

Amaç: OpportunityModule'ü AppModule'e kaydetmek ve tüm backend
değişikliklerinin sorunsuz çalıştığını doğrulamak.

Yapılacaklar:

1. app.module.ts güncelle:
   - OpportunityModule import et ve imports array'ine ekle

2. Build kontrolü:
   - npm run build (api) — TypeScript hataları olmamalı

3. Manuel API test senaryoları:
   - POST /customers → yeni müşteri oluştur
   - GET /customers → müşteri listesi
   - GET /customers?search=test → arama
   - POST /fairs/:fairId/opportunities → fırsat oluştur (customerId ile)
   - GET /fairs/:fairId/opportunities → fırsat listesi (customer bilgisi dahil)
   - GET /fairs/:fairId/opportunities?search=firma → müşteri adı/firması ile arama
   - GET /fairs/:fairId/opportunities?conversionRate=high → filtre
   - PATCH /opportunities/:id → fırsat güncelle
   - DELETE /opportunities/:id → fırsat sil
   - GET /fairs/:id → fuar detayı (opportunities + customer dahil)
   - GET /fairs → fuar listesi (_count.opportunities)
   - DELETE /fairs/:id → cascade: opportunity'ler silinir, customer'lar korunur

Etkilenen dosyalar:
  DEĞİŞEN: app.module.ts

Bağımlılık: FG-3, FG-4, FG-5
Commit: feat(api): register OpportunityModule in AppModule

Durum: [x]

----------------------------------------------------------------------
FG-7 — Frontend: Hooks & Query Keys Güncelle
----------------------------------------------------------------------

Amaç: Yeni Opportunity API endpoint'lerini tüketen TanStack Query hook'ları
oluşturmak ve mevcut customer hook'larını basitleştirmek.

Yapılacaklar:

1. lib/query-keys.ts güncelle:
   Eklenecek:
     opportunities: {
       byFair: (fairId) => ['opportunities', 'fair', fairId],
       byFairFiltered: (fairId, search?, rate?) =>
         ['opportunities', 'fair', fairId, { search, rate }],
     }
   Güncellenecek:
     customers: {
       all: ['customers'],
       list: (search?) => ['customers', 'list', { search }],
       byId: (id) => ['customers', id],
     }
   (byFair ve byFairFiltered customer key'leri kaldırılacak)

2. hooks/use-opportunities.ts oluştur:
   - useOpportunitiesByFair(fairId, search?, conversionRate?):
     GET /fairs/:fairId/opportunities?search=...&conversionRate=...
   - useCreateOpportunity(fairId):
     POST /fairs/:fairId/opportunities
     onSuccess: invalidate opportunities.byFair, fairs.all, fairs.byId
   - useUpdateOpportunity(fairId):
     PATCH /opportunities/:id
     onSuccess: invalidate opportunities.byFair
   - useDeleteOpportunity(fairId):
     DELETE /opportunities/:id
     onSuccess: invalidate opportunities.byFair, fairs.all, fairs.byId

3. hooks/use-customers.ts basitleştir:
   - useCustomersByFair kaldır → yerine:
   - useCustomers(search?): GET /customers?search=...
     (OpportunityFormModal'daki müşteri araması için)
   - useCreateCustomer(): POST /customers (fairId parametresi yok)
     onSuccess: invalidate customers.all
   - useUpdateCustomer(): PATCH /customers/:id
   - useDeleteCustomer(): DELETE /customers/:id

Etkilenen dosyalar:
  YENİ: hooks/use-opportunities.ts
  DEĞİŞEN: hooks/use-customers.ts, lib/query-keys.ts

Bağımlılık: FG-6 (backend endpoint'leri hazır olmalı)
Commit: feat(web): add Opportunity hooks, simplify Customer hooks

Durum: [x]

----------------------------------------------------------------------
FG-8 — Frontend: CustomerSelectInput Bileşeni (Yeni)
----------------------------------------------------------------------

Amaç: OpportunityFormModal'da kullanılacak müşteri arama-seçme bileşenini
oluşturmak. Var olan müşterilerden seçim veya yeni müşteri hızlı oluşturma.

Yapılacaklar:

1. components/opportunity/CustomerSelectInput.tsx oluştur:

   Props:
     selectedCustomerId: string | null
     onSelect: (customer: Customer) => void

   Davranış:
   a) Arama modu:
      - Text input: müşteri adı veya firma adı yazarak arama
      - Yazıldıkça useCustomers(search) hook'u ile sonuçları listele
      - Dropdown/listede eşleşen müşteriler gösterilir (firma + ad + telefon)
      - Müşteriye tıklanınca onSelect çağrılır
      - Seçili müşteri gösterimi: firma adı + kişi adı + telefon + email
        (kısa özet satırı, yanında "Değiştir" butonu)

   b) Yeni müşteri oluşturma:
      - "Yeni Müşteri Ekle" butonu
      - Butona tıklanınca inline form açılır:
        Firma Adı (zorunlu) + Ad Soyad (zorunlu)
        Telefon (opsiyonel) + E-posta (opsiyonel)
      - "Kaydet" → useCreateCustomer() ile müşteri oluşturulur
      - Başarılıysa otomatik olarak yeni müşteri seçilir (onSelect çağrılır)
      - "İptal" → inline form kapanır, arama moduna döner

   c) Debounce:
      - Arama input'unda 300ms debounce (gereksiz API çağrılarını önlemek için)

   Tasarım:
   - Input stili mevcut Input component ile uyumlu
   - Dropdown: bg-surface, border-border, max-h 200px scroll
   - Her sonuç satırı: firma adı (bold) + kişi adı (normal), hover efekti
   - Seçili müşteri: bg-surface rounded card görünümü

2. Debounce utility: lib/utils.ts veya hooks/use-debounce.ts
   (eğer mevcut değilse) — input değerini geciktirmek için

Etkilenen dosyalar:
  YENİ: components/opportunity/CustomerSelectInput.tsx
  YENİ (gerekirse): hooks/use-debounce.ts

Bağımlılık: FG-7 (useCustomers hook'u hazır olmalı)
Commit: feat(web): add CustomerSelectInput component

Durum: [x]

----------------------------------------------------------------------
FG-9 — Frontend: OpportunityFormModal (CustomerFormModal'dan Dönüşüm)
----------------------------------------------------------------------

Amaç: Mevcut CustomerFormModal'ı OpportunityFormModal'a dönüştürmek.
Form yapısı büyük oranda korunur, ancak müşteri alanları müşteri seçimi
ile değiştirilir.

Yapılacaklar:

1. components/opportunity/OpportunityFormModal.tsx oluştur:
   (CustomerFormModal.tsx temel alınarak)

   Props:
     open: boolean
     onClose: () => void
     fairId: string
     initial?: OpportunityWithCustomer | null

   Modal başlığı:
     isEdit ? 'Fırsatı Düzenle' : 'Yeni Fırsat Yarat'

   Form alanları (yukarıdan aşağıya sırasıyla):

   a) MÜŞTERİ SEÇİMİ (en üst — YENİ ALAN):
      - CustomerSelectInput bileşeni kullan
      - Düzenleme modunda mevcut müşteri önceden seçili gelir
      - Zorunlu alan — müşteri seçilmeden kaydet çalışmaz

   b) TAHMİNİ BÜTÇE (mevcut — aynen kalıyor):
      - Sayısal input + para birimi dropdown
      - Türk formatlaması (toLocaleString)

   c) SATIŞA DÖNÜŞME TAHMİNİ (mevcut — aynen kalıyor):
      - 5 seviyeli toggle group
      - Renk kodlu seçim

   d) İLGİLENİLEN ÜRÜNLER (mevcut — aynen kalıyor):
      - Multi-select ToggleChip
      - Ürün listesi DB'den (useProducts)

   e) KARTVİZİT FOTOĞRAFI (mevcut — aynen kalıyor):
      - File upload + base64 preview

   Kaldırılan alanlar (artık müşteri seçiminden geliyor):
     - Firma Adı input
     - Ad Soyad input
     - Telefon input
     - E-posta input

   handleSubmit:
     - dto: { customerId, budgetRaw, budgetCurrency, conversionRate, products, cardImage }
     - isEdit: useUpdateOpportunity().mutateAsync({ id, dto })
     - isCreate: useCreateOpportunity().mutateAsync(dto)
     - onSuccess: onClose()

   Validasyon:
     - customerId zorunlu (müşteri seçilmeli)
     - Diğer alanlar opsiyonel (mevcut davranış korunur)

Etkilenen dosyalar:
  YENİ: components/opportunity/OpportunityFormModal.tsx

Bağımlılık: FG-7 (hooks), FG-8 (CustomerSelectInput)
Commit: feat(web): add OpportunityFormModal component

Durum: [x]

----------------------------------------------------------------------
FG-10 — Frontend: OpportunityCard (CustomerCard'dan Dönüşüm)
----------------------------------------------------------------------

Amaç: Mevcut CustomerCard'ı OpportunityCard'a dönüştürmek.
Kart tasarımı ve UX büyük oranda korunur, veri kaynağı değişir.

Yapılacaklar:

1. components/opportunity/OpportunityCard.tsx oluştur:
   (CustomerCard.tsx temel alınarak)

   Props:
     opportunity: OpportunityWithCustomer  (müşteri bilgisi dahil)
     fairId: string
     onEdit: () => void

   Kapalı kart görünümü (CustomerCard ile aynı UX):
     - Kişi adı: opportunity.customer.name (700 weight, 15px)
     - Firma adı: opportunity.customer.company (accent rengi, 600 weight)
     - Badge satırı: dönüşüm rozeti (opportunity.conversionRate) + ürün badge'leri (opportunity.products)
     - Sağ üst: kartvizit ikonu (opportunity.cardImage varsa) + ▲/▼

   Genişletilmiş kart görünümü:
     - Tahmini Bütçe: opportunity.budgetRaw + opportunity.budgetCurrency (gold)
     - Kayıt Zamanı: opportunity.createdAt
     - Telefon: opportunity.customer.phone (📞, tıklanabilir)
     - E-posta: opportunity.customer.email (✉️, tıklanabilir)
     - İlgilenilen Ürünler: opportunity.products
     - Kartvizit: opportunity.cardImage
     - ✏️ Düzenle (accent) + 🗑 Sil (kırmızı) butonları

   Silme:
     - useDeleteOpportunity(fairId) kullan
     - ConfirmDialog: "Fırsatı Sil" başlığı
     - Mesaj: "{müşteriAdı} ({firmaAdı}) fırsatını silmek istediğinizden emin misiniz?"

Etkilenen dosyalar:
  YENİ: components/opportunity/OpportunityCard.tsx

Bağımlılık: FG-7 (hooks)
Commit: feat(web): add OpportunityCard component

Durum: [x]

----------------------------------------------------------------------
FG-11 — Frontend: Toolbar & FairStats Güncelleme
----------------------------------------------------------------------

Amaç: CustomerToolbar'ı OpportunityToolbar'a dönüştürmek ve FairStats'ı
Opportunity verisiyle çalışacak şekilde güncellemek.

Yapılacaklar:

1. components/fair/CustomerToolbar.tsx → components/fair/OpportunityToolbar.tsx:
   - Dosyayı yeniden adlandır (veya yeni oluşturup eskiyi sil)
   - Interface: CustomerToolbarProps → OpportunityToolbarProps
   - onAddCustomer prop → onAddOpportunity prop
   - "İsim veya firma ara..." placeholder aynen kalır
     (arama artık fırsatlara bağlı müşterilerin isim/firması üzerinden yapılır)
   - "Tüm Dönüşümler" filtresi aynen kalır
     (fırsatların dönüşme tahmini üzerinden filtreleme)
   - "+ Müşteri Ekle" butonu → "+ Fırsat Ekle" butonu

2. components/fair/FairStats.tsx güncelle:
   - Props: customers: Customer[] → opportunities: OpportunityWithCustomer[]
   - "Toplam Müşteri" → "Toplam Fırsat"
   - Dönüşüm bazlı kartlar: opportunity.conversionRate üzerinden hesapla
   - customers.length → opportunities.length
   - c.conversionRate → o.conversionRate

Etkilenen dosyalar:
  YENİ: components/fair/OpportunityToolbar.tsx (CustomerToolbar yerine)
  DEĞİŞEN: components/fair/FairStats.tsx
  SİLİNECEK: components/fair/CustomerToolbar.tsx

Bağımlılık: FG-1 (shared types)
Commit: refactor(web): rename CustomerToolbar to OpportunityToolbar, update FairStats

Durum: [x]

----------------------------------------------------------------------
FG-12 — Frontend: Fuar Detay Sayfası Entegrasyon
----------------------------------------------------------------------

Amaç: Fuar detay sayfasını yeni Opportunity yapısıyla çalışacak şekilde
tamamen güncellemek.

Yapılacaklar:

1. app/(dashboard)/fairs/[id]/page.tsx güncelle:

   Import değişiklikleri:
     - CustomerCard → OpportunityCard
     - CustomerFormModal → OpportunityFormModal
     - CustomerToolbar → OpportunityToolbar
     - useCustomersByFair → useOpportunitiesByFair
     - Customer type → OpportunityWithCustomer type

   State değişiklikleri:
     - editingCustomer → editingOpportunity
     - showCustomerModal → showOpportunityModal

   Data flow:
     - useCustomersByFair(fairId, search, rateFilter)
       → useOpportunitiesByFair(fairId, search, rateFilter)
     - allCustomers → allOpportunities (fair.opportunities)
     - displayCustomers → displayOpportunities

   JSX değişiklikleri:
     - <FairStats customers={allCustomers} />
       → <FairStats opportunities={allOpportunities} />
     - <CustomerToolbar onAddCustomer={...} />
       → <OpportunityToolbar onAddOpportunity={...} />
     - <CustomerCard customer={...} />
       → <OpportunityCard opportunity={...} />
     - <CustomerFormModal fairId={...} initial={editingCustomer} />
       → <OpportunityFormModal fairId={...} initial={editingOpportunity} />

   Boş durumlar:
     - "Henüz müşteri eklenmemiş..." → "Henüz fırsat eklenmemiş. Yukarıdaki butonu kullanarak fırsat ekleyin."
     - 👥 emoji → uygun bir emoji (💼 veya 🎯)

   Silme uyarı mesajı:
     - "tüm müşteri kayıtlarını" → "tüm fırsat kayıtlarını"

Etkilenen dosyalar:
  DEĞİŞEN: app/(dashboard)/fairs/[id]/page.tsx

Bağımlılık: FG-7, FG-9, FG-10, FG-11
Commit: refactor(web): integrate Opportunity components in Fair detail page

Durum: [x]

----------------------------------------------------------------------
FG-13 — Frontend: FairCard Güncelle
----------------------------------------------------------------------

Amaç: FairCard'daki müşteri sayısı ve terminolojiyi fırsat yapısına
göre güncellemek.

Yapılacaklar:

1. components/fair/FairCard.tsx güncelle:
   - Fair & { _count?: { customers: number } }
     → Fair & { _count?: { opportunities: number } }
   - customerCount = fair._count?.customers ?? 0
     → opportunityCount = fair._count?.opportunities ?? 0
   - "{customerCount}" → "{opportunityCount}"
   - "müşteri kaydı" → "fırsat"

Etkilenen dosyalar:
  DEĞİŞEN: components/fair/FairCard.tsx

Bağımlılık: FG-5 (backend fairs endpoint güncellenmiş olmalı)
Commit: refactor(web): update FairCard to show opportunity count

Durum: [x]

----------------------------------------------------------------------
FG-14 — Temizlik: Eski Customer Yapılarını Kaldır
----------------------------------------------------------------------

Amaç: Artık kullanılmayan eski Customer bileşenlerini ve dosyalarını
temizlemek. Projede "müşteri kartı" konsepti kalmayacak.

Yapılacaklar:

1. Silinecek dosyalar:
   - components/customer/CustomerCard.tsx
   - components/customer/CustomerFormModal.tsx
   - components/customer/ klasörü (boşaldıysa)

2. Kullanılmayan import'ları temizle:
   - Tüm dosyalarda CustomerCard, CustomerFormModal import'larının
     kaldırıldığını doğrula

3. hooks/use-customers.ts'teki temizlik:
   - useCustomersByFair tamamen kaldırıldığını doğrula
   - Artık kullanılmayan query key'leri query-keys.ts'ten kaldır

4. Metin taraması — UI'da kalan "müşteri" referanslarını kontrol et:
   - Fuar silme uyarısı: "müşteri kayıtlarını" → "fırsat kayıtlarını" (FG-12'de yapıldı)
   - Empty state mesajları (FG-12'de yapıldı)
   - Toplam sayı istatistikleri (FG-11'de yapıldı)
   - FairCard (FG-13'te yapıldı)
   - Breadcrumb veya navigasyonda müşteri referansı var mı?
   - Admin ekranlarında müşteri referansı var mı? (Audit log entityType'ları)

5. Audit log entityType kontrolü:
   - Eski "customer" log'ları tarihsel veri olarak kalır
   - Yeni customer CRUD'ları hâlâ "customer" olarak loglanır
   - Yeni opportunity CRUD'ları "opportunity" olarak loglanır
   - Audit log ekranında "opportunity" filtre seçeneği ekle
     (admin/audit-log page'inde entityType dropdown'una "opportunity" ekle)

Etkilenen dosyalar:
  SİLİNECEK: components/customer/CustomerCard.tsx, components/customer/CustomerFormModal.tsx
  DEĞİŞEN: hooks/use-customers.ts (son temizlik), lib/query-keys.ts (son temizlik)
  DEĞİŞEN: app/(dashboard)/admin/audit-log/page.tsx (opportunity filtre seçeneği)

Bağımlılık: FG-12, FG-13 (tüm yeni bileşenler entegre olmalı)
Commit: chore(web): remove deprecated Customer components and clean up

Durum: [x]

----------------------------------------------------------------------
FG-15 — Test & Doğrulama
----------------------------------------------------------------------

Amaç: Fırsat Geçişi'nin uçtan uca doğru çalıştığını test etmek.

Test senaryoları:

Backend:
  [ ] POST /customers → yeni müşteri oluştur (firma, ad, telefon, email)
  [ ] GET /customers → müşteri listesi, search ile
  [ ] POST /fairs/:fairId/opportunities → fırsat oluştur (customerId + bütçe + dönüşüm + ürünler)
  [ ] GET /fairs/:fairId/opportunities → fırsatlar (customer bilgisi dahil)
  [ ] GET /fairs/:fairId/opportunities?search=firma → müşteri isim/firma araması
  [ ] GET /fairs/:fairId/opportunities?conversionRate=high → filtre
  [ ] PATCH /opportunities/:id → güncelle (customerId değiştirebilir)
  [ ] DELETE /opportunities/:id → sil
  [ ] GET /fairs → _count.opportunities doğru dönüyor
  [ ] GET /fairs/:id → opportunities array'i customer bilgisiyle dönüyor
  [ ] DELETE /fairs/:id → opportunity'ler silinir, customer'lar korunur

Frontend:
  [ ] Fuar detay sayfası fırsat kartlarını gösteriyor
  [ ] "Fırsat Ekle" butonu çalışıyor
  [ ] Yeni Fırsat Yarat modalı açılıyor
  [ ] Müşteri arama ve seçimi çalışıyor
  [ ] "Yeni Müşteri Ekle" ile hızlı müşteri oluşturma çalışıyor
  [ ] Müşteri seçtikten sonra fırsat alanları (bütçe, dönüşüm, ürünler, kartvizit) çalışıyor
  [ ] Fırsat kaydediliyor ve listede görünüyor
  [ ] Fırsatı Düzenle modalı doğru verilerle açılıyor
  [ ] Fırsat kartı: müşteri adı, firma, badge'ler doğru gösteriliyor
  [ ] Fırsat kartı genişletme: bütçe, telefon, email, ürünler, kartvizit doğru
  [ ] İsim/firma araması çalışıyor (fırsatlardaki müşteri bilgisi üzerinden)
  [ ] Dönüşüm filtresi çalışıyor
  [ ] FairStats istatistikleri fırsatlardan hesaplanıyor
  [ ] FairCard'da "N fırsat" doğru gösteriliyor
  [ ] Fırsat silme çalışıyor
  [ ] Fuar silme → fırsatlar siliniyor, müşteriler korunuyor
  [ ] Empty state mesajları doğru

Edge case'ler:
  [ ] Müşterisi olmayan fırsat oluşturulamaz
  [ ] Aynı müşteri ile birden fazla fırsat oluşturulabilir (aynı/farklı fuar)
  [ ] Uzun metin, boş opsiyonel alanlar, özel karakterler
  [ ] Responsive: 1-3 kolon geçişleri

Build kontrolü:
  [ ] npm run build (api) — hatasız
  [ ] npm run build (web) — hatasız
  [ ] npm run build (shared) — hatasız

Bağımlılık: FG-1 — FG-14 tamamlanmış olmalı
Commit: test: verify Opportunity transition end-to-end

Durum: [x]

==============================
ÖZET — İŞ SIRASI
==============================

FG-1  → Shared types & schemas (temel)
FG-2  → Database migration (temel)
FG-3  → Backend Customer refactor
FG-4  → Backend Opportunity module (yeni)
FG-5  → Backend Fair module güncelle
FG-6  → Backend entegrasyon & module kaydı
FG-7  → Frontend hooks & query keys
FG-8  → Frontend CustomerSelectInput (yeni bileşen)
FG-9  → Frontend OpportunityFormModal
FG-10 → Frontend OpportunityCard
FG-11 → Frontend OpportunityToolbar & FairStats
FG-12 → Frontend Fuar detay sayfası entegrasyon
FG-13 → Frontend FairCard güncelle
FG-14 → Temizlik (eski dosyaları kaldır)
FG-15 → Test & doğrulama

Toplam: 15 feature
Tahmini etki: ~25 dosya (12 yeni, 13 değişecek, 3 silinecek)

==============================
ÖNEMLİ NOTLAR
==============================

- Bu faz tamamlanmadan Phase 2 Feature 31+ uygulanamaz.
- Data migration geri dönüşümsüzdür — migration öncesi veritabanı yedeği alınmalıdır.
- Mevcut müşteri verileri korunur, sadece yapı değişir.
- Otomatik müşteri dedup yapılmaz — her eski Customer satırı 1:1 kalır.
- Phase 3 feature'ları (F32+) Fırsat Geçişi sonrası terminolojiye göre güncellenmiştir.
