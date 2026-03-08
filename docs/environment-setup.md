Fuar CRM — Geliştirme Ortamı Kurulum Rehberi

Bu doküman, projeyi sıfırdan kurup çalıştırmak için gereken tüm adımları içerir.

==============================
ÖN KOŞULLAR
==============================

Aşağıdaki yazılımların sisteminizde kurulu olması gerekmektedir:

Node.js — v20.x LTS veya üzeri (https://nodejs.org)
npm — v10.x veya üzeri (Node.js ile birlikte gelir)
PostgreSQL — v15.x veya üzeri (https://www.postgresql.org)
Git — v2.40+ (https://git-scm.com)
Redis — opsiyonel, geliştirmede gerekli değil (production: Upstash)

Versiyon kontrolü:
node --version (v20.x+ olmalı)
npm --version (v10.x+ olmalı)
psql --version (v15.x+ olmalı)
git --version (v2.40+ olmalı)

==============================

1. # REPO CLONE & BAĞIMLILIK KURULUMU

git clone <repo-url> CRMProje
cd CRMProje

Tüm workspace bağımlılıklarını kur (root'tan çalıştır):
npm install

Bu komut apps/api, apps/web ve packages/shared bağımlılıklarını da kurar
(npm workspaces otomatik olarak alt dizinleri işler).

============================== 2. POSTGRESQL VERİTABANI OLUŞTURMA
==============================

PostgreSQL servisinin çalıştığından emin olun:
macOS (Homebrew): brew services start postgresql@15
Linux: sudo systemctl start postgresql

Veritabanı ve kullanıcı oluşturma:
psql -U postgres

CREATE DATABASE crm_db;
CREATE USER crm_user WITH ENCRYPTED PASSWORD 'crm_password';
GRANT ALL PRIVILEGES ON DATABASE crm_db TO crm_user;
ALTER USER crm_user CREATEDB;
\q

Not: Yukarıdaki değerler geliştirme ortamı içindir.
Production'da güçlü parolalar ve kısıtlı yetkiler kullanın.

============================== 3. ENVIRONMENT VARIABLES
==============================

Her app için .env dosyası oluşturun (.env.example dosyalarını kopyalayın):

Backend (apps/api/.env):
cp apps/api/.env.example apps/api/.env

Aşağıdaki değişkenleri doldurun:

DATABASE_URL="postgresql://crm_user:crm_password@localhost:5432/crm_db"
JWT_ACCESS_SECRET="dev-access-secret-change-in-production"
JWT_REFRESH_SECRET="dev-refresh-secret-change-in-production"
JWT_ACCESS_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"
PORT=3001
NODE_ENV="development"
CORS_ORIGIN="http://localhost:3000"

Frontend (apps/web/.env.local):
cp apps/web/.env.example apps/web/.env.local

NEXT_PUBLIC_API_URL="http://localhost:3001/api/v1"

UYARI: .env dosyalarını ASLA git'e commit etmeyin.

============================== 4. VERİTABANI MIGRATION
==============================

Prisma migration'larını çalıştırın:
cd apps/api
npx prisma migrate dev

Bu komut:

- Mevcut migration dosyalarını veritabanına uygular
- Prisma client'ı yeniden generate eder

İlk admin kullanıcısını oluşturmak için seed script çalıştırın:
npx prisma db seed

============================== 5. UYGULAMALARI BAŞLATMA
==============================

Her app'i ayrı terminal penceresinde başlatın:

Backend (NestJS):
cd apps/api
npm run start:dev

Çalışma adresi: http://localhost:3001
API base URL: http://localhost:3001/api/v1

Frontend (Next.js):
cd apps/web
npm run dev

Çalışma adresi: http://localhost:3000

Veya root'tan tüm app'leri aynı anda başlatın:
npm run dev

============================== 6. DOĞRULAMA
==============================

Her şeyin çalıştığını doğrulamak için:

Backend health check:
curl http://localhost:3001/api/v1/health

Beklenen yanıt: { "success": true, "message": "OK" }

Frontend:
Tarayıcıda http://localhost:3000 açın.
Login sayfası görünmelidir.

Veritabanı bağlantısı:
cd apps/api
npx prisma studio

Prisma Studio tarayıcıda açılır, tabloları görebilirsiniz.

============================== 7. YARARLI KOMUTLAR
==============================

Prisma:
npx prisma migrate dev — yeni migration oluştur ve uygula
npx prisma migrate deploy — mevcut migration'ları uygula (production)
npx prisma generate — Prisma client'ı yeniden generate et
npx prisma studio — veritabanı tarayıcısı aç
npx prisma db seed — seed data yükle
npx prisma migrate reset — veritabanını sıfırla (TÜM VERİ SİLİNİR)

Test:
npm test — tüm testleri çalıştır
npm run test:watch — watch modunda test
npm run test:cov — coverage raporu

Lint:
npm run lint — tüm app'lerde lint çalıştır
npm run lint:fix — otomatik düzeltilebilir hataları düzelt

Build:
npm run build — tüm app'leri build et

==============================
SORUN GİDERME
==============================

"Cannot connect to PostgreSQL":

- PostgreSQL servisinin çalıştığından emin olun.
- DATABASE_URL'deki kullanıcı adı, parola ve port'u kontrol edin.
- psql -U crm_user -d crm_db ile bağlantıyı test edin.

"Module not found" hataları:

- Root dizinde npm install çalıştırın.
- packages/shared build edilmiş mi kontrol edin: cd packages/shared && npm run build

"Port already in use":

- Başka bir process ilgili portu kullanıyor olabilir.
- lsof -i :3001 ile kontrol edin ve kill -9 <PID> ile durdurun.

Prisma migration hataları:

- npx prisma migrate reset ile veritabanını sıfırlayıp tekrar deneyin.
- Schema syntax hatası varsa prisma/schema.prisma dosyasını kontrol edin.

@crm/shared import hataları:

- packages/shared'ın build edildiğinden emin olun.
- Root package.json'da workspace tanımının doğru olduğunu kontrol edin.
