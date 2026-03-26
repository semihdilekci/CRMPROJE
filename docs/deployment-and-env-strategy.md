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
| **Next.js rewrites** | `/api/v1/*` ve `/uploads/*` → API (opsiyonel proxy) | Devre dışı (production build’de rewrite eklenmez) |
| **Web güvenlik başlıkları (Faz 7 sec7-05)** | Middleware; **CSP yalnızca üretimde** (`NODE_ENV=production`) — `next dev` sıkı CSP ile HMR/WebSocket çakışmasını önlemek için CSP gönderilmez | **HSTS** yalnızca production. `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options` dev’de de vardır. **Tesseract (prod CSP):** `https://cdn.jsdelivr.net` whitelist. Kaynak: `apps/web/src/middleware.ts` + `apps/web/src/lib/security-headers.ts` |
| **API log seviyesi** | error, warn, log, debug, verbose | error, warn, log |

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
- **Rewrites:** `apps/web/next.config.ts` — `NODE_ENV === 'production'` iken rewrite eklenmez.
- **Web CSP / güvenlik başlıkları (sec7-05):** `apps/web/src/middleware.ts` + `apps/web/src/lib/security-headers.ts` — **CSP + HSTS yalnızca production**; geliştirmede CSP yok (Turbopack/HMR uyumu). Diğer başlıklar (nosniff, frame, referrer, permissions) dev’de de gelir. Tesseract CDN yalnızca prod CSP’de whitelist.
- **MFA SMS:** `apps/api/src/modules/sms/sms.service.ts` — Twilio Verify API; credentials yoksa OTP terminale basar.
- **API base URL (mobile):** `apps/mobile/lib/api.ts` — `getApiBaseUrl()` / `EXPO_PUBLIC_API_URL`; Android emülatör `10.0.2.2`, fiziksel cihaz LAN IP.
- **API HOST:** `apps/api/src/main.ts` — `HOST` (varsayılan `0.0.0.0`) ile LAN erişimi.
- **Expo fiziksel cihaz:** `apps/mobile` — `npm run start:lan` (Metro LAN); `EXPO_PUBLIC_API_URL` Mac’in telefonun görebildiği IP’si + `/api/v1` (aynı Wi‑Fi veya hotspot). `docs/environment-setup.md`.

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
