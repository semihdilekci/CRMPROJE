# Backend Veri Erişimi

Bu belge, projedeki veri erişimi katmanını ve mimari uyumu tanımlar.
Tek kaynak olarak kullanılır; tüm kurallar ve AI araçları bu belgeye uyar.

---

## 1. Katman mimarisi (hedef ve mevcut durum)

```
HTTP isteği
  → Controller   (doğrulama, guard, yanıt formatı — Prisma inject edilmez)
  → Service      (iş kuralları — PrismaService inject edilir)
  → PrismaService → PostgreSQL (Prisma ORM)
```

**Önemli:** Controller katmanında `PrismaService` kullanımı yasaktır.
Her veritabanı erişimi yalnızca `*.service.ts` üzerinden geçer.

### Uygulanan istisnalar (ARCH9 sonrası)

| Önceki ihlal | Durum | Çözüm |
|---|---|---|
| `AppController` → `PrismaService` (readiness) | ✅ Giderildi | `HealthService.checkDatabaseConnection()` |
| `JwtStrategy` → `PrismaService` (user lookup) | ✅ Giderildi | `AuthService.findUserForJwtValidation()` |
| `ReportService.prisma` public encapsulation | ✅ Giderildi | `private readonly prisma` |

---

## 2. Dosya → Katman haritası

| Dosya | Katman | Prisma erişimi |
|---|---|---|
| `*.controller.ts` | HTTP katmanı | ❌ Hayır |
| `*.service.ts` | İş kuralları | ✅ `this.prisma.*` |
| `health/health.service.ts` | Altyapı | ✅ `$queryRaw SELECT 1` (sadece bağlantı testi) |
| `auth/strategies/jwt.strategy.ts` | Auth/Guard | ❌ Hayır — `AuthService.findUserForJwtValidation()` |
| `prisma/prisma.service.ts` | ORM sarmalayıcı | ✅ `PrismaClient` |

---

## 3. Health / Readiness yapısı (ARCH9-01)

`GET /health` ve `GET /health/ready` endpoint'leri `AppController` üzerinden çalışır.
Readiness kontrolü `HealthService` aracılığıyla yapılır:

```
AppController → HealthService.checkDatabaseConnection() → PrismaService.$queryRaw
```

**Güvenlik garantileri:**
- Yanıt gövdesinde DB host, hata kodu veya stack trace yoktur.
- Başarısız durum: `503 ServiceUnavailableException` + Türkçe genel mesaj.
- `HealthService` yalnızca `SELECT 1` sorgusu çalıştırır; domain tablolarına erişim yoktur.
- `@SkipThrottle()` ve auth gerektirmeme yük dengeleyici için korunmuştur.

---

## 4. JWT kullanıcı doğrulama kanalı (ARCH9-02)

Token doğrulamasında kullanıcı yükleme yalnızca `AuthService` üzerinden yapılır:

```
JwtStrategy.validate(payload) → AuthService.findUserForJwtValidation(userId)
                                  → PrismaService.user.findUnique(select: id, email, name, role, createdAt, updatedAt)
```

**Neden tek kanal?**
- Kullanıcı arama mantığı tek yerde → silinmiş/pasif kullanıcı kontrolü tutarlı.
- `JwtStrategy`'de `PrismaService` bağımlılığı kaldırıldı.
- `select` alanları `AuthService` içinde sabitlendi; guard'ların beklediği user shape korunur.
- Yanıtta `password` alanı kesinlikle yoktur.

---

## 5. Kullanılmayan pattern

- Domain başına `fair.repository.ts`, `IFairRepository` vb. **yoktur** ve Phase 1 kapsamında **eklenmez**.
- Bu, DDD/Clean Architecture'daki Repository pattern değildir.
- `Service → Repository (Prisma)` ifadesi eski dokümanlarda yanıltıcıydı; güncel ifade: `Service → PrismaService (data access)`.

---

## 6. "Repository" kelimesinin iki anlamı

| Bağlam | Anlam | Bu projede |
|---|---|---|
| Git repository | Monorepo kökü (`CRMProje/`) | Evet — tek repo |
| Repository (DDD) | Veri erişimini soyutlayan sınıf/arayüz | **Hayır** |

---

## 7. Test

Birim testlerde `PrismaService` mock'lanır (`*.service.spec.ts`). Ayrı repository arayüzü gerekmez.

```typescript
// Örnek mock pattern
const prisma = {
  user: { findUnique: jest.fn(), create: jest.fn() },
  fair: { findMany: jest.fn() },
};
```

`HealthService` ve `AuthService.findUserForJwtValidation` için özel test kapsamı:
- `health.service.ts` → `app.controller.spec.ts` — `HealthService` mock'u ile doğrulanır.
- `findUserForJwtValidation` → `auth.service.spec.ts` — kullanıcı bulundu / bulunamadı senaryoları.

---

## 8. Şema taşınabilirliği

Prisma şema ve migration'ları PostgreSQL sağlayıcıları arasında (`DATABASE_URL`) taşınabilir.
Servis katmanı Prisma client API'sine yazılır; ORM değiştirmek ayrı bir mimari karar gerektirir (`docs/tech-stack.md`).

---

## 9. İlgili kaynaklar

| Konu | Kaynak |
|---|---|
| Stack ve monorepo kuralları | `docs/tech-stack.md` |
| ARCH9 iş paketleri ve güvenlik checklist | `docs/phase-9-backend-data-access-alignment.md` |
| NestJS katmanları | `.cursor/rules/project-architecture.mdc` |
| Prisma şema/sorgu kuralları | `.cursor/rules/database-conventions.mdc` |
| `PrismaService` mock stratejisi | `.cursor/rules/test-strategy.mdc` |
| Güvenlik kuralları | `.cursor/rules/security-rules.mdc` |
