# Canlıya Geçiş Stratejisi ve Ortam Farkları

Bu doküman, **development (DEV)** ile **production (PROD)** ortamları arasındaki farkları ve canlıya geçerken yapılması gerekenleri özetler. Yeni ortam-bağımlı özellik eklendiğinde bu dosya güncellenmelidir.

---

## 1. Ortam Farkları Özeti

| Konu | DEV | PROD |
|------|-----|------|
| **Web → API adresi** | `NEXT_PUBLIC_API_URL` yoksa `http://localhost:3001/api/v1` kullanılır | **Zorunlu:** `NEXT_PUBLIC_API_URL` canlı API base URL olarak set edilmeli (örn. `https://api.uygulama.com/api/v1`) |
| **API CORS** | Tüm `http(s)://localhost:*` origin’lere izin verilir | Sadece `CORS_ORIGIN` ile belirtilen origin(ler) kabul edilir |
| **Next.js rewrites** | `/api/v1/*` → `http://localhost:3001/api/v1/*` (opsiyonel proxy) | Devre dışı (production build’de rewrite eklenmez) |
| **API log seviyesi** | error, warn, log, debug, verbose | error, warn, log |
| **GEMINI_API_KEY** | AI Chat için opsiyonel (yoksa chat hata verir) | **Zorunlu (chat kullanılacaksa):** aistudio.google.com'dan API key alınmalı |

---

## 2. Canlıya Geçiş Öncesi Kontrol Listesi

### Backend (API)

- [ ] **CORS_ORIGIN** ortam değişkeni set edildi (canlı frontend adresi, virgülle ayrılmış birden fazla olabilir).  
  Örnek: `CORS_ORIGIN=https://app.uygulama.com,https://uygulama.com`
- [ ] **DATABASE_URL** production veritabanına işaret ediyor.
- [ ] **JWT_ACCESS_SECRET**, **JWT_REFRESH_SECRET** güçlü ve production’a özel değerler.
- [ ] **PORT** (veya host) production ortamına uygun.
- [ ] **GEMINI_API_KEY** (AI Analiz Chat kullanılacaksa) aistudio.google.com'dan alınan API key set edildi.

### Frontend (Web)

- [ ] **NEXT_PUBLIC_API_URL** build öncesi set edildi (canlı API base URL).  
  Örnek: `NEXT_PUBLIC_API_URL=https://api.uygulama.com/api/v1`  
  Not: Bu değişken build zamanında gömülür; build’den sonra değiştirirsen yeni build gerekir.

### Altyapı

- [ ] API ve web aynı domain altında değilse CORS ve cookie/credentials ayarları (domain, secure, sameSite) uyumlu.
- [ ] HTTPS kullanılıyor; gerekirse reverse proxy (nginx, vb.) ayarları yapıldı.

---

## 3. Kod Tarafında Referanslar

- **API base URL (web):** `apps/web/src/lib/api.ts` — `BACKEND_URL` sadece fallback (DEV); prod’da `NEXT_PUBLIC_API_URL` kullanılmalı.
- **CORS:** `apps/api/src/main.ts` — `NODE_ENV === 'production'` iken `CORS_ORIGIN` kullanılır.
- **GEMINI_API_KEY:** `apps/api/src/modules/chat/chat.service.ts` — AI analiz için Google Gemini API key.
- **Rewrites:** `apps/web/next.config.ts` — `NODE_ENV === 'production'` iken rewrite eklenmez.

---

## 4. Bu Doküman Ne Zaman Güncellenmeli?

- Yeni bir **ortam değişkeni** (env) eklendiğinde veya mevcut bir env’in DEV/PROD’da farklı kullanımı tanımlandığında.
- **CORS**, **proxy**, **log seviyesi**, **feature flag** gibi ortama göre değişen davranış eklendiğinde.
- Canlıya geçiş sürecinde yeni bir adım veya risk fark edildiğinde.

Bu sayede tek bir yerden DEV/PROD farkları ve go-live adımları takip edilmiş olur.
