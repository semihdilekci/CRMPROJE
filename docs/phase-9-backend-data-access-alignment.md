# Faz 9 — Backend veri erişimi katman uyumu (Data Access Alignment)

Bu doküman, mimari inceleme sonrası netleştirilen **hedef yapı** ile mevcut API kodu arasındaki farkları kapatmak için yapılacak işleri tanımlar.

**Hedef mimari (değişmez):** `Module → Controller → Service → PrismaService` — **DDD Repository pattern eklenmez.**  
Referans: `docs/backend-data-access.md`, `docs/tech-stack.md`, `.cursor/rules/project-architecture.mdc`.

**Güvenlik ilkesi (bu fazın üst önceliği):** Refactor ve test ekleme, **kimlik doğrulama, yetkilendirme, girdi doğrulama ve hata sızıntısı** davranışını **geriye taşımamalıdır**. Davranış değişikliği yalnızca katman taşıma ve encapsulation içindir; güvenlik kuralları her adımda doğrulanır.

**Phase 1 feature listesi (`docs/phase-1-features.md`) dışında** çapraz kesen bir fazdır. Branch: `refactor/arch9-*` (bkz. §8).

---

## 0. Proje kuralları ve süreç

### 0.1 Bu fazın yeri

| Konu | Karar |
|------|--------|
| Repository sınıfları (`IFairRepository`, `fair.repository.ts`) | **Yok** — Phase 1–9 kapsamında eklenmez |
| ORM değiştirme | **Yok** — Prisma kalır |
| API sözleşmesi (URL, JSON alanları, HTTP kodları) | **Değişmez** (istisna: hata mesajı metni aynı kalır) |
| Guard / permission decorator kullanımı | **Değişmez** — refactor guard’ları gevşetmez |
| Geliştirme protokolü | `.cursor/rules/feature-development-protocol.mdc` — build + test + kullanıcı onayı (merge öncesi) |

### 0.2 Şablon modüller

- Katman örneği: `apps/api/src/modules/fair/` (`fair.controller.ts`, `fair.service.ts`)
- Auth (JWT taşıma): `apps/api/src/modules/auth/` (`auth.service.ts`, `strategies/jwt.strategy.ts`, `guards/`)
- Health: yeni `apps/api/src/health/` veya `apps/api/src/prisma/` altında ince servis — **auth şablonu değil**, yalnızca readiness

### 0.3 Dokümantasyon ön koşulu

- [x] `docs/backend-data-access.md` — terminoloji netleştirildi
- [x] `docs/tech-stack.md`, `.cursor/rules/project-architecture.mdc` — Service + PrismaService ifadesi

---

## 1. Mevcut durum (As-Is) ve hedef (To-Be)

### 1.1 Uyumlu olanlar

- 15 domain `*.service.ts` dosyası `PrismaService` inject ediyor; controller’lar (health hariç) servise delegasyon yapıyor.
- `*.repository.ts` dosyası yok.
- Zod doğrulama controller katmanında; parola alanları servislerde `select` ile dışlanıyor (ör. `user.service.ts` `USER_SELECT`).
- Ham SQL yalnızca readiness kontrolünde (`SELECT 1`).

### 1.2 Hedef durum (To-Be)

| # | Hedef |
|---|--------|
| T1 | **Hiçbir** `*.controller.ts` dosyası `PrismaService` import/inject etmez |
| T2 | JWT `validate` kullanıcı yüklemesi tek kanaldan (`AuthService`) — aynı güvenlik kuralları |
| T3 | Tüm servislerde `prisma` alanı **private** (public encapsulation ihlali yok) |
| T4 | Kritik servislerde birim test — `PrismaService` mock; guard davranışı testlerle zayıflatılmaz |
| T5 | `docs/backend-data-access.md` ile kod bire bir örtüşür |

### 1.3 Kapsam dışı (bu fazda yapılmaz)

- Domain Repository pattern veya ORM soyutlama arayüzleri
- `report.service.ts` / `chat.service.ts` dosya bölme (P2 — ayrı refactor talebi)
- RBAC modeli değişikliği (`RolesGuard` ↔ `PermissionsGuard` birleştirme)
- Frontend / mobil / shared API sözleşmesi değişikliği
- Yeni endpoint veya yetki gevşetmesi

---

## 2. Güvenlik: geriye taşımama taahhüdü

Bu bölüm, faz boyunca **zorunlu** kabul kriterleridir. Bir madde karşılanmıyorsa ilgili branch **merge edilmez**.

### 2.1 Genel kurallar

