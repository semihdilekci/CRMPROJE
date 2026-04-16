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

# ============================== 2. POSTGRESQL VERİTABANI OLUŞTURMA

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

### 2a. Alternatif: AWS RDS PostgreSQL (yerel Postgres yerine)

Geliştirme veya staging için veritabanını **yönetilen bulut**ta tutmak istiyorsanız:

1. AWS’de RDS PostgreSQL örneği oluşturun (sürüm **15+** önerilir; güvenlik grubu ve public/private erişim modeli: `docs/deployment-and-env-strategy.md` **§1d**).
2. `apps/api/.env` içindeki **`DATABASE_URL`** değerini RDS **endpoint**, kullanıcı, veritabanı adı ve genelde **`?sslmode=require`** ile güncelleyin. Örnek şekil: `postgresql://USER:PASS@YOUR_RDS_ENDPOINT.region.rds.amazonaws.com:5432/crm_db?sslmode=require`
3. Şema: `cd apps/api && npx prisma migrate deploy` (RDS’e ağ erişimi olan makineden).
4. Yerelden veri taşıma ve `uploads/` dosyaları: **§1d** içindeki `pg_dump` / `pg_restore` özeti.

**Dikkat:** Aynı RDS örneğini tüm geliştiriciler paylaşıyorsanız migration ve test verisi çakışmaları olabilir; mümkünse kişi/ekip başına ayrı RDS **dev** instance kullanın.

# ============================== 3. ENVIRONMENT VARIABLES

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
HOST=0.0.0.0
NODE_ENV="development"
CORS_ORIGIN="http://localhost:3000"

`HOST=0.0.0.0` (varsayılan): API tüm ağ arayüzlerinde dinler; fiziksel telefon veya emülatörden LAN IP ile test için gereklidir. Yalnızca bu makineden erişim istiyorsanız `HOST=127.0.0.1` kullanın.

Frontend (apps/web/.env.local):
cp apps/web/.env.example apps/web/.env.local

NEXT_PUBLIC_API_URL="http://localhost:3001/api/v1"

**Web ve httpOnly refresh (Faz 7):** Tarayıcıda `apps/web` istekleri varsayılan olarak **aynı origin** üzerinden gider (`next.config` içindeki geliştirme rewrite’ı: `/api/v1` → API). Bu düzende **httpOnly** refresh çerezi (`crm_refresh`) ile oturum yenileme tutarlı çalışır. `NEXT_PUBLIC_API_URL` ile istemciyi **doğrudan farklı porta** (örn. `http://localhost:3001/api/v1`) yönlendirirseniz istekler **çapraz origin** olur; `SameSite` / çerez gönderimi ve CORS’u ayrıca doğrulamanız gerekir. Üretimde hedef mimari: **Senaryo A** (tek host + `/api/v1` path) — bkz. `docs/deployment-and-env-strategy.md`, `docs/phase-7-security-hardening.md`.

Mobil (apps/mobile/.env — Expo):
cp apps/mobile/.env.example apps/mobile/.env

Fiziksel cihaz + Expo Go ile test: bilgisayarın yerel ağ IP’sini kullanın, örn. `EXPO_PUBLIC_API_URL=http://192.168.1.42:3001/api/v1`. Telefon ve bilgisayar aynı Wi‑Fi’de olmalı; misafir ağı / istemci izolasyonu (AP isolation) açıksa bağlantı kurulamaz. **iOS Simülatör:** `EXPO_PUBLIC_API_URL` tanımlıysa o adres kullanılır; tanımlı değilse `http://127.0.0.1:3001/api/v1`. Android emülatör: `localhost`/`127` ile eşleşen env yoksa `10.0.2.2` kullanılır (`getApiBaseUrl()`).

UYARI: .env dosyalarını ASLA git'e commit etmeyin.

---

### Ortam dosyaları — hangi `.env` nerede?

Aynı monorepoda **birden fazla .env** olması normaldir; her biri farklı çalışma biçimine hizmet eder:

