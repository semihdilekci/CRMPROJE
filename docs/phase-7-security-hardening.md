# Faz 7 — Kurumsal güvenlik sertleştirmesi (Security Hardening)

Bu doküman, **P0** ve **P1** kapsamındaki güvenlik çalışmalarının hedeflerini, **mimari kararları**, **öncülük–ardıllık** ilişkilerini, **kod dokunuş haritasını** ve **branch planını** tanımlar.  
**Phase 1 feature listesi (`docs/phase-1-features.md`) dışında**, çapraz kesen bir fazdır; branch adlandırması `feature/sec7-*` ile yapılır (bkz. `.cursor/rules/git-conventions.mdc` istisnası).

**İlgili karar özeti (bu sohbet ve proje gereksinimleri):**

| Konu | Karar |
|------|--------|
| **BFF (Backend for Frontend)** | **Kullanılmayacak.** Web ve mobil istemciler, güvenli şekilde yapılandırılmış **doğrudan REST API** ile konuşur. |
| **Üretim barındırma** | **Senaryo A (kesin):** Tek host adı + path — `https://<site>` → Next.js, `https://<site>/api/v1` → NestJS (ters proxy). Bkz. §2. |
| **Oturum politikası** | Kullanıcı **en fazla ~60 dakikalık** oturum penceresi; **“beni hatırla” yok**. Erişim ve yenileme ömrü `JWT_*` ile uyumlu sıkı tutulur. |
| **İç ağ kısıtı (admin)** | Şimdilik **yok** (internet üzerinden erişim). |
| **Altyapı ölçeği** | İlk aşamada **tek API instance**; **ücret zorunluluğu yok** (rate limit için bellek içi throttler kabul; ölçekte ücretsiz katman Redis değerlendirilebilir). |
| **MFA** | Mevcut SMS/Twilio tabanlı akış **yeterli**; bu fazda ek MFA türü (TOTP/WebAuthn) **kapsam dışı**. |
| **CSP** | **Sıkı CSP**; **harici script yok** (whitelist minimal veya yok). |
| **Mobil** | **SSL pinning zorunlu**; **jailbreak/root engeli**; müşteri kartında **telefon maskeli**, göstermek için **native biyometrik/cihaz kilidi**. |
| **Bot / CAPTCHA** | **CAPTCHA yok**; **sıkı rate limit + hesap kilidi**. |
| **Uyumluluk süreci** | Bu fazda ayrı denetim/ISO aksiyonu **yok** (ileride ayrı doküman). |

---

## 0. Proje kuralları ve geliştirme süreciyle hizalama

### 0.1 Bu fazın yeri

- **Feature numarası (F{n})** ile bire bir örtüşmez; **güvenlik sertleştirmesi** olarak paralel veya Phase 1–3 tamamlandıktan sonra yürütülür.
- Her `sec7-XX` branch’inde yine de **`.cursor/rules/feature-development-protocol.mdc`** ilkesi geçerlidir: mümkünse **önce `@crm/shared`** (şema/response tipleri), ardından **Prisma** (migration), **API**, **web/mobil**; gereksiz geniş refactor yok.
- Şablon olarak **auth modülü** zorunlu referanstır: `apps/api/src/modules/auth/` (`auth.controller.ts`, `auth.service.ts`, `auth.module.ts`, `guards/`, `strategies/`). Domain CRUD şablonu `fair/` değildir; güvenlik değişiklikleri **auth + common + main** üzerindedir.
- Detaylı kayıt: **`.cursor/rules/reference-modules.mdc`** → “SECURITY HARDENING (PHASE 7)”.

### 0.2 Git branch isimlendirmesi

- Faz 7 işleri için **`feature/sec7-{iki haneli sıra}-{kisa-aciklama}`** kullanılır (örn. `feature/sec7-01-cors-credentials-env`).
- Gerekçe: Phase 1’deki `F{n}` numarası ile karışmayı önler; **`.cursor/rules/git-conventions.mdc`** içinde tanımlı istisnadır.

### 0.3 Branch başına önerilen iş sırası (kısa)

Her branch kapanmadan önce:

