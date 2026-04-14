# Canlıya Geçiş Stratejisi ve Ortam Farkları

Bu doküman, **development (DEV)** ile **production (PROD)** ortamları arasındaki farkları ve canlıya geçerken yapılması gerekenleri özetler. Yeni ortam-bağımlı özellik eklendiğinde bu dosya güncellenmelidir.

---

## 0. Mimari kararlar (yerel geliştirme, Docker, güvenlik)

Bu bölüm, monorepo içinde **süreç boyunca netleşen** çalışma biçimlerini tek yerde toplar; ayrıntılı komutlar için `docs/environment-setup.md` ve aşağıdaki bölümlere bakın.

| Karar | İçerik |
|--------|--------|
| **Varsayılan geliştirme** | API ve Web **Node süreçleri** olarak çalışır (`npm run dev` / workspace script’leri). Ortam değişkenleri **`apps/api/.env`**, **`apps/web/.env.local`**, mobil için **`apps/mobile/.env`** ile yönetilir; bu dosyalar **git’e girmez**. |
| **Docker (opsiyonel)** | Üretim benzeri çalıştırma için **API + Web** ayrı imajlarda paketlenir; **PostgreSQL varsayılan olarak host makinede** kalır (ayrı DB container’ı zorunlu değil). Tanım: `apps/api/Dockerfile`, `apps/web/Dockerfile`, `infra/app/docker-compose.app.yml`. Ortam şablonu: `infra/app/.env.app.example` → `infra/app/.env.app` (commit edilmez). |
| **Compose ortam dosyası** | `docker compose build` sırasında web imajına geçen **`NEXT_PUBLIC_API_URL`** ve **`API_PORT`** değişkenleri, compose’un **proje ortamından** okunur. Bu yüzden `infra/app/.env` → `.env.app` **symlink** veya her çalıştırmada `--env-file infra/app/.env.app` kullanımı önerilir; aksi halde web bundle yanlış API adresine gömülür. |
| **Web → API (DEV)** | `next dev` iken tarayıcı istekleri **`/api/v1`** üzerinden gider; `apps/web/next.config.ts` içindeki rewrite hedefi **`INTERNAL_API_URL`** veya varsayılan `http://localhost:3002`. API’nin gerçek **`PORT`** değeri (`apps/api/.env`) ile bu hedef **aynı olmalı**dır. |
| **Web → API (production build / Docker)** | Rewrite **yok**; tarayıcı doğrudan **`NEXT_PUBLIC_API_URL`** kullanır (`apps/web/src/lib/api.ts`). Bu değer **build zamanında** gömülür; değişince **web imajını yeniden build** etmek gerekir. |
| **CSP ve çapraz origin (Faz 7)** | Production’da Content-Security-Policy **`connect-src`** ile kısıtlıdır. Web `:3000`, API farklı host/port’ta ise (ör. Docker’da `localhost:3002`), **`NEXT_PUBLIC_API_URL`’in origin’i** `connect-src` listesine eklenmelidir — aksi halde tarayıcı API çağrılarını engeller (`ERR_NETWORK`). Uygulama: `apps/web/src/lib/security-headers.ts` (`getApiOrigin()`). |
| **Canlı hedef (Senaryo A)** | Tek site üzerinden path tabanlı API (`/api/v1`); ayrı `api.` alt alanı kullanılmıyor. Ayrıntı: `docs/phase-7-security-hardening.md`. |

---

## 1. Ortam Farkları Özeti

