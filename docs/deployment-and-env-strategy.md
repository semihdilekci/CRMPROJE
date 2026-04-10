# Canlıya Geçiş Stratejisi ve Ortam Farkları

Bu doküman, **development (DEV)** ile **production (PROD)** ortamları arasındaki farkları ve canlıya geçerken yapılması gerekenleri özetler. Yeni ortam-bağımlı özellik eklendiğinde bu dosya güncellenmelidir.

---

## 1. Ortam Farkları Özeti

| Konu | DEV | PROD |
|------|-----|------|
| **Web → API adresi** | `NEXT_PUBLIC_API_URL` yoksa `http://localhost:3001/api/v1` kullanılır | **Faz 7 kararı — Senaryo A:** Tek host + path. `NEXT_PUBLIC_API_URL` canlıda API base URL (örn. `https://uygulama.com/api/v1` — web ile **aynı origin**). Ayrı `api.` alt alanı kullanılmıyor. |
| **API dinleme adresi (HOST)** | DEV: `HOST` yoksa `0.0.0.0` — LAN’dan mobil test için | Container / sunucuda genelde `0.0.0.0` veya platform dokümantasyonu |
| **Mobil → API** | Fiziksel cihaz: `EXPO_PUBLIC_API_URL=http://<LAN-IP>:3001/api/v1`; Android emülatör: `10.0.2.2`; iOS Simülatör: `127.0.0.1` (localhost/IPv6 kaçağı) | `EXPO_PUBLIC_API_URL` canlı API HTTPS base URL |
| **API CORS** | DEV: `CORS_ORIGIN` varsa bu liste; yoksa localhost web + Expo varsayılanları (`apps/api/src/common/cors-origins.ts`). LAN / fiziksel cihaz: `.env` içine ilgili origin’leri ekleyin (örn. `http://192.168.x.x:8081`). | PROD: **Yalnızca** `CORS_ORIGIN` (zorunlu); **wildcard yok**; `credentials: true` ile **tam origin** listesi |
| **Çerez / oturum (Faz 7)** | DEV: `Secure` çerez localhost’ta genelde kapalı; `SameSite` test edilir | PROD: **HTTPS zorunlu**; refresh token **httpOnly**; **Senaryo A** ile **SameSite=Strict** ve path tabanlı çerez uyumu (bkz. `docs/phase-7-security-hardening.md` §2.1); web **access token** çerezde değil, **bellekte** |
| **Next.js rewrites** | `/api/v1/*` ve `/uploads/*` → API (DEV). Hedef: `INTERNAL_API_URL` yoksa `http://localhost:3002` (`apps/web/next.config.ts`). | Devre dışı (production build’de rewrite eklenmez) |
| **Web güvenlik başlıkları (Faz 7 sec7-05)** | Middleware; **CSP yalnızca üretimde** (`NODE_ENV=production`) — `next dev` sıkı CSP ile HMR/WebSocket çakışmasını önlemek için CSP gönderilmez | **HSTS** yalnızca production. `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options` dev’de de vardır. **Tesseract (prod CSP):** `https://cdn.jsdelivr.net` whitelist. Kaynak: `apps/web/src/middleware.ts` + `apps/web/src/lib/security-headers.ts` |
| **API log seviyesi** | error, warn, log, debug, verbose | error, warn, log |
| **Docker (crm-app)** | API + Web imajları; Postgres varsayılan olarak **host’ta** kalır (`DATABASE_URL` içinde `host.docker.internal`). | Aynı desen veya tamamen uzak DB; `CORS_ORIGIN` / `NEXT_PUBLIC_API_URL` container ortamına göre set edilir. |
| **Faz 8 — İzleme stack** | `docker compose -f infra/monitoring/docker-compose.monitoring.yml` + `infra/monitoring/.env.monitoring` (örnek: `.env.monitoring.example`). API log: `API_JSON_LOG_FILE`. Uyarı e-postası alıcısı: `CRM_ALERT_EMAIL_TO`; SMTP: `GF_SMTP_*` + `GF_SMTP_ENABLED=true`. | Prod: `PROMETHEUS_RETENTION=7d`; Loki için `loki/loki-config.prod.yaml` mount override; gerçek runbook/wiki URL’lerini alert annotation’larında güncelleyin; sırlar repoda yok. |