1. **Sıfır yetki gevşetmesi:** `@UseGuards`, `@RequirePermission`, `@Roles`, `JwtAuthGuard`, `PermissionsGuard` kullanımı endpoint bazında **aynı veya daha sıkı** kalır; “refactor sırasında guard kaldırma” yasak.
2. **Sıfır kimlik bilgisi sızıntısı:** API yanıtlarında `password` / hash alanı dönmez; Prisma `select`/`omit` kuralları korunur.
3. **Sıfır iç detay sızıntısı:** Global exception filter ve readiness hatalarında stack trace, `DATABASE_URL`, SQL metni istemciye gitmez (mevcut `ServiceUnavailableException` mesajı korunur).
4. **Sıfır ham SQL genişlemesi:** Yeni `$queryRaw` / `$executeRaw` eklenmez (mevcut `SELECT 1` health kontrolü servise taşınırken **aynı** minimal sorgu kalır).
5. **Davranış eşdeğerliği:** Refactor öncesi/sonrası aynı HTTP status + `success`/`error` kodları; login, refresh, logout, korumalı CRUD akışları regression test ile doğrulanır.

### 2.2 Madde bazlı güvenlik gereksinimleri

#### ARCH9-01 — Health / readiness servise taşıma

| Risk | Önlem |
|------|--------|
| Readiness endpoint bilgi sızdırır | Yanıt gövdesi yalnızca `{ status: 'ready' \| hata durumunda genel mesaj }`; DB host, kullanıcı, hata kodu yok |
| Health endpoint korumasız kalır | `@SkipThrottle()` ve **auth gerektirmeme** mevcut gibi kalır (load balancer için); **admin verisi dönmez** |
| Yeni servis yetkisiz veri okur | `HealthService` yalnızca `SELECT 1` veya `prisma.$queryRaw` ile bağlantı testi; domain tablolarına erişim yok |

**Kabul:** `GET /health`, `GET /health/ready` — önceki ile aynı HTTP kodları ve kullanıcıya dönük mesajlar.

#### ARCH9-02 — JWT validate → AuthService

| Risk | Önlem |
|------|--------|
| Silinmiş / pasif kullanıcı token ile erişir | `findUserForJwtValidation` (veya eşdeğeri) mevcut `findUnique` + yoksa `UnauthorizedException('Kullanıcı bulunamadı')` — **aynı mesaj** |
| Parola veya fazla PII döner | Dönüş alanları mevcut `jwt.strategy.ts` `select` ile **birebir aynı** (`id`, `email`, `name`, `role`, `createdAt`, `updatedAt`) |
| Strategy ↔ Service döngüsel bağımlılık | `AuthModule` export/import sırası NestJS dokümantasyonuna uygun; `JwtStrategy` yalnızca ince `AuthService` metodu çağırır |
| Token doğrulama atlanır | `ignoreExpiration: false`, secret `configService.getOrThrow('JWT_ACCESS_SECRET')` değişmez |

**Kabul:** Geçerli token → korumalı endpoint 200; geçersiz/silinmiş kullanıcı → 401; parola alanı response’ta yok.

#### ARCH9-03 — ReportService `prisma` private

| Risk | Önlem |
|------|--------|
| Rapor yetkisi bypass | Sadece visibility değişikliği; `ReportPermissionGuard` ve servis içi filtreler **değişmez** |
| Dış modül `reportService.prisma` ile sorgu | `private readonly prisma` — dış erişim derleme hatası; varsa kullanım kaldırılır |

**Kabul:** Rapor endpoint’leri önceki ile aynı yetki ve veri kapsamı.

#### ARCH9-04 — Birim testler

| Risk | Önlem |
|------|--------|
| Testler production guard’ları devre dışı bırakır | Testler yalnızca `*.service.spec.ts`; controller entegrasyonunda guard’lar mock’lanmaz (servis izolasyonu) |
| Sahte “her şey geçer” mock | `NotFoundException`, `ForbiddenException`, `ConflictException` negatif senaryoları en az birer test |

---

## 3. İş paketleri (ARCH9)

Geliştirme sırası **zorunludur** (P0 güvenlik/katman → P1 → P2 opsiyonel).

---

### ARCH9-01 — HealthService (P0)

**Amaç:** `AppController` içindeki `PrismaService` kullanımını kaldırmak.

**Yapılacaklar:**

- [ ] `HealthService` (veya `PrismaHealthService`) oluştur: `checkDatabaseConnection(): Promise<void>` — başarısızlıkta mevcut log + `ServiceUnavailableException` (Türkçe genel mesaj)
- [ ] `HealthModule` veya `PrismaModule` export; `AppModule` import
- [ ] `AppController`: yalnızca `healthService.check...()` çağrısı; `PrismaService` inject kaldır
- [ ] `app.controller.spec.ts` güncelle — mock `HealthService`

**Dokunulacak dosyalar (tahmini):**