| Dosya | Ne zaman kullanılır | Not |
|--------|---------------------|-----|
| **`apps/api/.env`** | API’yi **yerelde** `npm run start:dev` ile çalıştırırken | `DATABASE_URL` genelde `localhost` Postgres veya **AWS RDS** endpoint + TLS (**§2a**, `docs/deployment-and-env-strategy.md` **§1d**); `PORT` (örn. 3001) burada tanımlıdır. |
| **`apps/web/.env.local`** | Web’i **yerelde** `npm run dev` ile çalıştırırken | `NEXT_PUBLIC_*` burada; API portu ile uyumlu olmalıdır. Geliştirmede çoğu istek rewrite ile gider; doğrudan API URL kullanıyorsanız portu `apps/api/.env` ile eşleştirin. |
| **`infra/app/.env.app`** | **Docker** (`docker-compose.app.yml`) ile API + Web çalıştırırken | Postgres **host’ta** ise `DATABASE_URL` içinde **`host.docker.internal`**; **RDS** ise endpoint hostname + TLS (`infra/app/.env.app.example`). `API_PORT` ile **`NEXT_PUBLIC_API_URL`** aynı host portuna işaret etmelidir. |
| **`infra/app/.env`** | Docker Compose’un `${VAR}` okuması | Pratikte **`infra/app/.env.app` dosyasına symlink** (`ln -sf .env.app .env`). |

**Docker imajı:** Repo kökündeki `.dockerignore`, `**/.env` ve `**/.env.local` dosyalarını build bağlamına **almaz**; sırlar container imajına gömülmez.

**Ayrıntılı Docker + CSP + canlı checklist:** `docs/deployment-and-env-strategy.md` (§0, §1b).

---

### Docker ile API + Web (isteğe bağlı)

Yerel Node süreçleri yerine **container** kullanmak istiyorsanız:

1. `cp infra/app/.env.app.example infra/app/.env.app` — değerleri doldurun (`DATABASE_URL`, JWT, `CORS_ORIGIN`, `API_PORT`, `NEXT_PUBLIC_API_URL`).
2. `cd infra/app && ln -sf .env.app .env` (compose build sırasında değişkenlerin görülmesi için önerilir).
3. Repo kökünden: `docker compose -f infra/app/docker-compose.app.yml up -d --build`.

PostgreSQL **host makinede** veya **AWS RDS** üzerinde olabilir; `DATABASE_URL` hedefe göre ayarlanır. Migration’ları veritabanına erişebilen ortamdan çalıştırırsınız (`cd apps/api && npx prisma migrate deploy`). Tam prosedür (Docker portları, RDS, CSP): **`docs/deployment-and-env-strategy.md`** (**§1b**, **§1d**).

---

### Fiziksel iPhone + Expo Go (şirket Wi‑Fi dahil)

İki uç nokta gerekir; ikisi de **telefonun Mac’e LAN üzerinden** erişebilmesine bağlıdır:

| Ne | Port | Açıklama |
|----|------|----------|
| **Metro (JS bundle)** | 8081 | Expo Go önce projeyi buradan indirir. Varsayılan `expo start` çoğu zaman yalnızca `localhost` içindir; **telefonda “başlatılamıyor”** görürsen **`--lan` kullan.** |
| **Nest API** | 3001 | `EXPO_PUBLIC_API_URL=http://<Mac-LAN-IP>:3001/api/v1` — API `HOST=0.0.0.0` ile dinlemeli. |

**Önerilen komut (Mac):**

```bash
cd apps/mobile
npm run start:lan
```

Terminalde görünen **QR** veya `exp://<LAN-IP>:8081` adresini Expo Go ile aç. Mac IP’sini öğrenmek için (Wi‑Fi genelde `en0`): `ipconfig getifaddr en0`

**apps/mobile/.env** (fiziksel cihazda LAN IP zorunlu; simülatörde isteğe bağlı):

```env
EXPO_PUBLIC_API_URL=http://192.168.x.x:3001/api/v1
```

