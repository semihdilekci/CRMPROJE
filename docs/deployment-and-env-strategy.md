# Canlıya Geçiş Stratejisi ve Ortam Farkları

Bu doküman, **development (DEV)** ile **production (PROD)** ortamları arasındaki farkları ve canlıya geçerken yapılması gerekenleri özetler. Yeni ortam-bağımlı özellik eklendiğinde bu dosya güncellenmelidir.

---

## 1. Ortam Farkları Özeti

| Konu | DEV | PROD |
|------|-----|------|
| **Web → API adresi** | `NEXT_PUBLIC_API_URL` yoksa `http://localhost:3001/api/v1` kullanılır | **Zorunlu:** `NEXT_PUBLIC_API_URL` canlı API base URL olarak set edilmeli (örn. `https://api.uygulama.com/api/v1`) |
| **API dinleme adresi (HOST)** | DEV: `HOST` yoksa `0.0.0.0` — LAN’dan mobil test için | Container / sunucuda genelde `0.0.0.0` veya platform dokümantasyonu |
| **Mobil → API** | Fiziksel cihaz: `EXPO_PUBLIC_API_URL=http://<LAN-IP>:3001/api/v1`; Android emülatör: `10.0.2.2`; iOS Simülatör: `127.0.0.1` (localhost/IPv6 kaçağı) | `EXPO_PUBLIC_API_URL` canlı API HTTPS base URL |
| **API CORS** | DEV: `origin: true` (Expo Metro `127.0.0.1` / LAN IP / farklı portlar — mobil preflight) | PROD: Sadece `CORS_ORIGIN` ile belirtilen origin(ler) |
| **Next.js rewrites** | `/api/v1/*` ve `/uploads/*` → API (opsiyonel proxy) | Devre dışı (production build’de rewrite eklenmez) |
| **API log seviyesi** | error, warn, log, debug, verbose | error, warn, log |

---

## 2. Canlıya Geçiş Öncesi Kontrol Listesi

### Backend (API)

- [ ] **CORS_ORIGIN** ortam değişkeni set edildi (canlı frontend adresi, virgülle ayrılmış birden fazla olabilir).  
  Örnek: `CORS_ORIGIN=https://app.uygulama.com,https://uygulama.com`
- [ ] **DATABASE_URL** production veritabanına işaret ediyor.
- [ ] **JWT_ACCESS_SECRET**, **JWT_REFRESH_SECRET** güçlü ve production’a özel değerler.
- [ ] **PORT** (veya host) production ortamına uygun.
- [ ] **ANTHROPIC_API_KEY** (AI analiz — Claude) — console.anthropic.com'dan alınır; Claude seçildiğinde zorunlu.
- [ ] **OLLAMA_BASE_URL**, **OLLAMA_MODEL** (AI analiz — Ollama) — opsiyonel; varsayılan model `qwen2.5-coder:7b`; Ollama seçildiğinde local'de `ollama serve` çalışıyor olmalı.
- [ ] **GEMINI_API_KEY** (AI analiz — Gemini) — aistudio.google.com'dan alınır; Gemini seçildiğinde zorunlu.
- [ ] **TWILIO_ACCOUNT_SID**, **TWILIO_AUTH_TOKEN**, **TWILIO_VERIFY_SERVICE_SID** (MFA SMS) — Twilio Console'dan alınır. Boş bırakılırsa DEV'de OTP terminale basılır; PROD'da gerçek SMS için zorunlu.
- [ ] **MFA ve rate limit** — Yönetim › Sistem Ayarları sayfasından MFA_SMS_ENABLED, RATE_LIMIT_* değerleri yönetilebilir.

**AI Chat — Local model (Ollama) kullanıldığında:**
- Token maliyeti yok; tam veri kapsamı (full) kullanılabilir.
- Veri dışarı çıkmaz → KVKK endişesi yok.

### Frontend (Web)

- [ ] **NEXT_PUBLIC_API_URL** build öncesi set edildi (canlı API base URL).  
  Örnek: `NEXT_PUBLIC_API_URL=https://api.uygulama.com/api/v1`  
  Not: Bu değişken build zamanında gömülür; build’den sonra değiştirirsen yeni build gerekir.

### Mobile (Expo — Phase 4)

- [ ] **EXPO_PUBLIC_API_URL** app.json veya .env ile set edildi. DEV: `http://<bilgisayar-ip>:3001/api/v1`; PROD: canlı API base URL.
- [ ] CORS: Native app HTTP isteklerinde origin göndermez. Expo dev web için `http://localhost:8081` CORS_ORIGIN'e eklenebilir.

### Altyapı

- [ ] API ve web aynı domain altında değilse CORS ve cookie/credentials ayarları (domain, secure, sameSite) uyumlu.
- [ ] HTTPS kullanılıyor; gerekirse reverse proxy (nginx, vb.) ayarları yapıldı.

---

## 3. Kod Tarafında Referanslar

- **API base URL (web):** `apps/web/src/lib/api.ts` — `BACKEND_URL` sadece fallback (DEV); prod’da `NEXT_PUBLIC_API_URL` kullanılmalı.
- **CORS:** `apps/api/src/main.ts` — `NODE_ENV === 'production'` iken `CORS_ORIGIN` kullanılır.
- **Rewrites:** `apps/web/next.config.ts` — `NODE_ENV === 'production'` iken rewrite eklenmez.
- **MFA SMS:** `apps/api/src/modules/sms/sms.service.ts` — Twilio Verify API; credentials yoksa OTP terminale basar.
- **API base URL (mobile):** `apps/mobile/lib/api.ts` — `getApiBaseUrl()` / `EXPO_PUBLIC_API_URL`; Android emülatör `10.0.2.2`, fiziksel cihaz LAN IP.
- **API HOST:** `apps/api/src/main.ts` — `HOST` (varsayılan `0.0.0.0`) ile LAN erişimi.
- **Expo fiziksel cihaz:** `apps/mobile` — `npm run start:lan` (Metro LAN); `EXPO_PUBLIC_API_URL` Mac’in telefonun görebildiği IP’si + `/api/v1` (aynı Wi‑Fi veya hotspot). `docs/environment-setup.md`.

---

## 4. Bu Doküman Ne Zaman Güncellenmeli?

- Yeni bir **ortam değişkeni** (env) eklendiğinde veya mevcut bir env’in DEV/PROD’da farklı kullanımı tanımlandığında.
- **CORS**, **proxy**, **log seviyesi**, **feature flag** gibi ortama göre değişen davranış eklendiğinde.
- Canlıya geçiş sürecinde yeni bir adım veya risk fark edildiğinde.

Bu sayede tek bir yerden DEV/PROD farkları ve go-live adımları takip edilmiş olur.