1. **Analiz:** Etkilenen dosyalar bu dokümandaki §7.2 tablosu ile örtüşüyor mu?
2. **Shared:** API sözleşmesi değişiyorsa (login/refresh yanıt gövdesi, Zod şemaları) `packages/shared` önce.
3. **Prisma:** Şema değişikliği varsa migration ayrı commit (proje kuralı).
4. **Build:** `npm run build -w packages/shared`, `-w apps/api`, `-w apps/web` (ilgili app’ler).
5. **Test:** `docs/phase-7-security-hardening.md` §11 ve **`.cursor/rules/test-strategy.mdc`** — auth için en azından servis birim testi + kritik akış elle veya entegrasyon testi.

---

## 1. Mimari: BFF olmadan güvenlik zaafiyeti yaratmamak

### 1.1 Güven sınırı

- **Güvenilir sınır (trust boundary)** NestJS API’dir: kimlik doğrulama, RBAC, IDOR önleme, oran sınırlama, şema doğrulama, denetim günlüğü.
- **Mobil uygulama** doğrudan API’ye bağlandığı için API **internet üzerinden erişilebilir** kalır; BFF bu gerçeği değiştirmez. Bu nedenle **API sertleştirmesi zorunludur** — BFF alternatif değildir.

### 1.2 BFF seçilmemesinin anlamı

| Konu | BFF olmadan yapılacak |
|------|------------------------|
| Refresh token | **httpOnly + Secure + SameSite** çerez (JSON gövdede refresh **yok**); path kısıtlı (`/api/v1/auth/refresh` vb.). |
| Access token | **Yalnızca bellek** (Zustand/React state); **localStorage/sessionStorage’da access yok**. |
| CORS | **Açık origin listesi**; `credentials: true`; production’da **wildcard yok**. |
| CSRF | Aynı site politikası + **SameSite=Lax veya Strict** (üretimde Strict tercih edilir, alt alan uyumu dokümante edilir); API **JSON-only** POST’larda risk düşük — yine de çerez kullanan uçlar dokümante edilir. |
| Mobil | **SSL pinning** ile kanal bütünlüğü; token **Secure Store**’da. |

### 1.3 BFF’nin sağlayacağı ekleri bilinçli olarak almıyoruz

- API’yi yalnızca özel ağda tutma (mobil yine dışarı çıkmalı → bu projede **uygulanmıyor**).
- Tarayıcıya hiç JWT görünmemesi (sunucu oturumu) — **httpOnly refresh + kısa access** ile eşdeğer hedefe yaklaşılır.

**Sonuç:** Bu faz tamamlandığında, **BFF olmaması tek başına bir “bulgu” üretmemeli**; pentest beklentisi: çerez bayrakları, CORS, CSP, oturum yenileme, rate limit ve mobil pinning/jailbreak kontrollerinin **kanıtlanabilir** olması.

---

## 2. Üretim barındırma (aynı site / çerez uyumu)

### 2.1 Kesin karar: Senaryo A (tek host + path)

**Üretimde uygulanacak model:** Ters proxy ile **tek host adı** — `https://ornek.com` → Next.js; `https://ornek.com/api/v1` → NestJS (path tabanlı routing).

| Avantaj | Not |
|--------|-----|
| **Çerez / CSRF** | Aynı site; refresh çerezi için **SameSite=Strict** kullanımı doğal; **cross-site** çerez karmaşası yok. |
| **CORS** | Üretimde genelde **tek origin** (`https://ornek.com`); `credentials: true` ile yönetim basit. |
| **Operasyon** | Tek DNS / tek TLS sertifikası (aynı SAN veya wildcard tek domain); mobil `EXPO_PUBLIC_API_URL` canlıda tek HTTPS base. |
| **Geliştirme** | Web’de relative `/api/v1` veya aynı origin base URL; alt alan + `Domain=.…` ayarı gerekmez. |

**Zorunlu kontroller (A):**

- Yalnızca **HTTPS**.
- `CORS_ORIGIN` — üretimde **tam origin** (örn. `https://ornek.com`); `www` kullanılıyorsa dokümante edilen ikinci origin.
- Reverse proxy’de `/api/v1` ve `/uploads` (varsa) NestJS’e doğru **forward**; Next yalnızca UI route’larına bakar.