`192.168.x.x` **Metro ile aynı Mac’in** güncel LAN IP’si olmalı (DHCP değiştiyse güncelle). Sonra: `npx expo start --clear` veya en azından Metro’yu yeniden başlat.

**Şirket ağında hâlâ Expo Go projeyi açmıyorsa:**

1. **İstemci izolasyonu (AP isolation)** açıksa cihazlar birbirini görmez — IT’den istisna veya **kişisel hotspot** (telefondan internet paylaş, Mac’i ona bağla) deneyin.
2. **macOS Güvenlik Duvarı:** Sistem Ayarları → Ağ → Güvenlik Duvarı → Node / Terminal / Expo için gelen bağlantılara izin.
3. **iOS:** Ayarlar → Gizlilik ve Güvenlik → **Yerel Ağ** → **Expo Go** açık olsun.
4. **`exp://…:8081` request timeout** — Metro’ya telefon LAN’dan ulaşamıyorsa (şirket AP izolasyonu vb.) **kişisel hotspot** kullanın: test telefonunuzdan hotspot açın, Mac’i bu ağa bağlayın; `ipconfig getifaddr en0` ile Mac’in IP’sini alın; `npm run start:lan` ve QR ile yeniden deneyin.

### Expo Go açıldı, uygulama: "Sunucuya bağlanılamıyor…" (Metro / QR çalışıyor)

Bu mesaj **Nest API’ye** (axios) erişilemediğinde çıkar; **telefon `EXPO_PUBLIC_API_URL` adresine (Mac IP + port 3001) gidemiyordur**.

**Çözüm — aynı ağ + doğru IP:**

1. API çalışsın: `npm run dev -w apps/api` (port 3001); API `0.0.0.0` üzerinden dinlemeli (varsayılan `HOST`).
2. Mac ile telefon **aynı ağda** olsun (tercihen **kişisel hotspot**: telefon hotspot, Mac bağlı).
3. Mac’te: `ipconfig getifaddr en0` (gerekirse ilgili arayüz) → `apps/mobile/.env`:  
   `EXPO_PUBLIC_API_URL=http://<bu-ip>:3001/api/v1`
4. Metro’yu yeniden başlatın: `cd apps/mobile && npm run start:lan` ve env değiştiyse `npx expo start --clear`.
5. Telefonda tarayıcıdan dene: `http://<aynı-ip>:3001/api/v1` — yanıt yoksa önce ağ / güvenlik duvarı.

# ============================== 4. VERİTABANI MIGRATION

**Prisma `binaryTargets`:** `apps/api/prisma/schema.prisma` içinde `native` + `debian-openssl-3.0.x` tanımlıdır (yerel geliştirme + API Docker imajı). Şema veya generator değişince: `cd apps/api && npx prisma generate`. Docker tabanı (Alpine vb.) değişirse hedefleri `docs/deployment-and-env-strategy.md` §1c ve Prisma dokümantasyonuna göre güncelleyin.

Prisma migration'larını çalıştırın:
cd apps/api
npx prisma migrate dev

Bu komut:

- Mevcut migration dosyalarını veritabanına uygular
- Prisma client'ı yeniden generate eder

İlk admin kullanıcısını oluşturmak için seed script çalıştırın:
npx prisma db seed

# ============================== 5. UYGULAMALARI BAŞLATMA

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

# ============================== 6. DOĞRULAMA

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

# ============================== 7. YARARLI KOMUTLAR

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

"Expo Go telefonda projeyi açmıyor / zaman aşımı":

- `cd apps/mobile && npm run start:lan` kullanın; QR’da **localhost** değil **Mac LAN IP** görünmeli.
- Telefon ve Mac **aynı SSID** (aynı Wi‑Fi); misafir ağı kullanmayın.
- iOS **Yerel Ağ** izni: Expo Go açık olsun.

"API’ye telefondan erişilemiyor (web çalışıyor)":

- `apps/mobile/.env` içinde `EXPO_PUBLIC_API_URL=http://<Mac-LAN-IP>:3001/api/v1` ve API `HOST=0.0.0.0` (veya varsayılan).

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
