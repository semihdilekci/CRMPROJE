Müşteri / Temsilci Ayrıştırma Fazı — Mimari Dönüşüm Planı
==========================================================

Bu doküman, projenin "Müşteri = firma + kişi" yapısından "Müşteri = firma"
ve "Temsilci (CustomerContact) = kişi" yapısına geçişi için gereken tüm
değişiklikleri detaylandırır.

Bu faz, Fırsat Geçişi Fazı (docs/firsat-gecisi-fazi.md) tamamlandıktan sonra
uygulanır. Phase 2 Feature 31 (Rapor Modalı) ve sonraki tüm raporlama /
müşteri 360° feature'ları (Phase 5, Phase 6) bu faz tamamlanmadan önce
yeniden ele alınmamalıdır — kontrat değişikliği bu feature'ları doğrudan
etkiler.

==============================
DEĞİŞİKLİĞİN ÖZETİ
==============================

Mevcut Durum (As-Is):
- Customer = tek satır içinde hem firma (company, address) hem kişi
  (name, phone, email, cardImage) tutuluyor.
- Aynı firmaya ait birden fazla "kişi" varsa, her biri ayrı bir Customer
  satırı olarak ekleniyor → firma bilgisi tekrarlanıyor.
- Opportunity → Customer (1:N). Fırsat doğrudan bir Customer'a bağlı.
  Bu Customer aslında "firma+kişi" karışımı bir kayıt.

Hedef Durum (To-Be):
- Customer = firma. Sadece firma seviyesinde bilgi tutar:
  id, company, address, createdAt, updatedAt.
- CustomerContact = temsilci (kişi). Bir Customer'a bağlı 0..N temsilci:
  id, customerId, name, phone, email, cardImage, createdAt, updatedAt.
- Opportunity → Customer (zorunlu, mevcut davranış) + opsiyonel olarak
  bir CustomerContact (yeni). Fırsat artık "bu firmanın hangi temsilcisi
  ile yürüdüğünü" de taşır.
- Yeni fırsat yaratırken kullanıcı önce firmayı (Customer), sonra o firmanın
  temsilcilerinden birini seçer. İsterse mevcut firma altında yeni temsilci
  ekler, isterse hem yeni firma hem yeni temsilciyi tek hamlede yaratır.
- Kartvizit tarama akışı temsilci yaratımı için kullanılır; firma bilgisi
  kartvizitten okunduğunda, aynı firma adı zaten Customer'da varsa yeni
  Customer açılmaz, var olan Customer'a temsilci eklenir.
- Aynı firmaya ait, aynı e-posta veya aynı telefon numarasına sahip başka
  bir temsilci varsa kullanıcı uyarılır; yine de "Yine de ekle" diyebilir.

Neden:
- Pratikte aynı firmadan birden çok kişi (satınalmacı, teknik müdür, vs.)
  ile temas kuruluyor. Bunlar aynı şirketin temsilcileri olmasına rağmen
  şu an ayrı "Customer" satırları olarak duruyor; bu da müşteri 360°
  görünümünü, çift kayıt tespitini ve raporlamayı bozuyor.
- Firma bilgisi tek bir yerde toplandığında: çapraz fuar analizi, firma
  bazlı satış geçmişi ve dublike önleme doğru çalışır.

==============================
ETKİLENEN DOSYALAR (TAM LİSTE)
==============================