---

## 1b. Docker — uygulama stack (crm-app)

**Amaç:** `@crm/api` ve `@crm/web` süreçlerini container’da çalıştırmak; **PostgreSQL varsayılan olarak yerel makinenizde** kalır (ayrı bir DB container’ı eklemedik). Veri ve migration geçmişi aynı instance üzerinde kalır; API container `DATABASE_URL` ile host’taki Postgres’e bağlanır.

**Dosyalar**

- [`apps/api/Dockerfile`](apps/api/Dockerfile), [`apps/web/Dockerfile`](apps/web/Dockerfile)
- [`infra/app/docker-compose.app.yml`](infra/app/docker-compose.app.yml)
- Şablon: [`infra/app/.env.app.example`](infra/app/.env.app.example) → kopyalayıp `infra/app/.env.app` yapın (commit etmeyin).

**Çalıştırma (repo kökünden)**

```bash
cp infra/app/.env.app.example infra/app/.env.app
# .env.app: DATABASE_URL, JWT_*, CORS_ORIGIN, NODE_ENV=production vb. doldurun
docker compose -f infra/app/docker-compose.app.yml --env-file infra/app/.env.app up -d --build
```

- Web: `http://localhost:${WEB_PORT:-3000}`  
- API: `http://localhost:${API_PORT:-3001}/api/v1`  
- `NEXT_PUBLIC_API_URL` (web build arg): tarayıcının göreceği API base URL; yerel denemede genelde `http://localhost:3001/api/v1`.

**Ortam notları**

- **Host Postgres (Docker Desktop Mac/Win):** `DATABASE_URL` içinde host `host.docker.internal` kullanın. Compose’ta `extra_hosts: host.docker.internal:host-gateway` tanımlıdır (Linux uyumu).  
- **Migration:** İmaj içinde `prisma` CLI yok (`npm prune` sonrası). Şemayı güncelledikten sonra migration’ı **host’tan** aynı `DATABASE_URL` ile çalıştırın: `cd apps/api && npx prisma migrate deploy`.  
- **Uploads:** `api_uploads` volume — kart görselleri container yeniden oluşturulunca kalır.  
- **Monitoring:** `crm-monitoring` ayrı compose’tur; API/Web portları host’a publish edildiği sürece mevcut Blackbox hedefleri (`host.docker.internal:3000`, API portu) çalışmaya devam edebilir.

**Ağ (Docker build):** `npm ci` sırasında `ECONNRESET` gibi hatalar olursa Dockerfile’larda npm yeniden deneme + BuildKit `/root/.npm` cache mount kullanılır; tekrar `docker compose ... build` deneyin. Mümkünse stabil ağ / VPN kapatılmış bağlantı.

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

