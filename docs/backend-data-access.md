# Backend veri erişimi (Phase 1)

Bu belge, mimari incelemelerde karışan **“Repository”** terimini netleştirir ve kodla uyumlu tek kaynak tanımı sağlar.

## Katmanlar

```
HTTP isteği
  → Controller   (doğrulama, guard, yanıt formatı; Prisma yok)
  → Service      (iş kuralları; PrismaService inject)
  → PrismaService → PostgreSQL (Prisma ORM)
```

Örnek: `apps/api/src/modules/fair/fair.service.ts` içinde `constructor(private readonly prisma: PrismaService)`.

## Kullanılmayan pattern

- Domain başına `fair.repository.ts`, `IFairRepository` vb. **yoktur** ve Phase 1 kapsamında **eklenmez**.
- Bu, DDD/Clean Architecture’daki **Repository pattern** değildir.

## “Repository” kelimesinin iki anlamı

| Bağlam | Anlam | Bu projede |
|--------|--------|------------|
| Git repository | Monorepo kökü (`CRMProje/`) | Evet — tek repo |
| Repository (DDD) | Veri erişimini soyutlayan sınıf/arayüz | **Hayır** |

Eski dokümanlardaki `Service → Repository (Prisma)` ifadesi yanıltıcıydı; güncel ifade: **`Service → PrismaService (data access)`**.

## Test

Birim testlerde `PrismaService` mock’lanır (`fair.service.spec.ts` vb.). Ayrı repository arayüzü gerekmez.

## Şema taşınabilirliği

Prisma şema ve migration’ları PostgreSQL sağlayıcıları arasında (`DATABASE_URL`) taşınabilir. Servis katmanı ise Prisma client API’sine yazılır; ORM değiştirmek ayrı bir mimari karar ve onay gerektirir (`docs/tech-stack.md`).

## İlgili kurallar

- `docs/tech-stack.md` — stack ve monorepo kuralları
- `.cursor/rules/project-architecture.mdc` — NestJS katmanları
- `.cursor/rules/database-conventions.mdc` — Prisma şema/sorgu kuralları
- `.cursor/rules/test-strategy.mdc` — `PrismaService` mock