### 2.2 Referans: Senaryo B (kullanılmıyor)

İleride ihtiyaç çıkarsa alternatif: `https://app.ornek.com` + `https://api.ornek.com`, çerez `Domain=.ornek.com`, **CORS_ORIGIN** ile web origin’leri — bu proje için **seçilmedi**; Faz 7 uygulaması **A** üzerinden ilerler.

**Genel (DEV):** Geliştirme için `localhost` portları `CORS_ORIGIN` ve `docs/environment-setup.md` ile uyumlu whitelist.

---

## 3. Oturum ve token parametreleri (sıkı)

| Parametre | Hedef | Not |
|-----------|--------|-----|
| **Access token ömrü** | `JWT_ACCESS_EXPIRATION` — **≤ 60 dakika** (organizasyon politikası: saatlik yeniden kimlik doğrulama penceresi). | Header’da taşınır; bellekte tutulur. |
| **Refresh token ömrü** | `JWT_REFRESH_EXPIRATION` — access ile **uyumlu veya daha kısa** oturum zinciri; “hatırla” yok. | httpOnly çerez + DB’de iptal edilebilir. |
| **Refresh rotation** | Her yenilemede **yeni refresh**, eskisinin **tek kullanımlık** olması; **reuse** tespitinde tüm oturum ailesi iptali. | Zorunlu P0. |
| **Logout** | Refresh çerez silinir + DB’de refresh geçersiz. | |

---

## 4. P0 kapsamı (öncelik)

1. **API CORS + credentials** — Production’da whitelist; `credentials: true`; geliştirme origin’leri sınırlı liste.  
2. **Refresh httpOnly çerez** — Login/refresh yanıtında gövdede refresh **taşınmaz** (mobil istisna dokümante: Secure Store).  
3. **Refresh rotation + reuse detection** — Prisma şeması / token tablosu güncellemesi.  
4. **Web: localStorage token kaldırma** — Access yalnızca bellek; Axios `withCredentials: true`.  
5. **Sıkı CSP + güvenlik başlıkları (Next)** — Harici script yok; HSTS (HTTPS ortamlarında).  
6. **Rate limit + hesap kilidi** — Auth uçlarında sıkı limit; başarısız denemede kilitleme (IP + hesap birleşimi tercih edilir). CAPTCHA **yok**.

---

## 5. P1 kapsamı

1. **Mobil SSL pinning** — API host için sertifika/public key sabitleme; üretimde sertifika yenileme sonrası **14 gün** içinde mağaza sürümü hedefi (§12; admin panelden parametrik yapılandırma **yok**).  
2. **Jailbreak / root tespiti** — Tespitte **uygulama kapatılır** (blok); sadece uyarı yok.  
3. **Müşteri telefonu** — Listede **maskeli**; tam göstermek için **expo-local-authentication** (veya eşdeğeri) ile yeniden doğrulama; gösterim süresi/oturum içi state kuralları.

---

## 6. Öncülük ve ardıllık (teknik)

```text
P0-A (CORS + credentials + cookie altyapısı)
  → P0-B (Auth: httpOnly refresh, login/refresh/logout çerez akışı)
    → P0-C (Refresh rotation + reuse detection — DB)
      → P0-D (Web: bellek access + Axios withCredentials, localStorage temizliği)

P0-E (Next CSP + HSTS + güvenlik başlıkları)     ← P0-A sonrası veya P0-D ile paralel (çakışma yoksa)
P0-F (Rate limit sıkılaştırma + hesap kilidi)    ← P0-A sonrası; auth servisle entegre

P1-A (Mobil SSL pinning)
P1-B (Jailbreak/root engeli)                     ← P1-A’dan bağımsız başlatılabilir
P1-C (Telefon maskesi + biyometrik göster)       ← API alan maskesi gerekirse küçük shared/API ekleri
```

**Bağımlılık notu:** P0-D, P0-B tamamlanmadan anlamlı değildir. P0-C, P0-B ile aynı branch’te birleştirilebilir (büyük ise ayrı tutun).

---

## 7. Branch planı ve kod dokunuş haritası

### 7.1 Branch listesi (tek merge = tek branch önerisi)