Shared Package (packages/shared/src/):
  YENİ:
    - types/customer-contact.ts
    - schemas/customer-contact.ts
  DEĞİŞECEK:
    - types/customer.ts (name, phone, email, cardImage kaldırılacak)
    - types/customer-profile.ts (CustomerListItem ve CustomerProfileResponse
      yapıları "firma + temsilci listesi" modeline göre güncellenecek)
    - types/opportunity.ts (Opportunity'ye contactId ve OpportunityWithCustomer'a
      contact alanı eklenecek)
    - types/index.ts (customer-contact export'u eklenecek)
    - schemas/customer.ts (name, phone, email zorunluluğu kalkacak; sadece
      company zorunlu, address opsiyonel)
    - schemas/opportunity.ts (contactId opsiyonel alan eklenecek)
    - schemas/index.ts (customer-contact export'u eklenecek)
    - constants/api-endpoints.ts (CUSTOMER_CONTACTS endpoint'leri eklenecek)
    - utils/parse-business-card.ts (DEĞİŞMEZ — çıktı yapısı zaten
      {company, name, phone, email}; aynen kalır)

Veritabanı (apps/api/prisma/):
  DEĞİŞECEK:
    - schema.prisma:
        * Customer modelinden name, phone, email, cardImage kaldırılır
        * Yeni model: CustomerContact
        * Opportunity modeline contactId String? + relation eklenir
  YENİ:
    - migrations/YYYYMMDD_musteri_temsilci/ (data migration dahil)

Backend (apps/api/src/):
  YENİ:
    - modules/customer-contact/customer-contact.module.ts
    - modules/customer-contact/customer-contact.controller.ts
    - modules/customer-contact/customer-contact.service.ts
  DEĞİŞECEK:
    - modules/customer/customer.service.ts (firma odaklı, temsilci listesi
      include eden basitleştirilmiş hâl; profil response zenginleştirilir)
    - modules/customer/customer.controller.ts (request/response şekilleri)
    - modules/customer/customer.module.ts (gerekirse CustomerContactService
      import)
    - modules/opportunity/opportunity.service.ts (contactId desteği +
      response'da contact bilgisi)
    - modules/opportunity/opportunity.controller.ts (response tipleri)
    - modules/opportunity/offer.service.ts (customer_name → contact.name;
      contact yoksa firma adı veya '-')
    - modules/fair/fair.service.ts (findById response'unda customer mapping
      güncellenecek + contact populate edilecek)
    - modules/report/report.service.ts (opp.customer.name kullanımı →
      opp.contact?.name ?? opp.customer.company)
    - modules/chat/chat.service.ts (aynı şekilde isim alanları güncellenecek)
    - app.module.ts (CustomerContactModule register)
  YENİ (script):
    - apps/api/prisma/seed.ts güncellemesi (Customer + CustomerContact +
      Opportunity ilişkilendirmesi)

Frontend Web (apps/web/src/):
  YENİ:
    - components/customer/CustomerContactEditModal.tsx
    - components/customer/CustomerContactList.tsx (müşteri profilinde
      temsilci yönetimi)
    - components/opportunity/ContactSelectInput.tsx
    - hooks/use-customer-contacts.ts
  DEĞİŞECEK:
    - components/customer/CustomerEditModal.tsx (sadece firma+adres alanları)
    - components/customer/CustomerListCard.tsx (kişi adı yerine temsilci
      sayısı / baş temsilci özeti)
    - components/opportunity/CustomerSelectInput.tsx (iki katmanlı:
      önce firma, sonra temsilci. Yeni firma/temsilci yaratma akışları
      ve dublike-temsilci uyarısı dahil)
    - components/opportunity/OpportunityFormModal.tsx (contact akışı,
      kartvizit yükleme contact'ın cardImage'ine yazar)
    - components/opportunity/OpportunityCard.tsx (kişi/telefon/e-posta
      gösterimi contact'tan; contact yoksa "Temsilci atanmamış")
    - components/customer/CustomerListCard.tsx (CustomerListItem yeni
      şekline göre)
    - app/(dashboard)/customers/page.tsx (liste sıralama/arama: temsilci
      sayısı dahil)
    - app/(dashboard)/customers/[id]/page.tsx (firma profili + temsilci
      yönetimi + her fırsatın hangi temsilciye ait olduğu)
    - hooks/use-customers.ts (CreateCustomerDto basitleşir; profil
      response'u yeni şemaya göre)
    - lib/query-keys.ts (customerContacts key'leri eklenecek)

Frontend Mobile (apps/mobile/) — MİNİMUM UYUMLULUK:
  DEĞİŞECEK (build kırılmaması ve temel akışların çalışması için):
    - components/customer/CustomerForm.tsx (Customer için sadece company
      + address; ardından oluşturulan müşteriye otomatik tek temsilci eklenir
      — name/phone/email/cardImage girilen değerlerle)
    - components/customer/CustomerEditSheet.tsx (firma+adres edit;
      temsilci edit ayrı bir alt-sayfa olarak Phase 5 mobile'a ertelenir)
    - components/customer/CustomerSelectInput.tsx (firma + ilk temsilci
      seçimi minimum düzeyde; tam yönetim Phase 5 mobile)
    - components/customer/CustomerListCard.tsx (kişi adı yerine temsilci
      sayısı)
    - components/customer/CustomerProfileScroll.tsx (name/phone/email
      kullanan satırlar baş temsilciye ya da "—" değerine bağlanır)
    - components/opportunity/OpportunityCard.tsx (kişi/telefon/e-posta:
      contact?.* ?? '-')
    - hooks/use-customers.ts (yeni DTO/profil response uyumu)

==============================
VERİ MODELİ DEĞİŞİKLİĞİ (ÖNCESİ / SONRASI)
==============================

ÖNCESİ — Customer modeli:
  id, company, name, address, phone, email, cardImage, createdAt, updatedAt

SONRASI — Customer modeli (firma):
  id, company, address, createdAt, updatedAt
  contacts CustomerContact[]            (ilişki)
  opportunities Opportunity[]            (mevcut ilişki korunur)

SONRASI — CustomerContact modeli (yeni — temsilci):
  id, customerId, name, phone, email, cardImage, createdAt, updatedAt
  customer Customer @relation(...)
  opportunities Opportunity[] (ters yön)

SONRASI — Opportunity modeli:
  id, fairId, customerId,
  contactId  String?           (YENİ — opsiyonel)
  budgetRaw, budgetCurrency, conversionRate, products,
  currentStage, lossReason, createdAt, updatedAt
  customer Customer @relation(..., onDelete: Cascade)            (mevcut)
  contact  CustomerContact? @relation(..., onDelete: SetNull)    (YENİ)

İlişkiler ve onDelete davranışları:
  Customer (1) → CustomerContact (N)
    onDelete: Cascade
    Yorum: Bir firma silindiğinde o firmanın temsilcileri de silinir.

  Customer (1) → Opportunity (N)
    onDelete: Cascade  (mevcut davranış aynen)
    Yorum: Firma silindiğinde fırsatları da silinir.

  CustomerContact (1) → Opportunity (N)
    onDelete: SetNull
    Yorum: Temsilci silindiğinde, ona bağlı fırsatların contactId'si null'a
    çekilir; fırsat firmaya bağlı kalmaya devam eder.
    Bu davranış Step 0'da alınan tasarım kararıyla uyumludur
    ("temsilci silinince fırsatın contactId'si null'a düşer").

İndeksler:
  CustomerContact:
    @@index([customerId])
    @@index([email])      — dublike kontrolü için (case-insensitive arama
                            için DB tarafında düşük maliyetli ön-filtre)
  Opportunity:
    @@index([contactId])  — listing/filtering için
  (Mevcut indeksler korunur.)

==============================
TASARIM KARARLARI (Step 0)
==============================

Aşağıdaki kararlar bu fazın hareket noktasıdır. Uygulamada değişmemelidir:

1) Opportunity.contactId = OPSİYONEL (nullable).
   - Mevcut fırsatlar migration sonrası contactId NULL ile başlar; istenirse
     UI üzerinden temsilci atanır.
   - Yeni fırsat formunda temsilci seçimi opsiyoneldir. Kullanıcı sadece
     firma seçip kaydedebilir; sonradan fırsat düzenleme ekranından
     temsilci atayabilir.

2) Temsilci silme → SetNull.
   - Temsilciye bağlı fırsat varsa silme engellenmez. Onay diyaloğunda
     "Bu temsilciye bağlı N fırsat var; silinirse bu fırsatlar 'temsilci
     atanmamış' duruma düşer" mesajı gösterilir. Onay sonrası fırsatların
     contactId'si DB tarafından otomatik NULL olur.
   - Backend `remove` servisinde manuel bir transaction'a gerek yok; Prisma
     onDelete: SetNull yeterlidir. Yine de audit log'a "siliniyor" niyetinin
     öncesinde etkilenen fırsat sayısı yazılmalıdır.

3) Dublike temsilci tespiti (kartvizit ile yeni temsilci ekleme).
   - Aynı Customer (firma) altında karşılaştırma yapılır.
   - Tetikleyici: aynı e-posta (lowercase eşit) VEYA aynı telefon
     (sadece rakamlar — non-digit karakterler temizlendiğinde eşit).
   - Dublike tespit edilirse UI: "Aynı firmada şu bilgilerle bir temsilci
     zaten var: {firma} → {ad} ({email}/{telefon}). Yine de eklensin mi?"
     [İptal] [Mevcut temsilciyi seç] [Yine de ekle].
   - Backend bu kontrolü `POST /customers/:customerId/contacts` öncesinde
     yapar (force=false ise dublike varsa 409 + meta:{ duplicateOf: id }
     döner; force=true ise yine ekler).

4) Mobil = minimum uyumluluk.
   - Mobil derleme bozulmayacak. Mevcut müşteri ekleme akışı; arka planda
     "1 Customer + 1 CustomerContact" yaratır. Tam çoklu-temsilci yönetimi
     mobil için Phase 5 (mobile customer 360) içinde planlanır.

==============================
DATA MİGRATION STRATEJİSİ
==============================

Hedef: tek bir migration ile mevcut veriyi kayıpsız taşımak. Migration
custom SQL içerecektir; `npx prisma migrate dev --create-only --name
musteri_temsilci` ile dosya oluşturulup `migration.sql` manuel düzenlenir.

Adım 1 — CustomerContact tablosu oluştur (Prisma autogen):
  CREATE TABLE "CustomerContact" (
    "id"          TEXT NOT NULL,
    "customerId"  TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "phone"       TEXT,
    "email"       TEXT,
    "cardImage"   TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    PRIMARY KEY ("id")
  );
  CREATE INDEX "CustomerContact_customerId_idx" ON "CustomerContact"("customerId");
  CREATE INDEX "CustomerContact_email_idx"      ON "CustomerContact"("email");
  ALTER TABLE "CustomerContact"
    ADD CONSTRAINT "CustomerContact_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

Adım 2 — Opportunity tablosuna contactId kolonu ekle (nullable):
  ALTER TABLE "Opportunity" ADD COLUMN "contactId" TEXT;
  CREATE INDEX "Opportunity_contactId_idx" ON "Opportunity"("contactId");

Adım 3 — Firma birleştirme stratejisi.
  Mevcut Customer tablosunda aynı company adıyla birden fazla satır olabilir
  (eski yapıda her temsilci ayrı satırdı). Bu fazda OTOMATİK firma birleştirme
  YAPILMAZ; her eski Customer satırı 1:1 olarak yeni Customer satırı olarak
  korunur. (İleride bir "Müşteri Birleştirme" özelliği planlanabilir —
  bkz. "İLERİYE DÖNÜK NOTLAR" bölümü.)
  Yorum: Veri kaybını ve istenmeyen birleşmeleri önlemek için en güvenli yol
  budur. UI tarafında kullanıcı, ihtiyacı olursa manuel olarak temsilcileri
  doğru firmaya taşıyabilir (Phase 5 dahilinde).

Adım 4 — Her eski Customer için bir CustomerContact üret:
  Mevcut Customer satırından (name, phone, email, cardImage) verisini alarak
  bağlı bir CustomerContact yaratılır.

  -- Sadece name kolonu boş değilse temsilci oluştur. (Tarihsel olarak boş
  -- olabilir mi? Mevcut schema'da name NOT NULL — yani her zaman dolu.)
  INSERT INTO "CustomerContact" (id, "customerId", name, phone, email,
                                 "cardImage", "createdAt", "updatedAt")
  SELECT
    -- cuid benzeri bir id üretmek için: Prisma'nın varsayılan cuid'ini
    -- migration sırasında kullanamayız. PostgreSQL gen_random_uuid() ile
    -- üretilen UUID'ler de kabul edilir; Customer.id ile çakışma olmaz.
    -- Tercih: 'cnt_' + replace(gen_random_uuid()::text, '-', '')
    'cnt_' || replace(gen_random_uuid()::text, '-', ''),
    c.id,
    c.name,
    c.phone,
    c.email,
    c."cardImage",
    NOW(),
    NOW()
  FROM "Customer" c;

Adım 5 — Opportunity.contactId'yi yeni temsilcilerle eşle:
  Her Opportunity için, aynı customerId altındaki tek CustomerContact'ı
  ata. (Adım 4 sayesinde her Customer'ın 1:1 bir contact'ı vardır.)

  UPDATE "Opportunity" o
  SET "contactId" = cc.id
  FROM "CustomerContact" cc
  WHERE cc."customerId" = o."customerId";

Adım 6 — Opportunity.contactId için foreign key kısıtı:
  ALTER TABLE "Opportunity"
    ADD CONSTRAINT "Opportunity_contactId_fkey"
    FOREIGN KEY ("contactId") REFERENCES "CustomerContact"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

Adım 7 — Customer tablosundan eski alanları kaldır:
  ALTER TABLE "Customer" DROP COLUMN "name";
  ALTER TABLE "Customer" DROP COLUMN "phone";
  ALTER TABLE "Customer" DROP COLUMN "email";
  ALTER TABLE "Customer" DROP COLUMN "cardImage";

  Not: Customer.address korunur (yeni yapıda Customer'a aittir).

Doğrulama (migration sonrası):
  - SELECT COUNT(*) FROM "Customer";       → eski sayım ile aynı
  - SELECT COUNT(*) FROM "CustomerContact";→ Customer sayısıyla aynı
    (her Customer için 1 contact)
  - SELECT COUNT(*) FROM "Opportunity" WHERE "contactId" IS NULL;
    → 0 olmalı (her opportunity bir contact'a bağlanmış olmalı)
  - Audit log: 'customer' ve 'opportunity' tarihsel kayıtlar olduğu gibi
    durur. JSON snapshot'lar eski şemada (name içeren) olarak kalır —
    bu kabul edilebilir.

Yedekleme:
  Migration öncesi DB yedeği zorunlu (`pg_dump`). Veri dönüşümü geri
  alınamaz — yanlış kararlar yedekten geri dönülerek düzeltilir.

==============================
FEATURE LİSTESİ (MT-1 — MT-17)
==============================

Önemli: Bu feature'lar sırayla uygulanmalıdır. Aksi belirtilmedikçe her
MT bir öncekine bağımlıdır. Her MT tamamlandığında Durum alanı [x] olarak
işaretlenir. Her MT, .cursor/rules/feature-development-protocol.mdc'deki
adımlara uyar (feature branch, granular commit, build/lint/test gate).

----------------------------------------------------------------------
MT-1 — Shared: CustomerContact Tip/Şema ve Customer/Opportunity Güncellemeleri
----------------------------------------------------------------------

Amaç: @crm/shared paketinde CustomerContact tipi ve Zod şemalarını
tanımlamak; Customer tipini basitleştirmek; Opportunity'ye contactId
alanını eklemek.

Yapılacaklar:

1. packages/shared/src/types/customer-contact.ts (yeni):
   - export interface CustomerContact {
       id: string;
       customerId: string;
       name: string;
       phone: string | null;
       email: string | null;
       cardImage: string | null;
       createdAt: string;
       updatedAt: string;
     }

2. packages/shared/src/types/customer.ts (güncelle):
   - Çıkarılacak alanlar: name, phone, email, cardImage
   - Kalacak alanlar: id, company, address, createdAt, updatedAt
   - Opsiyonel olarak Customer için sık kullanılan composite tip:
     export interface CustomerWithContacts extends Customer {
       contacts: CustomerContact[];
     }

3. packages/shared/src/types/opportunity.ts (güncelle):
   - Opportunity interface'ine ekle:
       contactId: string | null;
   - OpportunityWithCustomer ve OpportunityWithDetails arayüzlerine ekle:
       contact: CustomerContact | null;
   - opportunityProducts ve stageLogs'taki mevcut yapı korunur.

4. packages/shared/src/types/customer-profile.ts (güncelle):
   - CustomerListItem:
       Eski alanlar { name, phone, email, cardImage } yerine:
       contactCount: number;       (firmadaki temsilci sayısı)
       primaryContact: CustomerContact | null;  (en güncel/temas edilen)
   - CustomerProfileResponse.customer:
       { id, company, address }  (name/phone/email/cardImage kaldırılır)
   - CustomerProfileResponse'a:
       contacts: CustomerContact[]
       (her temsilci için temel bilgi + ona bağlı fırsat sayısı isteğe bağlı)
   - opportunityTimeline elemanlarına opsiyonel:
       contact: CustomerContact | null   (fırsatın temsilcisi)

5. packages/shared/src/types/index.ts:
   - export * from './customer-contact' ekle.

6. packages/shared/src/schemas/customer-contact.ts (yeni):
   - createCustomerContactSchema:
       name: z.string().min(1, 'Ad soyad zorunludur')
       phone: z.string().nullable().optional()
       email: z.string().email('E-posta formatı geçersizdir.').nullable().optional()
       cardImage: z.string().nullable().optional()
   - updateCustomerContactSchema: createCustomerContactSchema.partial()
   - createCustomerWithContactSchema (composite — tek istek ile firma + ilk
     temsilciyi yaratmak için):
       company: z.string().min(1, ...)
       address: z.string().nullable().optional()
       contact: createCustomerContactSchema   (opsiyonel; verilirse aynı anda
         temsilci de yaratılır)
   - DTO type export'ları (z.infer).

7. packages/shared/src/schemas/customer.ts (güncelle):
   - createCustomerSchema:
       company: z.string().min(1, 'Firma adı zorunludur')
       address: z.string().nullable().optional()
     (name, phone, email, cardImage alanları kaldırılır.)
   - updateCustomerSchema: createCustomerSchema.partial()

8. packages/shared/src/schemas/opportunity.ts (güncelle):
   - createOpportunitySchema'ya alan ekle:
       contactId: z.string().nullable().optional()
   - updateOpportunitySchema otomatik (.partial) etkilenir.

9. packages/shared/src/schemas/index.ts:
   - export * from './customer-contact' ekle.

10. packages/shared/src/constants/api-endpoints.ts (güncelle):
    CUSTOMERS.CONTACTS = (customerId: string) => `/customers/${customerId}/contacts`
    CUSTOMER_CONTACTS = {
      BY_ID: (id: string) => `/customer-contacts/${id}`,
    }

11. packages/shared/src/utils/parse-business-card.ts:
    - DEĞİŞMEZ. ParsedBusinessCard = {company, name, phone, email} aynen
      kalır. Bu çıktıdan tüketici kod artık name/phone/email'i Contact
      içine, company'yi de Customer içine doldurur.

Etkilenen dosyalar:
  YENİ: types/customer-contact.ts, schemas/customer-contact.ts
  DEĞİŞEN: types/customer.ts, types/customer-profile.ts, types/opportunity.ts,
           types/index.ts, schemas/customer.ts, schemas/opportunity.ts,
           schemas/index.ts, constants/api-endpoints.ts

Build:
  npm run build -w packages/shared (hatasız)

Commit:
  feat(shared): add CustomerContact types/schemas, simplify Customer,
                add Opportunity.contactId

Durum: [x]

----------------------------------------------------------------------
MT-2 — Veritabanı: Prisma Şeması & Data Migration
----------------------------------------------------------------------

Amaç: Prisma schema'da CustomerContact modelini eklemek, Customer'ı
sadeleştirmek, Opportunity.contactId alanını eklemek; mevcut veriyi
kayıpsız taşımak.

Yapılacaklar:

1. apps/api/prisma/schema.prisma güncelle:

   model Customer {
     id        String   @id @default(cuid())
     company   String
     address   String?  @db.Text
     createdAt DateTime @default(now())
     updatedAt DateTime @updatedAt

     contacts      CustomerContact[]
     opportunities Opportunity[]
   }

   model CustomerContact {
     id         String   @id @default(cuid())
     customerId String
     name       String
     phone      String?
     email      String?
     cardImage  String?
     createdAt  DateTime @default(now())
     updatedAt  DateTime @updatedAt

     customer      Customer      @relation(fields: [customerId], references: [id], onDelete: Cascade)
     opportunities Opportunity[]

     @@index([customerId])
     @@index([email])
   }

   model Opportunity {
     // ... (mevcut alanlar)
     contactId String?
     contact   CustomerContact? @relation(fields: [contactId], references: [id], onDelete: SetNull)

     @@index([contactId])
     // ... (mevcut indeksler)
   }

2. Migration oluştur (CREATE-ONLY) ve manuel düzenle:
   npx prisma migrate dev --create-only --name musteri_temsilci

   - Oluşan migration.sql dosyasına Data Migration bölümündeki Adım 1–7
     komutlarını sıralı şekilde yerleştir (Prisma'nın otomatik ürettiği
     ALTER/DROP komutlarının ÖNCESİNE ekle).
   - Önemli: Customer'dan kolon DROP eden komutlar, CustomerContact'a
     INSERT yapılmasından SONRA çalışmalıdır.

3. Migration uygula:
   npx prisma migrate dev   (önce yerel, sonra dev RDS)
   npx prisma generate

4. Migration sonrası doğrulama scripti (apps/api/prisma/scripts/verify-
   musteri-temsilci.ts — opsiyonel ama önerilir):
   - Customer.count() === eski snapshot
   - CustomerContact.count() === Customer.count()
   - Opportunity.count({ where: { contactId: null } }) === 0
   Eğer doğrulama başarısızsa migration geri alınır (yedek geri yüklenir).

5. apps/api/prisma/seed.ts güncelle:
   - prisma.customer.create({ data: t })
     yerine bir customer + ona bağlı bir contact yaratan helper:
       const customer = await prisma.customer.create({
         data: { company: t.company, address: t.address ?? null,
                 contacts: { create: [{ name: t.name, phone: t.phone, email: t.email }] }
         },
         include: { contacts: true },
       });
   - Opportunity yaratımında:
       contactId: customer.contacts[0].id  (tek contact var)
   - deleteMany sırasını güncelle: opportunityStageLog, opportunityProduct,
     opportunityNote, opportunity, customerContact, customer, fair, product.

Etkilenen dosyalar:
  DEĞİŞEN: apps/api/prisma/schema.prisma, apps/api/prisma/seed.ts
  YENİ: apps/api/prisma/migrations/YYYYMMDD_musteri_temsilci/migration.sql
  YENİ (opsiyonel): apps/api/prisma/scripts/verify-musteri-temsilci.ts

Bağımlılık: MT-1 (shared tipler hazır)
Commit:
  feat(prisma): add CustomerContact model, simplify Customer, add
                Opportunity.contactId
  chore(prisma): run musteri-temsilci migration with data transfer
  chore(prisma): update seed to create Customer + CustomerContact

Durum: [x]

----------------------------------------------------------------------
MT-3 — Backend: CustomerContact Modülü (Yeni)
----------------------------------------------------------------------

Amaç: Temsilci CRUD işlemlerini yöneten yeni NestJS modülü oluşturmak.
Fair modülü referansı (reference-modules.mdc) kullanılarak aynı pattern
uygulanır.

Yapılacaklar:

1. apps/api/src/modules/customer-contact/customer-contact.module.ts:
   - imports: [AuditModule]
   - providers: [CustomerContactService]
   - controllers: [CustomerContactController]
   - exports: [CustomerContactService]

2. apps/api/src/modules/customer-contact/customer-contact.service.ts:
   Metotlar:
     - listByCustomer(customerId): Customer var mı kontrol; contacts döner.
     - create(customerId, dto, { force?: boolean }, auditUser):
         * ensureCustomerExists(customerId)
         * findDuplicate(customerId, dto): aynı email (lowercase) VEYA
           aynı telefon (digit-only) eşleşen contact varsa "duplicate"
           döner.
         * Eğer duplicate ve force=false: ConflictException at ve hata
           gövdesine duplicateOf: { id, name, phone, email } ekle.
           (ExceptionFilter "details" alanında bu meta'yı taşımalı; mevcut
           global filter zaten flexible. Gerekirse details parametresi
           desteklenecek.)
         * force=true ise yine de oluştur.
         * Audit log: entityType='customer_contact'
     - update(id, dto, auditUser):
         * Bulunmayan id → NotFoundException
         * Audit log
     - remove(id, auditUser):
         * Bulunmayan id → NotFoundException
         * Etkilenecek fırsat sayısını ölç (count opportunities by contactId)
           ve audit log'a "linkedOpportunityCount" meta yaz.
         * delete (DB tarafında onDelete: SetNull devreye girer)
   Yardımcı:
     - normalizePhone(s) = s.replace(/\D/g, '')
     - normalizeEmail(s) = s?.trim().toLowerCase() ?? null
     - findDuplicate(customerId, dto):
         OR clause ile email VEYA phone normalize karşılaştırması.
         Not: DB tarafında daha verimli olması için `lower(email)` ve
         normalize edilmiş telefon DB'de tutulmuyor; ilk sürümde Prisma
         findMany ile çekip in-memory karşılaştırma kabul edilir
         (firma başına temsilci sayısı düşük). İleride bir generated
         column eklenebilir.
   Response mapping:
     - toContactResponse(): Date alanları toISOString().

3. apps/api/src/modules/customer-contact/customer-contact.controller.ts:
   - @Controller() + @UseGuards(JwtAuthGuard)
   - POST   /customers/:customerId/contacts?force=true|false   → create
   - GET    /customers/:customerId/contacts                    → list
   - PATCH  /customer-contacts/:id                             → update
   - DELETE /customer-contacts/:id                             → remove
   - ZodValidationPipe ile createCustomerContactSchema/update.
   - Standart response { success, message, data }.

4. apps/api/src/app.module.ts:
   - CustomerContactModule import + imports[] kaydı.

5. apps/api/src/common/filters/all-exceptions.filter.ts (varsa):
   - ConflictException atılırken `getResponse()` içine duplicateOf bilgisi
     eklenmek istendiğinde, BadRequestException kullanılabilir veya
     HttpException constructor ile data taşınır. Mevcut filtreyi koru;
     gerekirse 409 yanıtına `details` alanı ekle.

Etkilenen dosyalar:
  YENİ: customer-contact.module.ts, customer-contact.controller.ts,
        customer-contact.service.ts
  DEĞİŞEN: app.module.ts
  DEĞİŞEN (gerekirse): common/filters/all-exceptions.filter.ts

Bağımlılık: MT-1, MT-2
Commit:
  feat(api): add CustomerContact module with CRUD and duplicate check

Durum: [x]

----------------------------------------------------------------------
MT-4 — Backend: Customer Modülünü "Firma" Modeline Sadeleştir
----------------------------------------------------------------------

Amaç: Customer artık sadece firma. Service ve controller bu modele göre
güncellenir; profil response'una temsilci listesi eklenir.

Yapılacaklar:

1. customer.service.ts:
   - create(dto, auditUser):
       * dto = { company, address? }
       * Prisma create. Audit log.
   - createWithContact(dto, auditUser) [yeni, opsiyonel — Frontend'in
     "tek hamlede firma+temsilci yarat" akışı için]:
       * dto = { company, address?, contact? }
       * Eğer contact verilmişse, Customer + CustomerContact tek
         transaction'da oluşturulur. Dublike kontrolü uygulanmaz çünkü
         firma yeni. (UI'da kullanıcı zaten yeni firma diyerek başlamıştır.)
   - findAll(search?, sortBy?):
       * Mevcut yapıyla benzer, ama "primaryContact" hesaplama:
         müşterinin en güncel updatedAt'e sahip temsilcisi; yoksa null.
       * "contactCount": contacts._count.
       * Sıralama: lastContact / company / opportunityCount destekli.
   - findById(id):
       * Customer + contacts döner (CustomerWithContacts).
   - findProfileById(id):
       * Customer + contacts + opportunities (her opp için contact ve fair).
       * Response yapısı yeni CustomerProfileResponse'a uyumlu olur:
         - customer: { id, company, address }
         - contacts: CustomerContact[]
         - opportunityTimeline her item'da contact: { id, name, phone, email }
           (yoksa null)
         - kpi, pendingOpportunities, allNotes mevcut mantık aynen kalır.
   - update(id, dto, auditUser):
       * Sadece company ve address güncellenir.
   - remove(id, auditUser):
       * Cascade davranışı: temsilciler ve fırsatlar otomatik silinir.
       * Onay mesajında etkilenen contact ve opportunity sayıları belirtilir
         (UI bu sayıları profil ekranında zaten görür).
   - toCustomerResponse: yeni yapıya göre güncellenir.

2. customer.controller.ts:
   - POST   /customers            → create (sadece company + address)
   - POST   /customers/with-contact → createWithContact (composite — opsiyonel
     endpoint; client tek istekle hem firma hem temsilci açabilsin)
   - GET    /customers            → findAll
   - GET    /customers/:id        → findById (with contacts)
   - GET    /customers/:id/profile → findProfileById
   - PATCH  /customers/:id        → update
   - DELETE /customers/:id        → remove
   - ZodValidationPipe ile create/update şemaları.

3. customer.module.ts:
   - AuditModule import korunur. CustomerContact'a dependency yok (ayrı
     modül).

Etkilenen dosyalar:
  DEĞİŞEN: customer.controller.ts, customer.service.ts, customer.module.ts

Bağımlılık: MT-1, MT-2, MT-3 (CustomerContactModule mevcut olmalı)
Commit:
  refactor(api): simplify Customer to company entity; expand profile
                 response with contacts

Durum: [x]

----------------------------------------------------------------------
MT-5 — Backend: Opportunity Modülünü Güncelle (contactId Desteği)
----------------------------------------------------------------------

Amaç: Fırsat servisinin contactId alanını yazma/okuma akışlarına dahil
etmek; response'da contact bilgisini populate etmek.

Yapılacaklar:

1. opportunity.service.ts:
   - create(fairId, dto, auditUser):
       * ensureFairExists, ensureCustomerExists (mevcut)
       * Eğer dto.contactId verilmişse: ensureContactBelongsToCustomer(
         dto.contactId, dto.customerId) → contact'ın aynı customer'a bağlı
         olduğunu doğrula. Aksi halde BadRequestException.
       * Prisma create'e contactId ekle.
       * include: { customer: true, contact: true, opportunityProducts:..., stageLogs:... }
   - findByFair(fairId, search?, conversionRate?, currentStage?):
       * include'a contact: true ekle.
       * Search: customer.company, customer.name yerine artık
         customer.company VEYA contact.name VEYA contact.email üzerinden
         filtre uygulanır:
           where.OR = [
             { customer: { company: { contains, mode: 'insensitive' } } },
             { contact:  { name:    { contains, mode: 'insensitive' } } },
             { contact:  { email:   { contains, mode: 'insensitive' } } },
           ]
   - update(id, dto, auditUser):
       * dto.contactId değiştiyse:
           - null yapılabilir (contact'ı kaldırma)
           - Yeni bir contactId verilmişse → ensureContactBelongsToCustomer
       * Diğer alanlar mevcut mantıkla aynı.
   - remove, transitionStage, addNote, updateNote, deleteNote: dokunulmaz
     (kontrat değişmedi).
   - toResponse(): contact mapping eklenir; OpportunityWithDetails'in
     yeni `contact: CustomerContact | null` alanı doldurulur.

2. opportunity.controller.ts:
   - Sadece tipler güncellenir; endpoint sayısı/yolu aynı.

3. offer.service.ts:
   - Mevcut kullanım: customer.name, customer.phone, customer.email
   - Yeni kullanım (öncelik sırası):
       contact?.name  ?? '-'
       contact?.phone ?? '-'
       contact?.email ?? '-'
     customer_company = customer.company  (mevcuttu)
   - Template alan adlarını koru ama değer kaynağını contact'a yönlendir.

4. fair.service.ts (findById):
   - opportunities.include'a contact: true ekle.
   - Mapping bölümünde:
     - customer artık name/phone/email/cardImage taşımıyor → eski alanlar
       kaldırılır (sadece id, company, address, createdAt, updatedAt).
     - contact: { id, name, phone, email, cardImage, ... } olarak eklenir.

5. report.service.ts ve chat.service.ts:
   - opp.customer.name kullanılan yerleri:
       opp.contact?.name ?? opp.customer.company
     ile değiştir (uygun anlamı koruyacak şekilde).
   - include'lara contact: true ekle.

Etkilenen dosyalar:
  DEĞİŞEN: opportunity.service.ts, opportunity.controller.ts,
           offer.service.ts, fair.service.ts, report.service.ts,
           chat.service.ts

Bağımlılık: MT-1, MT-2, MT-3, MT-4
Commit:
  feat(api): wire Opportunity.contactId across create/list/update flows
  refactor(api): use contact.name in offer/report/chat templates

Durum: [ ]

----------------------------------------------------------------------
MT-6 — Backend: Audit, Build & Manuel Test
----------------------------------------------------------------------

Amaç: Tüm backend değişikliklerinin uyumlu çalıştığını doğrulamak.

Yapılacaklar:

1. Audit log entityType genişletme:
   - "customer_contact" tipi log'lar UI tarafında (Phase 2 audit-log
     ekranında) filtre dropdown'una eklenir. Backend tarafı zaten string
     bir alan olduğu için ek değişiklik gerektirmez.

2. Build:
   - npm run build -w packages/shared
   - npm run build -w apps/api
   - tsc --noEmit hatasız olmalı.

3. Manuel API testleri (curl/Postman):
   - POST /customers (sadece company+address)
   - GET  /customers (liste; contactCount, primaryContact alanları)
   - GET  /customers/:id (with contacts)
   - GET  /customers/:id/profile (contacts + opportunityTimeline.contact)
   - POST /customers/:customerId/contacts (yeni temsilci)
   - POST /customers/:customerId/contacts?force=false (dublike e-posta →
     409 + details.duplicateOf)
   - POST /customers/:customerId/contacts?force=true (yine de eklenir)
   - PATCH /customer-contacts/:id
   - DELETE /customer-contacts/:id (bağlı fırsat varsa silinir, fırsatın
     contactId'si null'a düşer)
   - POST /fairs/:fairId/opportunities (contactId olmadan) → 201
   - POST /fairs/:fairId/opportunities (contactId ile) → 201, response'da
     contact dolu
   - GET  /fairs/:fairId/opportunities?search=... → customer.company,
     contact.name, contact.email üzerinden filtre
   - PATCH /opportunities/:id (contactId değişimi)
   - GET  /fairs/:id → opportunities[].contact dolu
   - DELETE /customers/:id → contacts ve opportunities cascade silinir

Etkilenen dosyalar:
  DEĞİŞEN (gerekirse): app/(dashboard)/admin/audit-log/page.tsx entityType
    dropdown'una "customer_contact" eklenir — bu kısım frontend olduğu
    için MT-9 veya MT-14'te yapılabilir.

Bağımlılık: MT-3, MT-4, MT-5
Commit:
  test(api): manual smoke tests for customer/contact/opportunity flows
  (gerçek commit yoksa sadece doğrulama notu yeterli)

Durum: [ ]

----------------------------------------------------------------------
MT-7 — Frontend Web: Hooks & Query Keys
----------------------------------------------------------------------

Amaç: Yeni endpoint'leri tüketen TanStack Query hook'ları eklemek;
mevcut customer hook'larını yeni şemaya uyarlamak.

Yapılacaklar:

1. lib/query-keys.ts (güncelle):
   queryKeys.customers:
     all: ['customers'] as const
     list: (search?, sortBy?) => ['customers','list',{search,sortBy}]
     byId: (id) => ['customers', id]
     profile: (id) => ['customers', id, 'profile']
   queryKeys.customerContacts (yeni):
     byCustomer: (customerId) => ['customer-contacts', customerId]
   queryKeys.opportunities → değişmez.

2. hooks/use-customer-contacts.ts (yeni):
   - useCustomerContacts(customerId): GET /customers/:customerId/contacts
   - useCreateCustomerContact(customerId): POST /customers/:customerId/contacts
     - mutationFn: ({ dto, force }: { dto: CreateCustomerContactDto; force?: boolean })
     - 409 yanıtı (duplicateOf) onError'da yakalanmaz; component
       seviyesinde handle edilir (force=true ile retry önerisi).
   - useUpdateCustomerContact(): PATCH /customer-contacts/:id
   - useDeleteCustomerContact(customerId): DELETE /customer-contacts/:id
     - onSuccess: invalidate customerContacts.byCustomer(customerId) +
       customers.profile(customerId) + opportunities.byFair (etkilenen
       fırsatlar için).

3. hooks/use-customers.ts (güncelle):
   - useCustomers(search?): mevcut, ama dönen tip yeni Customer (firma).
   - useCustomerList(search?, sortBy): CustomerListItem'ın yeni alanları.
   - useCustomerProfile(id): yeni CustomerProfileResponse uyumlu.
   - useCreateCustomer(): dto = { company, address? }
   - useCreateCustomerWithContact() [yeni]:
       - dto = { company, address?, contact: CreateCustomerContactDto }
       - POST /customers/with-contact
       - onSuccess: invalidate customers.all
   - useUpdateCustomer(): dto = { company?, address? }
   - useDeleteCustomer(): mevcut, ama UI uyarı metni güncellenir.
   - Mevcut Note ile ilgili hook'lar (useCreate/Update/DeleteOpportunityNote)
     aynen kalır.

Etkilenen dosyalar:
  YENİ: apps/web/src/hooks/use-customer-contacts.ts
  DEĞİŞEN: apps/web/src/hooks/use-customers.ts,
           apps/web/src/lib/query-keys.ts

Bağımlılık: MT-6 (backend endpoint'leri hazır)
Commit:
  feat(web): add CustomerContact hooks, update Customer hooks for company
             model

Durum: [ ]

----------------------------------------------------------------------
MT-8 — Frontend Web: CustomerEditModal Refactor + CustomerContactEditModal (Yeni)
----------------------------------------------------------------------

Amaç: Müşteri düzenleme modalını "firma + adres" alanlarına indirgemek;
temsilci ekleme/düzenleme için ayrı bir modal yaratmak.

Yapılacaklar:

1. components/customer/CustomerEditModal.tsx (güncelle):
   - Form alanları: Firma (company), Adres (address)
   - Kaldırılan alanlar: Ad Soyad, Telefon, E-posta, Kartvizit
   - useUpdateCustomer ile kaydeder.
   - Validasyon: createCustomerSchema.

2. components/customer/CustomerContactEditModal.tsx (yeni):
   - Props: { open, onClose, customerId, initial?: CustomerContact | null }
   - Form alanları: Ad Soyad (zorunlu), Telefon, E-posta, Kartvizit görseli
   - "Kartvizit Tara" butonu (mevcut OCR akışı):
       * scanBusinessCard → parsed { company?, name, phone, email }
       * Firma adı bu modalda zaten sabit (parent component'in customerId'si);
         OCR'dan gelen company alanı bilgi/uyarı olarak gösterilir ama
         override etmez. (Kullanıcı isterse "Bu firma değil mi? Müşteriyi
         değiştir" linki ile profili kapatıp doğru firmaya gidebilir.)
   - Dublike uyarı akışı:
       * Submit'te useCreateCustomerContact 409 hatası dönerse:
         "Aynı firmada {ad} ({email}/{telefon}) bilgileriyle bir temsilci
          zaten var." mesajı + butonlar:
            [İptal] [Mevcut Temsilciyi Seç] [Yine de ekle]
       * "Yine de ekle" → force=true ile retry.
       * "Mevcut Temsilciyi Seç" → opener parent'a duplicateOf.id ile
         dönüş yapar (sadece OpportunityFormModal akışında anlamlı).
   - Update modunda dublike kontrolü atlanır (kullanıcı kendi kaydını
     güncelliyor).
   - Validasyon: createCustomerContactSchema.

3. Edit/add tetikleyiciler:
   - Customer profil sayfasında (MT-13) "+ Temsilci Ekle" ve her
     temsilcinin yanında "✏️ Düzenle" / "🗑 Sil" butonları bu modalı
     açar.

Etkilenen dosyalar:
  DEĞİŞEN: components/customer/CustomerEditModal.tsx
  YENİ:    components/customer/CustomerContactEditModal.tsx

Bağımlılık: MT-7
Commit:
  feat(web): simplify CustomerEditModal; add CustomerContactEditModal
             with duplicate warning flow

Durum: [ ]

----------------------------------------------------------------------
MT-9 — Frontend Web: CustomerSelectInput Refactor (İki Katmanlı)
----------------------------------------------------------------------

Amaç: OpportunityFormModal'da kullanılan müşteri-seçim bileşenini, önce
firma sonra temsilci seçimini sağlayacak şekilde yeniden tasarlamak.
Mevcut CustomerSelectInput.tsx tek katmanlıdır; yeni versiyon iki ayrı
adımı içerir.

Yapılacaklar:

1. components/opportunity/CustomerSelectInput.tsx (refactor):
   Props:
     selectedCustomer: Customer | null
     selectedContact:  CustomerContact | null
     onSelectCustomer: (customer: Customer | null) => void
     onSelectContact:  (contact: CustomerContact | null) => void

   Davranış:
   A) Firma seçim modu:
      - Text input: firma adı/adres yazarak arama (useCustomers(search))
      - Sonuç listesinde firma adı (bold) + (varsa) baş temsilci ipucu
      - "Yeni Firma Ekle" butonu:
        - Inline form: Firma Adı + Adres
        - "Devam Et" butonuna basınca, kullanıcı ya:
          (a) Bu firmaya bir temsilci eklemek için adım B'ye geçer
          (henüz Customer DB'ye yazılmaz — tek istekle ile yapılacaksa
          adım B'de "yarat ve seç" tetiklenir), VEYA
          (b) "Şimdilik temsilcisiz" seçeneğiyle direkt Customer yaratıp
              contact'sız ilerler. (Opportunity.contactId opsiyonel
              olduğundan bu mümkündür.)
        - "Kartvizit Tara" da burada açılır:
          * OCR çıktısı parsed.company → firma adına otomatik dolar.
          * Tarama sonrası: aynı company adı (lowercase eşit) ile mevcut
            bir Customer varsa otomatik olarak ona doğru pivot yapılır
            (Customer.findAll(search=company) → varsa onSelectCustomer
            ile seçilir). Yoksa yeni Customer formu doldurulmuş gelir.

   B) Temsilci seçim modu (sadece bir Customer seçildikten sonra):
      - useCustomerContacts(selectedCustomer.id) ile temsilci listesi
        çekilir.
      - Liste: ad + telefon + e-posta. Tıklanan temsilci seçilir.
      - "Temsilcisiz devam et" linki (opsiyonel — fırsat contactsız
        kalabilir).
      - "+ Yeni Temsilci Ekle" butonu inline form açar:
        - Ad Soyad, Telefon, E-posta, Kartvizit
        - "Kartvizit Tara" butonu OCR çıktısını doldurur. parsed.company
          farklıysa bilgi rozeti gösterilir ("Kartvizitteki firma:
          {company} — bu temsilci {selectedCustomer.company} firmasına
          eklenecek. Yine de devam?").
        - "Kaydet": useCreateCustomerContact ile yaratılır.
          - 409 (duplicate) gelirse uyarı + [İptal][Mevcut Temsilciyi
            Seç][Yine de Ekle] gösterilir.
          - "Mevcut Temsilciyi Seç" → o temsilci otomatik onSelectContact
            ile seçilir.

   C) "Müşteriyi Değiştir" linki:
      - Hem firma hem temsilci seçimini sıfırlar; A moduna döner.

2. components/opportunity/ContactSelectInput.tsx (varsa ayrı dosya;
   yoksa CustomerSelectInput içinde alt bileşen olarak):
   - B adımındaki temsilci seçim alt-bileşeni; yeniden kullanılabilirlik
     için ayrı bir dosyaya çıkarılabilir.

3. Mevcut CustomerSelectInput.tsx'in eski davranışını koruyan yedek
   sürüm gerekmez; bileşen sadece OpportunityFormModal tarafından
   kullanılıyor.

Etkilenen dosyalar:
  DEĞİŞEN: components/opportunity/CustomerSelectInput.tsx
  YENİ (gerekirse): components/opportunity/ContactSelectInput.tsx

Bağımlılık: MT-7, MT-8
Commit:
  feat(web): two-step customer + contact picker with duplicate handling
             and business-card scan

Durum: [ ]

----------------------------------------------------------------------
MT-10 — Frontend Web: OpportunityFormModal Güncelle
----------------------------------------------------------------------

Amaç: Fırsat formunu yeni iki katmanlı müşteri-temsilci seçimi ile
çalışacak şekilde uyarlamak; kartvizit görseli artık temsilciye yazılır.

Yapılacaklar:

1. components/opportunity/OpportunityFormModal.tsx:
   - State:
       selectedCustomer: Customer | null
       selectedContact:  CustomerContact | null
       budgetRaw, budgetCurrency, conversionRate,
       opportunityProducts, cardImage (yerel UI state),
       submitError
   - useEffect(initial):
       selectedCustomer = initial.customer
       selectedContact  = initial.contact ?? null
       cardImage = initial.contact?.cardImage ?? ''
   - CustomerSelectInput kullan; onSelectCustomer/onSelectContact ile
     state'i besle.
   - Kartvizit Fotoğrafı bölümü:
       * Artık fırsat üzerinde tutulmaz; mevcut implementasyonda kart
         görseli Customer üzerine yazılıyordu. Yeni davranış: görsel
         seçilmiş contact'a yazılır. selectedContact yoksa bölüm
         "Önce bir temsilci seçin/oluşturun" mesajı gösterir.
       * Save sırasında contact.cardImage farklıysa
         useUpdateCustomerContact ile güncelle.
   - handleSubmit:
       dto = {
         customerId: selectedCustomer.id,
         contactId:  selectedContact?.id ?? null,
         budgetRaw, budgetCurrency, conversionRate,
         products: [], opportunityProducts: [...]
       }
       isEdit ? updateOpportunity({ id, dto }) : createOpportunity(dto)
   - Validasyon: selectedCustomer zorunlu, selectedContact opsiyonel.

2. Pipeline ve Aşama Geçmişi bloğu mevcut. Değişmez (Opportunity üzerine
   yazılmış stages dokunulmaz).

Etkilenen dosyalar:
  DEĞİŞEN: components/opportunity/OpportunityFormModal.tsx

Bağımlılık: MT-9
Commit:
  refactor(web): integrate two-step customer/contact picker into
                 OpportunityFormModal; move card image to contact

Durum: [ ]

----------------------------------------------------------------------
MT-11 — Frontend Web: OpportunityCard Güncelle
----------------------------------------------------------------------

Amaç: Fırsat kartında kişi/telefon/e-posta/kartvizit bilgilerini
contact'tan beslemek; contact yoksa anlamlı bir boş durum göstermek.

Yapılacaklar:

1. components/opportunity/OpportunityCard.tsx:
   - Üst satır (kapalı kart):
       Firma adı (büyük): opportunity.customer.company
       Temsilci adı (küçük): opportunity.contact?.name ?? '— Temsilci atanmamış —'
   - Kartvizit ikonu: opportunity.contact?.cardImage varsa.
   - Açık kart detayları:
       Telefon: opportunity.contact?.phone (yoksa satır gizli)
       E-posta: opportunity.contact?.email (yoksa satır gizli)
       Kartvizit: opportunity.contact?.cardImage (yoksa gizli)
   - Müşteri profil linki: /customers/:customer.id (firma profili) —
     mevcut Link aynen kalır.
   - Silme onay mesajı:
       contact varsa: `"{contact.name}" ({customer.company}) fırsatını sil`
       contact yoksa: `"{customer.company}" fırsatını sil`

Etkilenen dosyalar:
  DEĞİŞEN: components/opportunity/OpportunityCard.tsx

Bağımlılık: MT-1, MT-5, MT-10
Commit:
  refactor(web): show contact name/phone/email in OpportunityCard

Durum: [ ]

----------------------------------------------------------------------
MT-12 — Frontend Web: Müşteri Liste Sayfası Güncelle
----------------------------------------------------------------------

Amaç: /customers ekranını firma odaklı liste yapısına geçirmek.

Yapılacaklar:

1. components/customer/CustomerListCard.tsx:
   - "kişi adı" satırı yerine:
       * "{contactCount} temsilci" rozeti
       * (varsa) "Baş temsilci: {primaryContact.name}" küçük satır
   - Diğer (firma adı, fırsat sayısı, son temas) aynen kalır.

2. app/(dashboard)/customers/page.tsx:
   - useCustomerList yeni alanlar (contactCount, primaryContact) ile uyumlu.
   - "X müşteri · Y farklı firma" satırı:
       Artık müşteri sayısı = firma sayısı. Şu satır basitleştirilir:
       "{customers.length} firma".
   - Sıralama seçeneklerine "Temsilci Sayısı" eklenebilir (opsiyonel).

Etkilenen dosyalar:
  DEĞİŞEN: components/customer/CustomerListCard.tsx,
           app/(dashboard)/customers/page.tsx

Bağımlılık: MT-7
Commit:
  refactor(web): customer list shows company + contact count

Durum: [ ]

----------------------------------------------------------------------
MT-13 — Frontend Web: Müşteri Profil Sayfası Refactor (Firma 360°)
----------------------------------------------------------------------

Amaç: /customers/[id] ekranını firma profili + temsilci yönetimi +
fırsat zaman çizgisi yapısına dönüştürmek.

Yapılacaklar:

1. app/(dashboard)/customers/[id]/page.tsx:
   Header bölümü:
     - Sol: firma logosu yerine firma adının baş harfleri.
       (Mevcut kartvizit görseli mantığı artık burada gösterilmez; kartvizit
        artık temsilciye aittir.)
     - Firma adı (Playfair), Adres satırı.
     - Eski "name + phone + email" kümesi kaldırılır.
     - Sağ üst: Düzenle (firma) + Sil (firma).

   YENİ Bölüm — Temsilciler (header altında, KPI'lardan önce):
     - Kart başlığı: "Temsilciler (N)"
     - Her temsilci için satır:
         * Ad Soyad (bold)
         * 📞 telefon · ✉ e-posta (tıklanabilir)
         * Kartvizit küçük thumbnail (varsa)
         * Sağda: ✏️ Düzenle · 🗑 Sil butonları
     - Liste sonunda "+ Temsilci Ekle" dashed buton →
       CustomerContactEditModal açılır.
     - Boş durum: "Henüz temsilci eklenmemiş. Fuarda kartvizit alıp
       tarayarak hızlıca ekleyebilirsiniz." + CTA.

   KPI bölümü, Bekleyen Aksiyonlar, Fuar Katılım Geçmişi, Notlar
   bölümleri:
     - Yapı korunur. Sadece her opportunity satırına "Temsilci: {name}"
       yardımcı satırı eklenir (kontrol: opportunity.contact?.name).

2. Silme akışları:
   - Firma sil: mevcut ConfirmDialog mesajı güncellenir:
     "{company} firmasını ve N temsilcisini, M fırsatını silmek
      istediğinizden emin misiniz?"
   - Temsilci sil:
     "{contact.name} temsilcisini silmek istediğinizden emin misiniz?
      Bağlı K fırsatın temsilci ataması kaldırılacak."
     (K hesaplanır: opportunityTimeline.filter(opp => opp.contact?.id === contactId).length)

Etkilenen dosyalar:
  DEĞİŞEN: app/(dashboard)/customers/[id]/page.tsx
  YENİ (alt-bileşen):
    components/customer/CustomerContactList.tsx (header altı temsilci
    bloku — page.tsx'in büyümemesi için ayrı tutulur)

Bağımlılık: MT-7, MT-8
Commit:
  feat(web): refactor customer profile to company 360 with contact
             management

Durum: [ ]

----------------------------------------------------------------------
MT-14 — Frontend Web: Audit Log, Top Bar, Diğer Küçük Yerler
----------------------------------------------------------------------

Amaç: UI'da kalan "müşteri" referanslarının firma-temsilci modeliyle
uyumunu sağlamak.

Yapılacaklar:

1. app/(dashboard)/admin/audit-log/page.tsx:
   - entityType dropdown'una "customer_contact" seçeneği ekle (Türkçe
     etiket: "Temsilci").

2. Fuar detay sayfası ve OpportunityToolbar:
   - Arama input placeholder'ı: "Firma, temsilci veya e-posta ara..."
   - (Backend zaten bu üçü üzerinden filtreliyor — MT-5.)

3. Diğer toplu kontroller:
   - "müşteri kartı" yazısı kalan yerleri tara: empty state, breadcrumb.
   - Kullanıcıya görünen "kişi adı / telefon / e-posta" gösterimleri
     fırsat bağlamında contact'tan beslenir.

Etkilenen dosyalar:
  DEĞİŞEN: app/(dashboard)/admin/audit-log/page.tsx,
           components/fair/OpportunityToolbar.tsx (varsa),
           küçük metin/placeholder düzenlemeleri.

Bağımlılık: MT-13
Commit:
  chore(web): align audit-log filter and toolbar copy with contact model

Durum: [ ]

----------------------------------------------------------------------
MT-15 — Mobile: Minimum Uyumluluk
----------------------------------------------------------------------

Amaç: Mobil derlemenin bozulmaması ve temel akışların çalışması için
minimum güncellemeler. Tam çoklu-temsilci yönetimi mobilde Phase 5'e
ertelenir.

Yapılacaklar:

1. apps/mobile/components/customer/CustomerForm.tsx:
   - Yeni Customer akışı:
       * Eski tek formdaki tüm alanlar (company, name, phone, email,
         address, cardImage) korunur, ancak submit logic'i değişir:
         - useCreateCustomerWithContact() mutation'unu çağırır:
           dto = { company, address, contact: { name, phone, email, cardImage } }
         - Backend tek istek ile hem Customer hem ilk Contact yaratır.
   - Görsel olarak değişiklik yok; veri akışı şeffaf şekilde yenilenir.

2. apps/mobile/components/customer/CustomerEditSheet.tsx:
   - Edit modu artık iki sekmeye ayrılır:
       * "Firma" sekmesi: company, address (useUpdateCustomer)
       * "Temsilciler" sekmesi:
         - İlk temsilci için inline edit alanları (name/phone/email/cardImage)
         - "Çoklu temsilci yönetimi için profil ekranına gidin" linki
           (mobilde tam yönetim Phase 5'te eklenir).

3. apps/mobile/components/customer/CustomerListCard.tsx:
   - "{customer.name}" satırı → "{primaryContact?.name ?? 'Temsilci yok'}".
   - Veya tamamen "{contactCount} temsilci" rozeti gösterilir.

4. apps/mobile/components/customer/CustomerProfileScroll.tsx:
   - profile.customer.name → primaryContact?.name (yoksa "—")
   - profile.customer.phone/email → primaryContact?.phone/email
   - profile.customer.cardImage → primaryContact?.cardImage
   - "Temsilciler" bölümü (basit liste — read-only ya da minimum CRUD).

5. apps/mobile/components/opportunity/OpportunityCard.tsx:
   - customer.name → contact?.name ?? '—'
   - customer.phone → contact?.phone ?? null
   - customer.email → contact?.email ?? null
   - customer.cardImage → contact?.cardImage ?? null

6. apps/mobile/components/customer/CustomerSelectInput.tsx:
   - Yeni fırsat akışında minimum davranış: firma seç → otomatik olarak
     o firmanın ilk temsilcisi seçilir. Temsilci yoksa "Profil
     ekranından temsilci ekleyin" uyarısı.
   - Tam iki katmanlı seçim Phase 5'te eklenir.

7. apps/mobile/hooks/use-customers.ts:
   - DTO/profil response yeni şemaya uyarlanır.

Build:
  - npm run build -w apps/mobile (Expo) hatasız olmalı.

Etkilenen dosyalar:
  DEĞİŞEN: yukarıdaki tüm mobil dosyalar.

Bağımlılık: MT-7 (web hooks'larındaki API kullanımı referans)
Commit:
  chore(mobile): minimum compat with Customer/Contact split; full
                 contact management deferred to Phase 5

Durum: [ ]

----------------------------------------------------------------------
MT-16 — Test & Doğrulama
----------------------------------------------------------------------

Amaç: Müşteri/Temsilci Ayrıştırması'nın uçtan uca doğru çalıştığını
test etmek. test-strategy.mdc'ye göre unit + integration testlerle
desteklenir.

Backend testleri:
  [ ] POST /customers — sadece company+address ile oluşturulur.
  [ ] POST /customers/with-contact — composite (firma + ilk temsilci).
  [ ] GET  /customers — contactCount ve primaryContact alanları döner.
  [ ] GET  /customers/:id/profile — contacts, opportunityTimeline.contact
       doğru populate edilir.
  [ ] POST /customers/:customerId/contacts — yeni temsilci ekler.
  [ ] POST /customers/:customerId/contacts (dublike email) → 409 +
       details.duplicateOf.
  [ ] POST /customers/:customerId/contacts (dublike telefon) → 409.
  [ ] POST /customers/:customerId/contacts?force=true (dublike) → 201.
  [ ] PATCH /customer-contacts/:id — güncelleme.
  [ ] DELETE /customer-contacts/:id — bağlı fırsatların contactId'si null.
  [ ] POST /fairs/:fairId/opportunities — contactId opsiyonel olarak çalışır.
  [ ] POST /fairs/:fairId/opportunities — yanlış customer'ın contactId'si
       verildiğinde 400 (ensureContactBelongsToCustomer).
  [ ] GET  /fairs/:fairId/opportunities?search=... — firma + temsilci üzerinden
       arama.
  [ ] DELETE /customers/:id — contacts + opportunities cascade.
  [ ] Migration sonrası: Opportunity.contactId NULL olan kayıt yok.

Frontend Web testleri:
  [ ] Müşteri liste sayfası: firma kartları, temsilci sayısı.
  [ ] Müşteri profil sayfası: temsilci yönetimi (ekle/düzenle/sil) ve
       her temsilci satırının dublike uyarısı.
  [ ] Fuar detayında "+ Fırsat Ekle" → iki katmanlı seçim:
       firma → temsilci (mevcut/yeni).
  [ ] "Yeni Firma + Yeni Temsilci" akışı: tek modal içinde tamamlanır,
       fırsat kaydedilir.
  [ ] "Yeni Temsilci + Kartvizit Tara": OCR sonrası company alanı
       eşleşen Customer'a pivot ettirir (yeni Customer yaratmaz).
  [ ] Dublike temsilci uyarısı: aynı firmada aynı email → kullanıcı
       "Mevcut Temsilciyi Seç" veya "Yine de ekle" seçeneklerini görür.
  [ ] OpportunityCard: contact yoksa "Temsilci atanmamış" gösterir,
       telefon/e-posta satırları gizli.
  [ ] Fırsat düzenleme: contactId NULL → yeni contact seçimi → kayıt.

Frontend Mobile testleri:
  [ ] Mobil derleme hatasız (npm run lint, tsc --noEmit).
  [ ] Yeni müşteri akışı mobilde çalışır (single form → composite endpoint).
  [ ] Liste/profil/fırsat kartı temsilci alanlarını gösteriyor.

Build kontrolü:
  [ ] npm run build -w packages/shared
  [ ] npm run build -w apps/api
  [ ] npm run build -w apps/web
  [ ] npm run lint (tüm workspace)

Bağımlılık: MT-1 — MT-15
Commit:
  test: verify customer/contact separation end-to-end

Durum: [ ]

==============================
ÖZET — İŞ SIRASI
==============================

MT-1  → Shared types & schemas (Customer sadeleşir, CustomerContact eklenir)
MT-2  → DB migration (CustomerContact, Opportunity.contactId, data taşıma)
MT-3  → Backend CustomerContact modülü (yeni)
MT-4  → Backend Customer modülü refactor (firma) + profile response
MT-5  → Backend Opportunity modülü güncelle (contactId)
MT-6  → Backend audit/build/manuel test
MT-7  → Web hooks & query keys
MT-8  → Web CustomerEditModal refactor + CustomerContactEditModal (yeni)
MT-9  → Web CustomerSelectInput refactor (iki katmanlı seçim)
MT-10 → Web OpportunityFormModal güncelle
MT-11 → Web OpportunityCard güncelle
MT-12 → Web müşteri liste sayfası güncelle
MT-13 → Web müşteri profil sayfası refactor (Firma 360 + temsilci yönetimi)
MT-14 → Web audit-log/toolbar/küçük metinler
MT-15 → Mobile minimum uyumluluk
MT-16 → Test & doğrulama

Toplam: 16 feature
Tahmini etki: ~30 dosya (yeni ve değişen).

==============================
İLERİYE DÖNÜK NOTLAR (Bu fazın kapsamı DIŞINDA)
==============================

- "Müşteri (Firma) Birleştirme" özelliği:
  Aynı şirketi temsil eden ama farklı yazılmış iki Customer satırını
  manuel olarak birleştirme. Bu fazda otomatik dedup yapılmıyor;
  ileride bir admin aracı olarak eklenebilir.

- Mobil için tam çoklu-temsilci yönetimi (Phase 5 mobile içinde).

- Dublike e-posta/telefon kontrolünü DB tarafına çekmek (generated
  columns + partial unique index ile). Mevcut tasarımda Service
  seviyesinde yapılıyor; firma başına temsilci sayısı düşük olduğu
  sürece bu kabul edilebilir.

- Audit log: "customer_contact" entityType için Phase 2'deki audit-log
  ekranında ayrı bir filtre ve renk kodu.

- Raporlama tarafında "Müşteri 360°" rapor şablonu (Phase 5/6) bu yeni
  modele göre güncellenecek; özellikle "müşteri başına kişi sayısı"
  ve "temsilci dönüşüm oranı" gibi metrikler kazanılır.

==============================
ÖNEMLİ NOTLAR
==============================

- Tüm geliştirme .cursor/rules/feature-development-protocol.mdc'ye göre
  her MT için ayrı feature branch'te yapılır.
- Migration geri dönüşümsüzdür; öncesinde DB yedeği zorunlu (pg_dump).
- Otomatik firma birleştirme YAPILMAZ; her eski Customer satırı 1:1 olarak
  korunur ve 1 temsilci üretir.
- Backend ve frontend kontratı aynı anda değişir; bu yüzden bu fazda
  feature'ları sırayla tamamlamak ve her MT sonunda build/lint gate'ini
  geçirmek kritik. Eksik MT ile main'e merge yapılmamalıdır.
- Phase 2 Feature 31 (Rapor modalı) ve Phase 5/6 feature'ları bu faz
  tamamlandıktan SONRA yeniden ele alınmalıdır — özellikle filtreleme
  artık "temsilci adı" ve "firma" üzerinden ayrı yapılabilir.