- `apps/api/src/health/health.service.ts` (yeni)
- `apps/api/src/health/health.module.ts` (yeni)
- `apps/api/src/app.controller.ts`
- `apps/api/src/app.module.ts`
- `apps/api/src/app.controller.spec.ts`

**Güvenlik doğrulama:**

- [ ] Readiness hata yanıtında DB detayı yok
- [ ] `rg PrismaService apps/api/src --glob '*.controller.ts'` → 0 eşleşme

**Commit önerisi:** `refactor(api): move database readiness check to HealthService`

---

### ARCH9-02 — JWT validate kanal birleştirme (P0)

**Amaç:** `JwtStrategy` içindeki doğrudan Prisma çağrısını `AuthService` üzerinden yapmak.

**Yapılacaklar:**

- [ ] `AuthService.findUserForJwtValidation(userId: string)` — mevcut strategy `select` ile aynı alanlar; kullanıcı yoksa `UnauthorizedException`
- [ ] `JwtStrategy.validate` → yalnızca `authService.findUserForJwtValidation(payload.sub)`
- [ ] `JwtStrategy` constructor’dan `PrismaService` kaldır
- [ ] `auth.service.spec.ts`: yeni metot için en az 2 test (bulundu / bulunamadı)
- [ ] Mevcut auth testleri yeşil

**Dokunulacak dosyalar:**

- `apps/api/src/modules/auth/auth.service.ts`
- `apps/api/src/modules/auth/strategies/jwt.strategy.ts`
- `apps/api/src/modules/auth/auth.module.ts` (gerekirse)
- `apps/api/src/modules/auth/auth.service.spec.ts`

**Güvenlik doğrulama:**

- [ ] Login → korumalı `GET` (ör. `/fairs`) → 200
- [ ] Var olmayan `sub` ile üretilmiş token (test ortamı) → 401
- [ ] Response’ta password alanı yok

**Commit önerisi:** `refactor(api): centralize jwt user lookup in AuthService`

---

### ARCH9-03 — Encapsulation: ReportService (P1)

**Amaç:** Public `prisma` alanını kapatmak.

**Yapılacaklar:**

- [ ] `readonly prisma` → `private readonly prisma`
- [ ] Repoda `reportService.prisma` veya dış erişim var mı — `rg` ile kontrol; varsa kaldır

**Güvenlik doğrulama:**

- [ ] Rapor endpoint’leri yetkisiz kullanıcıda 403 (değişmedi)
- [ ] Yetkili kullanıcıda veri seti önceki ile aynı

**Commit önerisi:** `refactor(api): make ReportService prisma field private`

---

### ARCH9-04 — Servis birim testleri (P1)

**Öncelik sırası:** customer → permission → user → opportunity (kritik iş kuralları).

**Her modül için minimum:**

- [ ] Happy path (mock Prisma başarılı dönüş)
- [ ] `NotFoundException` veya `ConflictException` (en az biri)
- [ ] `PrismaService` mock; gerçek DB yok

**Dosyalar (yeni):**

- [ ] `customer.service.spec.ts`
- [ ] `permission.service.spec.ts`
- [ ] `user.service.spec.ts`
- [ ] `opportunity.service.spec.ts` (seçilmiş public metotlar; dosyanın tamamı zorunlu değil)

**Güvenlik doğrulama:**

- [ ] Testler `password` mock’lamaz veya response’a koymaz
- [ ] Testler guard’ları bypass edecek controller testi **içermez** (servis odaklı)

**Commit önerisi:** `test(api): add unit tests for {module} service` (modül başına ayrı commit tercih edilir)

---

### ARCH9-05 — Dokümantasyon ve kod standardı (P1)

**Amaç:** AI/insan karışıklığını önlemek; güvenlik değiştirmez.

**Yapılacaklar:**

- [ ] `docs/backend-data-access.md` — ARCH9-01/02 sonrası “istisna yok” veya health/JWT notu
- [ ] `.cursor/rules/code-standards.mdc` — `dto/` klasörü yerine `@crm/shared` + `ZodValidationPipe` (mevcut kod)

**Commit önerisi:** `docs: align code-standards with shared zod dto pattern`

---

### ARCH9-06 — Büyük servis bölme (P2 — opsiyonel, ayrı branch önerilir)

**Amaç:** Sürdürülebilirlik; **güvenlik davranışı değişmez.**

- [ ] `report.service.ts` — salt okunur sorgu blokları `report.queries.ts` veya genişletilmiş `report.helpers.ts`
- [ ] `chat.service.ts` — AI context builder ayrı dosya (Prisma çağrıları serviste kalabilir)

**Bu fazın merge kriterine dahil değildir** — ARCH9-01..05 tamamlanmış olması yeterli.

---

## 4. Güvenlik regresyon kontrol listesi (merge öncesi zorunlu)

