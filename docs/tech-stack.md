You are developing an enterprise-grade CRM System with a FIXED technology stack.

You are NOT allowed to change the stack unless explicitly instructed.

==============================
PROJECT OVERVIEW
==============================

- Application Type: CRM (Customer Relationship Management)
- Purpose: Managing customer records collected at trade fairs and exhibitions.
- Platforms: Web (Admin Panel) + Mobile (iOS & Android)
- Architecture: Monorepo — single repository, shared TypeScript codebase
- All three apps (API, Web, Mobile) use TypeScript as their primary language.

==============================
MONOREPO STRUCTURE (MANDATORY)
==============================

CRMProje/
├── apps/
│   ├── api/              # NestJS backend
│   ├── web/              # Next.js admin panel
│   └── mobile/           # React Native + Expo
├── packages/
│   └── shared/           # Shared types, Zod schemas, API client, utils
├── docs/                 # Project documentation
└── package.json          # NPM Workspaces

- Backend, Web, and Mobile MUST share types, validation schemas, and utilities via packages/shared.
- Do not duplicate type definitions across apps.
- Do not create separate repositories.

==============================
BACKEND STACK (MANDATORY)
==============================

- Node.js
- NestJS (NOT Express standalone)
- TypeScript (strict mode)
- PostgreSQL (local development, Supabase-ready for production)
- Prisma ORM
- JWT Authentication (access + refresh tokens via Passport.js)
- Zod Validation
- Argon2 for password hashing
- Redis (Upstash for production) — caching, rate limiting, session management
- Helmet — secure HTTP headers
- CORS — configured per environment

Backend must follow NestJS modular architecture:
Module → Controller → Service → Repository (Prisma)

No raw SQL in controllers or services.
No business logic in controllers.
No HTTP handling in services.

==============================
FRONTEND — WEB ADMIN PANEL (MANDATORY)
==============================

- Next.js 14+ (App Router)
- React
- TypeScript (strict mode)
- TailwindCSS
- shadcn/ui — accessible, enterprise-grade component library
- TanStack Query (React Query) — server state management and caching
- Axios — HTTP client
- React Hook Form + Zod — form management with shared validation schemas
- Zustand — lightweight global state (when needed)

Web frontend must consume backend via REST API only.
No direct database access from frontend.

==============================
FRONTEND — MOBILE APP (MANDATORY)
==============================

- React Native + Expo (SDK 52+)
- TypeScript (strict mode)
- Expo Router — file-based navigation
- NativeWind v4 — TailwindCSS for React Native
- React Native Reanimated — native thread animations
- React Native Skia — custom graphics and effects (when needed)
- TanStack Query — server state management
- Axios — HTTP client (shared instance with web via packages/shared)
- React Hook Form + Zod — shared validation schemas with backend and web
- Zustand — lightweight global state (when needed)

Mobile must consume backend via REST API only.
No direct database access from mobile.

==============================
DATABASE STRATEGY
==============================

- Development: Local PostgreSQL
- Staging/Production: Supabase (PostgreSQL) or any cloud PostgreSQL provider
- ORM: Prisma (mandatory, no raw SQL)
- Migration between local and cloud requires only DATABASE_URL change in .env
- Do not use Supabase Auth, Storage, or Realtime — custom implementations via NestJS.
- No vendor lock-in. Database layer is fully abstracted by Prisma.

==============================
SHARED PACKAGE (packages/shared)
==============================

This package contains code shared across all three TypeScript apps:

- TypeScript types and interfaces (API request/response shapes)
- Zod validation schemas
- API endpoint constants
- Utility functions
- Enums and constants

Do not duplicate any of these in individual apps.
Import from @crm/shared (or configured alias).

==============================
INFRASTRUCTURE & SERVICES
==============================

- Web Deployment: Vercel
- Backend Deployment: Railway or Render
- Redis: Upstash (serverless)
- File Storage: Cloudinary or AWS S3
- Email: Resend or SendGrid

==============================
GENERAL RULES
==============================

- Do not suggest alternative frameworks.
- Do not replace NestJS with Express.
- Do not replace Prisma with another ORM.
- Do not replace PostgreSQL with another database.
- Do not introduce Flutter, Swift, or Kotlin for mobile.
- Maintain scalable modular structure in all apps.
- Always follow enterprise best practices.
- All three apps must use TypeScript strict mode.
- Shared code must live in packages/shared, not be duplicated.