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
4. *(İsteğe bağlı)* API + Web’i **Docker** ile çalıştırmak: **`docs/deployment-and-env-strategy.md`** içindeki §0 ve §1b (compose komutları, `infra/app/.env.app`, port / CSP notları). **İmaj boyutu standartları ve doğrulama:** aynı dokümanda **§1c**; Cursor kuralı: `.cursor/rules/docker-images.mdc`.

## Proje Yapısı

```
CRMProje/
├── apps/
│   ├── api/          # NestJS backend
│   ├── web/          # Next.js admin paneli
│   └── mobile/       # React Native + Expo (Faz 2)
├── packages/
│   └── shared/       # Paylaşılan tipler, şemalar, yardımcılar
├── infra/            # Docker app stack, monitoring compose
├── docs/             # Dokümantasyon
│   ├── tech-stack.md
│   ├── phase-1-features.md
│   ├── environment-setup.md
│   └── deployment-and-env-strategy.md
└── .cursor/rules/    # Geliştirme kuralları (Cursor)
```

## Dokümantasyon

| Dosya                                                  | Açıklama                          |
| ------------------------------------------------------ | --------------------------------- |
| [docs/tech-stack.md](docs/tech-stack.md)               | Sabit teknoloji yığını            |
| [docs/phase-1-features.md](docs/phase-1-features.md)   | Faz 1 feature listesi (25 adet)   |
| [docs/environment-setup.md](docs/environment-setup.md) | Geliştirme ortamı kurulum rehberi |
| [docs/deployment-and-env-strategy.md](docs/deployment-and-env-strategy.md) | DEV/PROD farkları, Docker (crm-app), env checklist, CSP / canlıya geçiş |

Geliştirme kuralları (mimari, güvenlik, git, test, API tasarımı vb.) `.cursor/rules/` altındaki `.mdc` dosyalarında tanımlıdır.

## Geliştirme

- Feature’lar sırayla geliştirilir (F1 → F2 → …).
- Her feature için `feature/F{n}-kısa-açıklama` branch’i açılır, testler geçtikten sonra `main`’e merge edilir.
- Detaylar: [docs/phase-1-features.md](docs/phase-1-features.md) ve `.cursor/rules/git-conventions.mdc`

## Lisans

Proje kapalı kaynaklıdır.
