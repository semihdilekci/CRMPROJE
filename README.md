# Fuar CRM

Fuarlarda tanışılan müşterilerin kayıtlarının tutulduğu kurumsal CRM uygulaması.

## Tech Stack

- **Backend:** NestJS, TypeScript, PostgreSQL, Prisma ORM
- **Web:** Next.js 14+ (App Router), React, TailwindCSS, shadcn/ui
- **Mobil:** React Native + Expo (Faz 2)
- **Paylaşılan:** Monorepo, `packages/shared` (tipler, Zod şemaları, utils)

Detaylı teknoloji listesi için: [docs/tech-stack.md](docs/tech-stack.md)

## Kurulum

1. Gereksinimler: Node.js v20+, PostgreSQL 15+, npm
2. Repoyu klonlayın ve bağımlılıkları kurun:
   ```bash
   git clone <repo-url> CRMProje
   cd CRMProje
   npm install
   ```
3. Veritabanı ve ortam değişkenleri için **kurulum rehberini** takip edin:  
   **[docs/environment-setup.md](docs/environment-setup.md)**

## Proje Yapısı

```
CRMProje/
├── apps/
│   ├── api/          # NestJS backend
│   ├── web/          # Next.js admin paneli
│   └── mobile/       # React Native + Expo (Faz 2)
├── packages/
│   └── shared/       # Paylaşılan tipler, şemalar, yardımcılar
├── docs/             # Dokümantasyon
│   ├── tech-stack.md
│   ├── phase-1-features.md
│   └── environment-setup.md
└── .cursor/rules/    # Geliştirme kuralları (Cursor)
```

## Dokümantasyon

| Dosya | Açıklama |
|-------|----------|
| [docs/tech-stack.md](docs/tech-stack.md) | Sabit teknoloji yığını |
| [docs/phase-1-features.md](docs/phase-1-features.md) | Faz 1 feature listesi (25 adet) |
| [docs/environment-setup.md](docs/environment-setup.md) | Geliştirme ortamı kurulum rehberi |

Geliştirme kuralları (mimari, güvenlik, git, test, API tasarımı vb.) `.cursor/rules/` altındaki `.mdc` dosyalarında tanımlıdır.

## Geliştirme

- Feature’lar sırayla geliştirilir (F1 → F2 → …).  
- Her feature için `feature/F{n}-kısa-açıklama` branch’i açılır, testler geçtikten sonra `main`’e merge edilir.  
- Detaylar: [docs/phase-1-features.md](docs/phase-1-features.md) ve `.cursor/rules/git-conventions.mdc`

## Lisans

Proje kapalı kaynaklıdır.