- **API base URL (web):** `apps/web/src/lib/api.ts` — `BACKEND_URL` sadece fallback (DEV); prod’da `NEXT_PUBLIC_API_URL` kullanılmalı.
- **CORS:** `apps/api/src/main.ts` + `apps/api/src/common/cors-origins.ts` — production’da `CORS_ORIGIN` zorunlu; development’ta whitelist veya varsayılanlar. `cookie-parser` kaydı aynı dosyada (httpOnly refresh hazırlığı). Faz 7: `docs/phase-7-security-hardening.md`.
- **Auth httpOnly refresh (sec7-02):** `apps/api/src/modules/auth/auth-cookie.helper.ts`, `auth.controller.ts` — web’de refresh `crm_refresh` httpOnly çerez; yanıtta yalnızca `accessToken`. Mobil `POST /auth/login` ve `verify-mfa` gövdesinde `client: "mobile"` (sabit `AUTH_CLIENT_MOBILE` @ `@crm/shared`) ile refresh hem body’de kalır (Secure Store) hem çerez set edilmez.
- **Rate limit (Sistem Ayarları) + hesap kilidi (sec7-06):** `apps/api/src/modules/auth/auth-throttle.factory.ts` (`@Throttle` limit/ttl → `RATE_LIMIT_*`); `auth.service.ts` (`failedLoginCount`, `lockedUntil`, env/ayar: `ACCOUNT_LOCKOUT_*`). Global `ThrottlerModule` + `ThrottlerGuard` `app.module.ts`.
- **Rewrites:** `apps/web/next.config.ts` — `NODE_ENV === 'production'` iken rewrite eklenmez; DEV hedefi `INTERNAL_API_URL` veya varsayılan `http://localhost:3002`.
- **Docker uygulama:** `apps/api/Dockerfile`, `apps/web/Dockerfile`, `infra/app/docker-compose.app.yml`, `infra/app/.env.app.example` — bkz. §1b.
- **Web CSP / güvenlik başlıkları (sec7-05):** `apps/web/src/middleware.ts` + `apps/web/src/lib/security-headers.ts` — **CSP + HSTS yalnızca production**; geliştirmede CSP yok (Turbopack/HMR uyumu). Diğer başlıklar (nosniff, frame, referrer, permissions) dev’de de gelir. Tesseract CDN yalnızca prod CSP’de whitelist.
- **MFA SMS:** `apps/api/src/modules/sms/sms.service.ts` — Twilio Verify API; credentials yoksa OTP terminale basar.
- **API base URL (mobile):** `apps/mobile/lib/api.ts` — `getApiBaseUrl()` / `EXPO_PUBLIC_API_URL`; Android emülatör `10.0.2.2`, fiziksel cihaz LAN IP.
- **API HOST:** `apps/api/src/main.ts` — `HOST` (varsayılan `0.0.0.0`) ile LAN erişimi.
- **Expo fiziksel cihaz:** `apps/mobile` — `npm run start:lan` (Metro LAN); `EXPO_PUBLIC_API_URL` Mac’in telefonun görebildiği IP’si + `/api/v1` (aynı Wi‑Fi veya hotspot). `docs/environment-setup.md`.
- **Faz 8 monitoring:** `infra/monitoring/docker-compose.monitoring.yml`, `infra/monitoring/.env.monitoring.example` — Prometheus / Loki / Grafana / Blackbox / Promtail / postgres_exporter. API: `GET /api/v1/health` (liveness), `GET /api/v1/health/ready` (readiness, DB). JSON access log: `apps/api/src/common/middleware/json-request-logger.middleware.ts`, `apps/api/src/main.ts` (`API_JSON_LOG_FILE`).
- **Faz 8 alerting (Grafana provisioning):** `infra/monitoring/grafana/provisioning/alerting/` — `01-contact-points.yaml` (e-posta + şablonlar), `02-notification-policies.yaml`, `03-alert-rules.yaml` (Blackbox kuralları). Runbook: `docs/runbooks/crm-api-down.md`. Prod Loki örnek: `infra/monitoring/loki/loki-config.prod.yaml`.

---

## 4. Bu Doküman Ne Zaman Güncellenmeli?

- Yeni bir **ortam değişkeni** (env) eklendiğinde veya mevcut bir env’in DEV/PROD’da farklı kullanımı tanımlandığında.
- **CORS**, **proxy**, **log seviyesi**, **feature flag** gibi ortama göre değişen davranış eklendiğinde.
- **Çerez / oturum / CSP** (Faz 7) değiştiğinde.
- Canlıya geçiş sürecinde yeni bir adım veya risk fark edildiğinde.

Bu sayede tek bir yerden DEV/PROD farkları ve go-live adımları takip edilmiş olur.

---

## 5. Güvenlik sertleştirmesi (Faz 7) — Özet

Tam checklist, branch planı (`feature/sec7-*`), kod dokunuş haritası, mevcut Throttler/rate limit durumu, hesap kilidi taslağı ve BFF olmadan güvenlik gerekçesi: **`docs/phase-7-security-hardening.md`**.

- **BFF kullanılmıyor** | **Üretim: Senaryo A (tek host + `/api/v1`)** | **httpOnly refresh** | **Web access bellekte** | **Sıkı CSP** | **Rate limit + hesap kilidi (5/15 dk; admin kilidi kaldırma yok, limitler Sistem Ayarları)** | **Mobil: pinning (14 gün mağaza SLA) + jailbreak’te uygulama kapatma + telefon maskesi / biyometrik**