Manuel ve otomatik — geliştirici tarafından işaretlenir:

### 4.1 Otomatik

- [ ] `npm run build -w packages/shared`
- [ ] `npm run build -w apps/api`
- [ ] `npm test -w apps/api` (tüm spec’ler)

### 4.2 Kimlik ve oturum

- [ ] Login başarılı → access token ile korumalı endpoint
- [ ] Yanlış parola → 401, aynı hata mesajı politikası (kullanıcı numaralandırma yok)
- [ ] Logout → refresh geçersiz
- [ ] Süresi dolmuş access → 401

### 4.3 Yetkilendirme

- [ ] `user` rolü admin-only endpoint → 403
- [ ] `content_editor` olmadan fair create → 403 (mevcut permission modeli)
- [ ] Admin secrets endpoint → hâlâ admin-only

### 4.4 Veri ve hata

- [ ] User list/detail response’ta `password` yok
- [ ] Readiness DB kapalı → 503, genel Türkçe mesaj (stack yok)
- [ ] Validation hatası → 400 + `VALIDATION_ERROR` (değişmedi)

### 4.5 Katman

- [ ] `rg 'PrismaService' apps/api/src --glob '*.controller.ts'` → boş
- [ ] `rg 'PrismaService' apps/api/src/modules/auth/strategies` → boş (ARCH9-02 sonrası)

---

## 5. Branch ve commit planı

### 5.1 Ana branch

```bash
git checkout main
git pull
git checkout -b refactor/arch9-data-access-alignment
```

### 5.2 Önerilen commit sırası

| Sıra | Kapsam | Tip |
|------|--------|-----|
| 1 | ARCH9-01 HealthService | `refactor(api):` |
| 2 | ARCH9-02 JWT → AuthService | `refactor(api):` |
| 3 | ARCH9-03 ReportService private | `refactor(api):` |
| 4 | ARCH9-04 testler (1–4 commit) | `test(api):` |
| 5 | ARCH9-05 docs | `docs:` |

### 5.3 Merge koşulları

- ARCH9-01 ve ARCH9-02 **tamamlanmış** (P0 zorunlu)
- §4 güvenlik regresyon listesi işaretli
- Geliştirici tarayıcıda smoke test onayı (feature-development-protocol Step 12)
- `main` merge, branch sil

---

## 6. Risk matrisi

| Değişiklik | Olası risk | Azaltma |
|------------|------------|---------|
| HealthService taşıma | Readiness yanlış pozitif/negatif | Spec + staging `GET /health/ready` |
| JWT → AuthService | Module circular dependency | NestJS `forwardRef` yalnızca gerekirse; önce düz import dene |
| JWT → AuthService | Farklı user shape → guard kırılır | `select` alanları byte-level aynı |
| Private prisma | Derleme hatası dış kullanımda | `rg reportService.prisma` |
| Yeni testler | Yanlış güven hissi | Negatif senaryo zorunlu; controller guard testi bu fazda değil |

---

## 7. İlgili dosyalar

| Konu | Yol |
|------|-----|
| Veri erişimi tanımı | `docs/backend-data-access.md` |
| Stack | `docs/tech-stack.md` |
| Mimari kural | `.cursor/rules/project-architecture.mdc` |
| Güvenlik kuralları | `.cursor/rules/security-rules.mdc` |
| Test | `.cursor/rules/test-strategy.mdc` |
| Güvenlik fazı (ayrı) | `docs/phase-7-security-hardening.md` |
| Mevcut ihlal | `apps/api/src/app.controller.ts` |
| Mevcut ihlal | `apps/api/src/modules/auth/strategies/jwt.strategy.ts` |

---

## 8. Durum takibi

| ID | Başlık | Öncelik | Durum |
|----|--------|---------|--------|
| ARCH9-01 | HealthService | P0 | [x] |
| ARCH9-02 | JWT → AuthService | P0 | [x] |
| ARCH9-03 | ReportService private | P1 | [x] |
| ARCH9-04 | Servis birim testleri | P1 | [ ] |
| ARCH9-05 | Dokümantasyon uyumu | P1 | [x] |
| ARCH9-06 | Büyük servis bölme | P2 (opsiyonel) | [ ] |

---

## 9. Özet (mimar / ekip)

- Bu faz **Repository pattern getirmez**; tam tersine kodu yazılı **dokümana** hizalar.
- Güvenlik **sıkılaştırma fazı değildir**; **regresyon yapmayan** refactor’dur.
- Zorunlu iş: controller’dan Prisma kaldırma, JWT lookup tek kanal, encapsulation, test borcu (P1).
- En güvenli uygulama: küçük PR’lar, §2 ve §4 checklist, auth/permission endpoint’lerine dokunmadan katman taşıma.