| Konu | DEV | PROD |
|------|-----|------|
| **Web → API adresi** | **DEV (`next dev`):** Axios base URL çoğunlukla **`/api/v1`** (rewrite → `INTERNAL_API_URL` / varsayılan `http://localhost:3002`). **`NEXT_PUBLIC_API_URL`** doğrudan farklı porta işaret ederse çapraz origin + CORS/CSP dikkat. **Production build / Docker:** yalnızca **`NEXT_PUBLIC_API_URL`** (rewrite yok). | **Faz 7 — Senaryo A:** Canlıda tek host + path; `NEXT_PUBLIC_API_URL` örn. `https://uygulama.com/api/v1` (web ile **aynı origin**). Ayrı `api.` alt alanı kullanılmıyor. |
| **API dinleme adresi (HOST)** | DEV: `HOST` yoksa `0.0.0.0` — LAN’dan mobil test için | Container / sunucuda genelde `0.0.0.0` veya platform dokümantasyonu |
| **Mobil → API** | Fiziksel cihaz: `EXPO_PUBLIC_API_URL=http://<LAN-IP>:3001/api/v1`; Android emülatör: `10.0.2.2`; iOS Simülatör: `127.0.0.1` (localhost/IPv6 kaçağı) | `EXPO_PUBLIC_API_URL` canlı API HTTPS base URL |
| **API CORS** | DEV: `CORS_ORIGIN` varsa bu liste; yoksa localhost web + Expo varsayılanları (`apps/api/src/common/cors-origins.ts`). LAN / fiziksel cihaz: `.env` içine ilgili origin’leri ekleyin (örn. `http://192.168.x.x:8081`). | PROD: **Yalnızca** `CORS_ORIGIN` (zorunlu); **wildcard yok**; `credentials: true` ile **tam origin** listesi |
| **Çerez / oturum (Faz 7)** | DEV: `Secure` çerez localhost’ta genelde kapalı; `SameSite` test edilir | PROD: **HTTPS zorunlu**; refresh token **httpOnly**; **Senaryo A** ile **SameSite=Strict** ve path tabanlı çerez uyumu (bkz. `docs/phase-7-security-hardening.md` §2.1); web **access token** çerezde değil, **bellekte** |
| **Next.js rewrites** | `/api/v1/*` ve `/uploads/*` → API (DEV). Hedef: `INTERNAL_API_URL` yoksa `http://localhost:3002` (`apps/web/next.config.ts`). | Devre dışı (production build’de rewrite eklenmez) |
| **Web güvenlik başlıkları (Faz 7 sec7-05)** | Middleware; **CSP yalnızca üretimde** (`NODE_ENV=production`) — `next dev` sıkı CSP ile HMR/WebSocket çakışmasını önlemek için CSP gönderilmez | **HSTS** yalnızca production. `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options` dev’de de vardır. **Tesseract (prod CSP):** `https://cdn.jsdelivr.net` whitelist. **`connect-src`:** `'self'` + CDN + **`NEXT_PUBLIC_API_URL` origin** (Docker’da web/API farklı port). Kaynak: `apps/web/src/middleware.ts` + `apps/web/src/lib/security-headers.ts` |
| **API log seviyesi** | error, warn, log, debug, verbose | error, warn, log |
| **Docker (crm-app)** | API + Web imajları; Postgres varsayılan olarak **host’ta** kalır (`DATABASE_URL` içinde `host.docker.internal`). | Aynı desen veya tamamen uzak DB; `CORS_ORIGIN` / `NEXT_PUBLIC_API_URL` container ortamına göre set edilir. |
| **Faz 8 — İzleme stack** | `docker compose -f infra/monitoring/docker-compose.monitoring.yml` + `infra/monitoring/.env.monitoring` (örnek: `.env.monitoring.example`). API log: `API_JSON_LOG_FILE`. Promtail Loki etiketi `env`: **`MONITORING_ENV`** (varsayılan `development`; API `NODE_ENV` ile hizalayın). Uyarı e-postası: `CRM_ALERT_EMAIL_TO`; SMTP: `GF_SMTP_*` + `GF_SMTP_ENABLED=true`. | Prod: `PROMETHEUS_RETENTION=7d`; Loki için `loki/loki-config.prod.yaml` mount override; gerçek runbook/wiki URL’lerini alert annotation’larında güncelleyin; sırlar repoda yok. |

---

## 1b. Docker — uygulama stack (crm-app)

**Amaç:** `@crm/api` ve `@crm/web` süreçlerini container’da çalıştırmak; **PostgreSQL varsayılan olarak yerel makinenizde** kalır (ayrı bir DB container’ı eklemedik). Veri ve migration geçmişi aynı instance üzerinde kalır; API container `DATABASE_URL` ile host’taki Postgres’e bağlanır.

**Port hizalaması (kritik)**