| Sıra | Branch adı (öneri) | İçerik | Ön koşul |
|------|---------------------|--------|----------|
| 1 | `feature/sec7-01-cors-credentials-env` | `main.ts` CORS: whitelist, `credentials: true`, `NODE_ENV` ayrımı; gerekli env örnekleri; cookie-parser hazırlığı. | — |
| 2 | `feature/sec7-02-auth-httponly-refresh-cookie` | Login/refresh/logout: refresh **httpOnly** çerez; gövdede refresh kaldırma (web); mobilde mevcut Secure Store akışı korunur/dokümante edilir. | sec7-01 |
| 3 | `feature/sec7-03-auth-refresh-rotation-reuse` | Refresh token rotation, reuse = revoke family; Prisma migration. | sec7-02 |
| 4 | `feature/sec7-04-web-auth-memory-axios` | Web `auth-store` + `api.ts`: localStorage token yok; access bellek; `withCredentials`; yenileme interceptor. | sec7-03 |
| 5 | `feature/sec7-05-web-security-headers-csp` | `next.config` / middleware: sıkı **CSP**, **HSTS**, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` (minimal). | sec7-01 (veya sec7-04 sonrası) |
| 6 | `feature/sec7-06-api-rate-limit-account-lockout` | Auth için sıkı throttle; hesap kilidi alanları + servis mantığı; CAPTCHA **yok**. | sec7-02 |
| 7 | `feature/sec7-07-mobile-ssl-pinning` | Pinning konfigürasyonu + dokümantasyon (sertifika yenileme). | — (P0 merge sonrası P1) |
| 8 | `feature/sec7-08-mobile-jailbreak-root-block` | Root/jailbreak tespiti; **uygulama kapatma** (blok) politikası. | — |
| 9 | `feature/sec7-09-mobile-phone-mask-biometric` | Müşteri kartı telefon maskesi; göster için Local Authentication. | sec7-07 veya bağımsız (API değişmezse) |

**Paralel çalışma:** sec7-05, sec7-06 birbirinden bağımsız yürütülebilir (takım varsa); **sec7-04’ten önce** web’de cookie akışının dev’de çalıştığı doğrulanmalı.

### 7.2 Kod dokunuş noktaları (ana dosyalar)

| Branch | API | Web | Shared | Mobil / diğer |
|--------|-----|-----|--------|----------------|
| **sec7-01** | `apps/api/src/main.ts` (CORS, Helmet, cookie-parser kaydı), `apps/api/.env.example` | `apps/web/next.config.ts` (gerekirse rewrite notu) | — | `docs/deployment-and-env-strategy.md` güncelle |
| **sec7-02** | `modules/auth/auth.controller.ts`, `auth.service.ts`, `auth.module.ts`, `main.ts` (cookie ayarları) | Login sonrası token işleme, `stores/auth-store.ts` | `packages/shared` — login/refresh **response** şemaları (refresh gövdede yok) | `apps/mobile/lib/api.ts` — refresh akışı dokümante |
| **sec7-03** | `prisma/schema.prisma`, `auth.service.ts`, migration | — | Gerekirse token/yanıt tipleri | — |
| **sec7-04** | — | `apps/web/src/lib/api.ts`, `apps/web/src/stores/auth-store.ts`, login sayfaları | — | — |
| **sec7-05** | — | `apps/web/next.config.ts`, `middleware.ts` (varsa), güvenlik başlıkları | — | — |
| **sec7-06** | `auth.controller.ts`, `auth.service.ts`, `app.module.ts` (Throttler), `modules/settings/` (yeni ayar anahtarları), `User` veya kilitleme modeli | `api.ts` 429 handling (toast) | — | — |
| **sec7-07** | — | — | — | `apps/mobile` — pinning paketi/konfig, `docs/` runbook |
| **sec7-08** | — | — | — | `apps/mobile` — jailbreak/root kütüphanesi |
| **sec7-09** | Opsiyonel: maskeli alan API | Opsiyonel | `packages/shared` | Müşteri kartı UI + `expo-local-authentication` |

**Mevcut kod notu (sec7-04 öncesi):** `apps/web/src/lib/api.ts` şu an `localStorage` üzerinden `accessToken` / `refreshToken` kullanıyor; Faz 7 hedefi bunu kaldırmaktır.

---

## 8. Mevcut rate limit ve hedef (account lockout)

### 8.1 Şu anki davranış (özet)

- **Global:** `apps/api/src/app.module.ts` — `ThrottlerModule.forRoot({ ttl: 60000, limit: 10 })` + global `ThrottlerGuard`.
- **Auth route:** `auth.controller.ts` — `@Throttle`: login `5/dk`, register `3/dk`, `verify-mfa` `5/5dk` (controller üzerinde sabit).
- **Veritabanı ayarları:** `SystemSetting` içinde `RATE_LIMIT_LOGIN_*`, `RATE_LIMIT_REGISTER_*`, `RATE_LIMIT_MFA_*` anahtarları (`settings.service.ts` varsayılanları) tanımlı; **Faz 7’de** bu değerlerin throttle/lockout ile **uyumlu** kullanılması hedeflenir (tam entegrasyon sec7-06’da).

### 8.2 Hesap kilidi — uygulama taslağı

- **Amaç:** Aynı hesapta çok sayıda başarısız girişte **rate limit’e ek** olarak kısa süreli hesap kilidi (CAPTCHA yok).
- **Kesinleşen değerler:** Ardışık **5** başarısız giriş → **15 dakika** kilit; süre bitince **otomatik** açılır.
- **Yönetim:** **“Kilidi kaldır”** için ayrı bir admin ekranı **yok** — kötüye kullanım ve destek yükü azaltılır. Bunun yerine **rate limit ve kilitleme eşikleri** mevcut **Sistem Ayarları** (`RATE_LIMIT_*`, sec7-06 ile `ACCOUNT_LOCKOUT_*` entegrasyonu) ve gerekiyorsa **env** ile ayarlanır.
- **Saklama:** `User` üzerinde `failedLoginCount`, `lockedUntil` (DateTime?) veya ayrı tablo; başarılı girişte sayaç sıfırlanır.
- **Env:** `ACCOUNT_LOCKOUT_THRESHOLD`, `ACCOUNT_LOCKOUT_MINUTES` — `docs/deployment-and-env-strategy.md` ve `apps/api/.env.example` ile senkron.

---

## 9. Refresh token rotation — veri modeli yönü (taslak)

**Mevcut:** `User.hashedRefreshToken` (tek alan) — rotation + aile iptali için **yetersiz**.

**Hedef (yaklaşımlardan biri):**

- **`RefreshToken` modeli (öneri):** `id`, `userId`, `familyId` (cuid), `tokenHash`, `expiresAt`, `replacedAt`?, `createdAt`; reuse tespitinde aynı `familyId` altındaki tüm geçerli tokenlar iptal.
- **`User.hashedRefreshToken`:** Migration ile kaldırılabilir veya geçiş döneminde paralel tutulur (tek branch’te netleştir).

**Uygulama:** `auth.service.ts` içinde refresh/login/logout akışları; Prisma transaction tercih edilir.

---

## 10. Kabul kriterleri (faz tamam)

**P0**

- [ ] Web’de **access token localStorage’da değil**; refresh **yalnızca httpOnly** (veya mobilde Secure Store).  
- [ ] **Refresh rotation + reuse** üretimde aktif.  
- [ ] Production **CORS** wildcard değil; **credentials** ile uyumlu origin listesi.  
- [ ] **CSP** canlıda sıkı; harici script yok (istisna yok).  
- [ ] Auth uçlarında **rate limit + hesap kilidi** davranışı test edildi.  
- [ ] `JWT_ACCESS_EXPIRATION` / refresh ömrü **60 dk politikası** ile uyumlu.

**P1**

- [ ] Mobil **SSL pinning** aktif (prod build).  
- [ ] **Jailbreak/root** tespitinde **uygulama kapatılıyor** (blok).  
- [x] Telefon **maskeli**; tam gösterim **biyometrik/cihaz kilidi** ile. — `maskPhone()` + `usePhoneReveal` hook; 30 sn sonra otomatik kapanır; 12 birim test geçti.

---

## 11. Test ve doğrulama

- **Birim:** `auth.service.ts` — login, refresh, logout, rotation, reuse senaryosu (mock Prisma).  
- **Entegrasyon (opsiyonel):** `auth` uçları — 401/429/çerez başlıkları.  
- **Web:** Tarayıcıda Application → Cookies (refresh); Memory’de access; 401 refresh sonrası sessiz yenileme.  
- Ayrıntı: **`.cursor/rules/test-strategy.mdc`**.

---

## 12. Mobil P1 — uygulama notları

- **SSL pinning:** API host için public key / sertifika pin; `react-native-ssl-public-key-pinning`, `expo` uyumlu sarmalayıcı veya ekosistemdeki güncel paket tercihi (implementasyon sırasında tek seçim yapılır).  
- **Sertifika yenileme (üretim):** TLS yenilenmeden önce **yedek pin** veya yeni sertifikaya uygun pin hazırlığı; **mağaza üzerinden uygulama güncellemesi** ile yeni pin dağıtımı — **operasyonel hedef: sertifika değişiminden sonra 14 gün içinde** güncel pin’i içeren sürümün yayında olması (admin panelden parametrik yapılandırma **yok**; süreç + sorumluluk `docs/deployment-and-env-strategy.md` ile uyumlu).  
- **Jailbreak/root:** Tespitte **uygulama sonlandırılır** (kullanıcı uygulamayı yeniden açamaz veya blok ekranı — implementasyon detayı sec7-08).  
- **Telefon + biyometrik:** `expo-local-authentication`; `maskPhone()` (son 4 hane görünür), `usePhoneReveal` hook (30 sn sonra otomatik kapanır). Kod: `apps/mobile/lib/phone-mask.ts`, `apps/mobile/lib/biometric.ts`, `apps/mobile/hooks/use-phone-reveal.ts`. Liste kartında maskeli gösterim; profil ekranında "Göster" butonu biyometrik doğrulama başlatır.

---

## 13. Kesinleşen ürün / mimari kararları

| Konu | Karar |
|------|--------|
| **Üretim barındırma** | **Senaryo A** — tek host, `/api/v1` path (§2.1). |
| **Hesap kilidi** | **5** başarısız giriş → **15 dk** kilit; **admin “kilidi kaldır” yok**; limit/eşik **Sistem Ayarları** (`RATE_LIMIT_*`, kilitleme env) ile yönetim. |
| **Mobil TLS / pinning SLA** | Parametrik admin **yok**; üretimde **14 gün** içinde mağaza sürümü (yeni pin) hedefi. |
| **Jailbreak/root** | Tespitte **uygulama kapatma** (blok). |

---

## 14. Dokümantasyon referansları ve senkronizasyon

Uygulama sırasında şu dosyalar güncel tutulmalıdır:

| Dosya | İçerik |
|-------|--------|
| `docs/tech-stack.md` | Oturum modeli (BFF yok) — zaten Faz 7 özeti içerir |
| `docs/deployment-and-env-strategy.md` | CORS, çerez, HTTPS, origin, `COOKIE_*`, kilitleme env’leri |
| `docs/environment-setup.md` | Güvenlik bölümüne link |
| `docs/phase-1-features.md` | Faz 7 referans satırı |
| `.cursor/rules/security-rules.mdc` | Token saklama, CSP |
| `.cursor/rules/reference-modules.mdc` | Faz 7 + auth şablonu |
| `.cursor/rules/git-conventions.mdc` | `feature/sec7-*` istisnası |
| `apps/api/.env.example` | `CORS_ORIGIN`, `COOKIE_*`, kilitleme env’leri |

---

## 15. Bilinen riskler (kabul edilen)

- **BFF yok:** API internete açık kalır; risk **WAF, rate limit, sert auth ve izleme** ile yönetilir.  
- **Tek instance rate limit:** Bellek içi sayaçlar süreç yeniden başlatmada sıfırlanır; ölçekte Redis ücretsiz katman değerlendirilir.  
- **Jailbreak engeli:** %100 garanti değildir; savunma derinliği + sunucu tarafı yetki esastır.

---

*Ref: Proje güvenlik kuralları, `docs/deployment-and-env-strategy.md`, kesin barındırma **A** (tek host + `/api/v1`), saatlik oturum, CAPTCHA yok, MFA ek efor yok.*