- API container **içinde** Nest her zaman **`PORT=3001`** ile dinler (`docker-compose.app.yml` → `environment.PORT`).
- Host’a yayımlanan port **`API_PORT`** ile belirlenir: `${API_PORT:-3001}:3001` → ör. `API_PORT=3002` ise tarayıcıdan API **`http://localhost:3002/api/v1`** olur.
- **`NEXT_PUBLIC_API_URL`** web imajı **build** aşamasında gömülür; değer **host’tan erişilen** tam base URL olmalıdır ve **`API_PORT` ile aynı porta** işaret etmelidir (örn. `http://localhost:3002/api/v1`).
- **CSP:** Production web’de `connect-src`, `NEXT_PUBLIC_API_URL`’den türetilen **API origin**’ini içerir; URL değişince web’i **yeniden build** edin.

**Dosyalar**

- [`apps/api/Dockerfile`](apps/api/Dockerfile), [`apps/web/Dockerfile`](apps/web/Dockerfile)
- [`infra/app/docker-compose.app.yml`](infra/app/docker-compose.app.yml)
- Şablon: [`infra/app/.env.app.example`](infra/app/.env.app.example) → kopyalayıp `infra/app/.env.app` yapın (commit etmeyin).

**`.dockerignore`:** Repo kökündeki [`.dockerignore`](../.dockerignore) **`apps/web/.env.local`** ve tüm **`.env*`** dosyalarını imaj bağlamından çıkarır; böylece yerel geliştirme sırları imaja sızamaz. Docker için yalnızca **compose `--env-file` / build-arg** ve `infra/app/.env.app` kullanılır.

**API imajı — bağımlılık kurulumu:** `apps/api/Dockerfile` içinde `npm ci -w @crm/api -w @crm/shared` kullanılır; böylece Next/mobil workspace paketleri `node_modules`’e girmez ve imaj boyutu belirgin şekilde küçülür (tam monorepo `npm ci` ile kıyaslandığında ~GB → ~0,5 GB bandı; ortama göre değişir). `npm prune --omit=dev` aynı workspace filtresiyle çalışır.

**Web imajı — bağımlılık kurulumu:** `apps/web/Dockerfile` içinde `npm ci -w @crm/web -w @crm/shared` ve `npm prune --omit=dev -w @crm/web -w @crm/shared` kullanılır; Nest/Prisma/mobil ağacı imaja girmez.

**Web imajı — runner (`output: 'standalone'`):** `apps/web/next.config.ts` içinde `output: 'standalone'` ve monorepo için `outputFileTracingRoot` tanımlıdır. Runner aşamasında **tam kök `node_modules` kopyalanmaz**; yalnızca `.next/standalone`, `.next/static` ve `public` kopyalanır ve süreç `node apps/web/server.js` ile başlar (bkz. `apps/web/Dockerfile`). Bu düzen tipik olarak web imajını **~0,9 GB bandından daha aşağı** çeker (CPU mimarisine göre değişir).

**Sürüm pinleme (Fortify — Docker Misconfiguration):** API/Web Dockerfile’larında taban imaj **`node:20.20.2-bookworm-slim@sha256:f93745c153377ee2fbbdd6e24efcd03cd2e86d6ab1d8aa9916a3790c40313a55`** (çok mimarili **index** digest — `linux/arm64` ve `linux/amd64` için uygun katman seçilir; yalnız amd64 üretim imajı için build’de **`--platform linux/amd64`** kullanın). `apt` ile kurulan **`openssl`** / **`ca-certificates`** paketleri **tam sürüm** ile sabitlenmiştir. Taban imaj veya Debian repo’su değiştiğinde: `docker buildx imagetools inspect <tag>` çıktısındaki **üst** `Digest:` (index) satırını kullanın; tek platform manifest digest’i (`Manifests` altındaki) ARM Mac’te “platform does not match” hatasına yol açar. Aynı imajda `apt-cache policy openssl ca-certificates` ile apt pin’lerini güncelleyin. İzleme stack’inde Grafana Postgres: **`postgres:16.13-alpine3.23@sha256:20edbde7749f822887a1a022ad526fde0a47d6b2be9a8364433605cf65099416`** (index digest). Dockerfile sözdizimi: `# syntax=docker/dockerfile:1.12`.

**Non-root süreç (Fortify / güvenlik):** API ve Web runner aşamalarında süreç **`USER node`** (resmi Node bookworm-slim imajında uid **1000**) ile çalışır; `apps/api/Dockerfile` içinde `uploads/` ve `exports/` önceden oluşturulur ve `/app` ağacı `node` kullanıcısına devredilir. **`infra/app/docker-compose.app.yml`** içindeki **`api_uploads`** adlı volume ilk oluşturulduğunda dizin sahibi root olabilir; kart yükleme vb. **EACCES** alırsanız bir kez (veya volume yenilendiğinde) host’tan şunu çalıştırın:  
`docker compose -f infra/app/docker-compose.app.yml --env-file infra/app/.env.app exec -u root api chown -R 1000:1000 /app/apps/api/uploads`  
Kalıcı çözüm olarak aynı uid ile bind mount da kullanılabilir (host dizinini `chown 1000:1000`).

**API `X-Request-Id` (yanıt vs access log):** Yanıt başlığı `X-Request-Id` **yalnızca sunucu üretimi** (`crypto.randomUUID`) ile set edilir; istemci gönderdiği değer **yanıtta echo edilmez** (HTTP header manipulation / SCA uyumu). İstemci allowlist’e uyan bir `X-Request-Id` gönderdiyse, JSON access log satırında isteğe bağlı **`inboundRequestId`** alanında görünür; **`requestId`** alanı her zaman sunucu UUID ile ana korelasyon anahtarıdır. Uygulama: `apps/api/src/common/middleware/resolve-request-id.ts`, `json-request-logger.middleware.ts`.

---

## 1c. Docker imaj boyutu — zorunlu kurallar ve doğrulama

Bu kurallar regresyonu önler; ayrıntılı gerekçe: `.cursor/rules/docker-images.mdc`.

**Zorunlu (Dockerfile)**

| İmaj | `npm ci` | `npm prune` | Runner |
|------|----------|-------------|--------|
| **API** | `npm ci -w @crm/api -w @crm/shared` — **tam monorepo `npm ci` kullanılmaz** | `npm prune --omit=dev -w @crm/api -w @crm/shared` | Tam `node_modules` + `dist` + Prisma şeması (Nest standalone bundle değil); ağır bağımlılıklar ürün kararıyla sınırlı. |
| **Web** | `npm ci -w @crm/web -w @crm/shared` | `npm prune --omit=dev -w @crm/web -w @crm/shared` | **Yalnızca** Next `standalone` çıktısı + `static` + `public` — runner’a gereksiz workspace veya tam monorepo `node_modules` eklenmez. |

**Referans boyutlar (rehber; ortam mimarisine göre değişir)**

- API (workspace filtresi + çift Prisma `binaryTargets` sonrası): tipik **~0,5–0,55 GB** (`docker images` sütunu; ikinci engine birkaç on MB ekler).
- Web (standalone runner sonrası): tipik **~0,3–0,4 GB** (`docker images`; runner içi `/app` ~80MB bandı).

**Doğrulama komutları**

```bash
docker images --format "{{.Repository}}:{{.Tag}}\t{{.Size}}" | grep crm-app
# İçerik (API örneği):
docker run --rm --entrypoint sh crm-app-api:latest -c "du -sh /app /app/node_modules 2>/dev/null | head -5"
# Web (standalone): /app/apps/web ve kök yapı — build sonrası:
docker run --rm --entrypoint sh crm-app-web:latest -c "du -sh /app 2>/dev/null; ls -la /app/apps/web 2>/dev/null | head"
```

**Sık hata (Web standalone):** Sayfa 500 veya statik dosya 404 → `.next/static` veya `public` yanlış göreli yola kopyalanmıştır; `outputFileTracingRoot` monorepo köküne (`apps/web`’den iki seviye yukarı) işaret etmelidir.

**İleri seviye (onaylı değişiklik):** Alpine / distroless taban imaj, CI’da sabit boyut eşiği — `docs/deployment-and-env-strategy.md` §4 güncelleme tetikleyicileri.

**Gelecek mimari — P2 / epic (ürün onayı):** Sunucu tarafında OCR için `tesseract.js` (~40MB+ `tesseract.js-core`) API imajını şişirir. Olası yönler: (1) OCR yalnız istemci (mevcut web Tesseract + CDN), (2) ayrı OCR mikroservisi / kuyruk worker’ı, (3) API’de lazy yükleme ile sınırlı kazanım. Uygulamaya başlamadan önce KVKK/performans gereksinimleri ve `apps/api/src/modules/upload/upload.service.ts` akışı gözden geçirilir; bu repoda **karar alınana kadar kod kaldırılmaz**.

**Prisma `binaryTargets` (API):** [`apps/api/prisma/schema.prisma`](apps/api/prisma/schema.prisma) içinde `native` (yerel `npx prisma generate`) ve `debian-openssl-3.0.x` (Debian bookworm tabanlı Docker imajı) tanımlıdır. Şema değişince yerelde `npx prisma generate` çalıştırın. **Alpine / farklı OpenSSL** kullanıyorsanız hedefi [Prisma dokümantasyonuna](https://www.prisma.io/docs/orm/reference/prisma-schema-reference#binarytargets-options) göre güncelleyin.

**NestJS webpack bundle:** Şu an **kullanılmıyor**. Webpack modu `ts-loader` (ve bakım) gerektirir; Prisma/Tesseract gibi paketler için `externals` ayrıca ayarlanmalıdır. İmaj boyutunda asıl kazanç **workspace-filtreli `npm ci`** ve **Prisma `binaryTargets`** ile sağlanır. Tek dosya bundle ihtiyacı doğarsa ayrı feature branch’te değerlendirilir.

---

**Çalıştırma (repo kökünden)**

```bash
cp infra/app/.env.app.example infra/app/.env.app
# .env.app: DATABASE_URL (host.docker.internal), JWT_*, CORS_ORIGIN, NODE_ENV=production,
#           API_PORT ve NEXT_PUBLIC_API_URL aynı host portuna hizalı olsun
cd infra/app && ln -sf .env.app .env
cd ../..
docker compose -f infra/app/docker-compose.app.yml up -d --build
```

`infra/app/.env` (veya her seferinde `--env-file infra/app/.env.app`) **zorunludur**: aksi halde `docker compose build` içindeki `NEXT_PUBLIC_API_URL` / `API_PORT` birleştirmesi görülmez; web bundle yanlış porta gider veya CSP `connect-src` API origin’ini içermez; girişte ağ hatası oluşur.

- Web: `http://localhost:${WEB_PORT:-3000}`  
- API (host tarafı): `http://localhost:${API_PORT:-3001}/api/v1`  
- `NEXT_PUBLIC_API_URL` (web build arg): tarayıcının göreceği API base URL; **`http://localhost:<API_PORT>/api/v1`** ile birebir uyumlu olmalıdır.

**Çoklu `.env` dosyaları — kısa özet**

| Dosya | Rol |
|--------|-----|
| `apps/api/.env` | Yerel **`npm run dev`** ile API; `PORT`, `DATABASE_URL` (`localhost` Postgres), JWT, CORS vb. |
| `apps/web/.env.local` | Yerel **`npm run dev`** ile Web; özellikle `NEXT_PUBLIC_API_URL` API’nin gerçek portu ile uyumlu olmalı (rewrite kullanılmıyorsa veya doğrudan API’ye gidiliyorsa). |
| `infra/app/.env.app` | **Sadece Docker** compose + container runtime; `DATABASE_URL` içinde **`host.docker.internal`** (host Postgres). |
| `infra/app/.env` | Compose’un `${VAR}` interpolasyonu için; pratikte **`.env.app`’a symlink**. |

Bunlar **farklı amaçlar** içindir; biri diğerinin yerine geçmez. Hiçbiri repoya commit edilmez (`.gitignore`).

**Ortam notları**

- **Host Postgres (Docker Desktop Mac/Win):** `DATABASE_URL` içinde host `host.docker.internal` kullanın. Compose’ta `extra_hosts: host.docker.internal:host-gateway` tanımlıdır (Linux uyumu).  
- **Migration:** İmaj içinde `prisma` CLI yok (`npm prune` sonrası). Şemayı güncelledikten sonra migration’ı **host’tan** aynı `DATABASE_URL` ile çalıştırın: `cd apps/api && npx prisma migrate deploy`.  
- **Uploads:** `api_uploads` volume — kart görselleri container yeniden oluşturulunca kalır.  
- **Monitoring:** `crm-monitoring` ayrı compose’tur; API/Web portları host’a publish edildiği sürece mevcut Blackbox hedefleri (`host.docker.internal:3000`, API portu) çalışmaya devam edebilir.

**Ağ (Docker build):** `npm ci` sırasında `ECONNRESET` gibi hatalar olursa Dockerfile’larda npm yeniden deneme + BuildKit cache mount kullanılır (`/home/node/.npm`, `uid=1000,gid=1000` — builder `USER node` ile uyumlu); tekrar `docker compose ... build` deneyin. Mümkünse stabil ağ / VPN kapatılmış bağlantı.

**API container hemen çıkıyorsa / DB hatası:** Log’da `Can't reach database server at localhost:5432` görürseniz, `infra/app/.env.app` içindeki `DATABASE_URL` hâlâ `localhost` kullanıyordur. Container içinde `localhost` = container kendisi. Host’taki Postgres için `host.docker.internal` kullanın (`infra/app/.env.app.example` uyarısı).

**Kod inceleme / merge:** Bu iş feature branch üzerinde yapılır; `main`’e merge yalnızca siz Docker + uçtan uca akışı test edip onayladıktan sonra yapılmalıdır.

---

## 2. Canlıya Geçiş Öncesi Kontrol Listesi

### Backend (API)

- [ ] **CORS_ORIGIN** ortam değişkeni set edildi (canlı **web origin**(leri); virgülle ayrılmış birden fazla olabilir).  
  **Senaryo A (kesin):** Tek site — örnek: `CORS_ORIGIN=https://uygulama.com` (`www` kullanılıyorsa ikinci satır olarak eklenir).
- [ ] **DATABASE_URL** production veritabanına işaret ediyor.
- [ ] **JWT_ACCESS_SECRET**, **JWT_REFRESH_SECRET** güçlü ve production’a özel değerler.
- [ ] **PORT** (veya host) production ortamına uygun.
- [ ] **ANTHROPIC_API_KEY** (AI analiz — Claude) — console.anthropic.com'dan alınır; Claude seçildiğinde zorunlu.
- [ ] **OLLAMA_BASE_URL**, **OLLAMA_MODEL** (AI analiz — Ollama) — opsiyonel; varsayılan model `qwen2.5-coder:7b`; Ollama seçildiğinde local'de `ollama serve` çalışıyor olmalı.
- [ ] **GEMINI_API_KEY** (AI analiz — Gemini) — aistudio.google.com'dan alınır; Gemini seçildiğinde zorunlu.
- [ ] **TWILIO_ACCOUNT_SID**, **TWILIO_AUTH_TOKEN**, **TWILIO_VERIFY_SERVICE_SID** (MFA SMS) — Twilio Console'dan alınır. Boş bırakılırsa DEV'de OTP terminale basılır; PROD'da gerçek SMS için zorunlu.
- [ ] **MFA ve rate limit / hesap kilidi** — Yönetim › Sistem Ayarları: MFA_SMS_ENABLED, RATE_LIMIT_*, ACCOUNT_LOCKOUT_* (eşik ve süre; prod’da isteğe bağlı env override: `ACCOUNT_LOCKOUT_THRESHOLD`, `ACCOUNT_LOCKOUT_MINUTES`).

**AI Chat — Local model (Ollama) kullanıldığında:**
- Token maliyeti yok; tam veri kapsamı (full) kullanılabilir.
- Veri dışarı çıkmaz → KVKK endişesi yok.

### Frontend (Web)

- [ ] **NEXT_PUBLIC_API_URL** build öncesi set edildi (canlı API base URL — **path tabanlı**, web ile aynı host).  
  Örnek (Senaryo A): `NEXT_PUBLIC_API_URL=https://uygulama.com/api/v1`  
  Not: Bu değişken build zamanında gömülür; build’den sonra değiştirirsen yeni build gerekir.

### Mobile (Expo — Phase 4)

- [ ] **EXPO_PUBLIC_API_URL** app.json veya .env ile set edildi. DEV: `http://<bilgisayar-ip>:3001/api/v1`; PROD: canlı API base URL.
- [ ] CORS: Native app HTTP isteklerinde origin göndermez. Expo dev web için `http://localhost:8081` CORS_ORIGIN'e eklenebilir.

### Altyapı

- [ ] **Faz 7 — BFF yok:** Güvenlik, **API sertleştirmesi** + **httpOnly refresh** + **sıkı CORS/CSP** ile sağlanır; detaylar `docs/phase-7-security-hardening.md`.
- [ ] **Senaryo A (kesin):** Tek host — `https://<site>/` web, `https://<site>/api/v1` API; reverse proxy routing doğrulandı; çerez `SameSite`, `Secure` ve `CORS_ORIGIN` birlikte test edildi.
- [ ] **Mobil SSL pinning:** Üretim sertifikası yenileme sonrası **14 gün** içinde yeni pin’i içeren mağaza sürümü hedefi — operasyonel süreç `docs/phase-7-security-hardening.md` §12; admin panelden parametrik yapılandırma yok.
- [ ] HTTPS kullanılıyor; gerekirse reverse proxy (nginx, vb.) ayarları yapıldı.

**Opsiyonel env (Faz 7 uygulamasına göre):**

- `COOKIE_DOMAIN` — **Senaryo A**’da genelde **boş** veya tek host ile uyumlu; alt alan çerezi gerekmez. Gerekirse API kodu varsayılanını kullanır.
- `COOKIE_SECURE` — `true` zorunlu prod’da (HTTPS).
- `COOKIE_SAMESITE` — **Senaryo A** ile genelde **`strict`** hedeflenir (tek origin).
- **Hesap kilidi (sec7-06):** `ACCOUNT_LOCKOUT_THRESHOLD` (varsayılan **5**), `ACCOUNT_LOCKOUT_MINUTES` (varsayılan **15**) — kesin değerler `docs/phase-7-security-hardening.md` §8 ve §13.

**Faz 7 senkronizasyon:** Branch sırası, `CORS_ORIGIN` / çerez testleri, rate limit ve kilitleme taslağı için tek kaynak **`docs/phase-7-security-hardening.md`**.

---

## 3. Kod Tarafında Referanslar

- **API base URL (web):** `apps/web/src/lib/api.ts` — DEV’de tarayıcı `/api/v1` (Next rewrite); **production’da tarayıcı `NEXT_PUBLIC_API_URL`** (rewrite yok; aksi halde istekler Next’e gider ve 404 HTML döner).
- **CORS:** `apps/api/src/main.ts` + `apps/api/src/common/cors-origins.ts` — production’da `CORS_ORIGIN` zorunlu; development’ta whitelist veya varsayılanlar. `cookie-parser` kaydı aynı dosyada (httpOnly refresh hazırlığı). Faz 7: `docs/phase-7-security-hardening.md`.
- **Auth httpOnly refresh (sec7-02):** `apps/api/src/modules/auth/auth-cookie.helper.ts`, `auth.controller.ts` — web’de refresh `crm_refresh` httpOnly çerez; yanıtta yalnızca `accessToken`. Mobil `POST /auth/login` ve `verify-mfa` gövdesinde `client: "mobile"` (sabit `AUTH_CLIENT_MOBILE` @ `@crm/shared`) ile refresh hem body’de kalır (Secure Store) hem çerez set edilmez.
- **Rate limit (Sistem Ayarları) + hesap kilidi (sec7-06):** `apps/api/src/modules/auth/auth-throttle.factory.ts` (`@Throttle` limit/ttl → `RATE_LIMIT_*`); `auth.service.ts` (`failedLoginCount`, `lockedUntil`, env/ayar: `ACCOUNT_LOCKOUT_*`). Global `ThrottlerModule` + `ThrottlerGuard` `app.module.ts`.
- **Rewrites:** `apps/web/next.config.ts` — `NODE_ENV === 'production'` iken rewrite eklenmez; DEV hedefi `INTERNAL_API_URL` veya varsayılan `http://localhost:3002`.
- **Docker uygulama:** `apps/api/Dockerfile`, `apps/web/Dockerfile`, `infra/app/docker-compose.app.yml`, `infra/app/.env.app.example` — bkz. §1b ve **§1c** (imaj boyutu). Web: Next `standalone` + `outputFileTracingRoot` (`apps/web/next.config.ts`). **Sürüm pinleme (Fortify):** taban imaj + apt + monitoring Grafana Postgres imajı — §1b “Sürüm pinleme” paragrafı.
- **Prisma engine hedefleri:** `apps/api/prisma/schema.prisma` `generator` → `binaryTargets` — bkz. §1c.
- **Web CSP / güvenlik başlıkları (sec7-05):** `apps/web/src/middleware.ts` + `apps/web/src/lib/security-headers.ts` — **CSP + HSTS yalnızca production**; geliştirmede CSP yok (Turbopack/HMR uyumu). Diğer başlıklar (nosniff, frame, referrer, permissions) dev’de de gelir. Tesseract CDN yalnızca prod CSP’de whitelist. **`connect-src`:** `getApiOrigin()` ile `NEXT_PUBLIC_API_URL`’in origin’i eklenir (Docker’da web/API farklı port).
- **MFA SMS:** `apps/api/src/modules/sms/sms.service.ts` — Twilio Verify API; credentials yoksa OTP terminale basar.
- **API base URL (mobile):** `apps/mobile/lib/api.ts` — `getApiBaseUrl()` / `EXPO_PUBLIC_API_URL`; Android emülatör `10.0.2.2`, fiziksel cihaz LAN IP.
- **API HOST:** `apps/api/src/main.ts` — `HOST` (varsayılan `0.0.0.0`) ile LAN erişimi.
- **Expo fiziksel cihaz:** `apps/mobile` — `npm run start:lan` (Metro LAN); `EXPO_PUBLIC_API_URL` Mac’in telefonun görebildiği IP’si + `/api/v1` (aynı Wi‑Fi veya hotspot). `docs/environment-setup.md`.
- **Faz 8 monitoring:** `infra/monitoring/docker-compose.monitoring.yml`, `infra/monitoring/.env.monitoring.example` — Prometheus / Loki / Grafana / Blackbox / Promtail / postgres_exporter. API: `GET /api/v1/health` (liveness), `GET /api/v1/health/ready` (readiness, DB). JSON log: `apps/api/src/common/middleware/json-request-logger.middleware.ts`, `apps/api/src/common/logging/`, `apps/api/src/main.ts` (`API_JSON_LOG_FILE`). Promtail `env` etiketi: **`MONITORING_ENV`**. Docker API imajı: **`GIT_COMMIT` / `GIT_BRANCH`** build-arg → `ENV` (`apps/api/Dockerfile`, `infra/app/docker-compose.app.yml`). Paylaşılan olay sabitleri: `packages/shared/src/constants/structured-logging.ts`.
- **Faz 8 alerting (Grafana provisioning):** `infra/monitoring/grafana/provisioning/alerting/` — `01-contact-points.yaml` (e-posta + şablonlar), `02-notification-policies.yaml`, `03-alert-rules.yaml` (Blackbox kuralları). Runbook: `docs/runbooks/crm-api-down.md`. Prod Loki örnek: `infra/monitoring/loki/loki-config.prod.yaml`.

---

## 4. Bu Doküman Ne Zaman Güncellenmeli?

- Yeni bir **ortam değişkeni** (env) eklendiğinde veya mevcut bir env’in DEV/PROD’da farklı kullanımı tanımlandığında.
- **CORS**, **proxy**, **log seviyesi**, **feature flag** gibi ortama göre değişen davranış eklendiğinde.
- **Çerez / oturum / CSP** (Faz 7) değiştiğinde; **Docker / compose** port veya build-arg davranışı değiştiğinde.
- **Docker imaj boyutu standartları** (§1c) veya `.cursor/rules/docker-images.mdc` ile çelişen Dockerfile / `next.config` / Prisma `binaryTargets` değişikliği yapıldığında.
- Canlıya geçiş sürecinde yeni bir adım veya risk fark edildiğinde.

Bu sayede tek bir yerden DEV/PROD farkları ve go-live adımları takip edilmiş olur.

---

## 5. Güvenlik sertleştirmesi (Faz 7) — Özet

Tam checklist, branch planı (`feature/sec7-*`), kod dokunuş haritası, mevcut Throttler/rate limit durumu, hesap kilidi taslağı ve BFF olmadan güvenlik gerekçesi: **`docs/phase-7-security-hardening.md`**.

- **BFF kullanılmıyor** | **Üretim: Senaryo A (tek host + `/api/v1`)** | **httpOnly refresh** | **Web access bellekte** | **Sıkı CSP** | **Rate limit + hesap kilidi (5/15 dk; admin kilidi kaldırma yok, limitler Sistem Ayarları)** | **Mobil: pinning (14 gün mağaza SLA) + jailbreak’te uygulama kapatma + telefon maskesi / biyometrik**
