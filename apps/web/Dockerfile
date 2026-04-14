# syntax=docker/dockerfile:1
# Monorepo kökünden build: docker build -f apps/web/Dockerfile --build-arg NEXT_PUBLIC_API_URL=... .
#
# NEXT_PUBLIC_* build zamanında gömülür; tarayıcının erişebileceği tam API base URL verin.

FROM node:20-bookworm-slim AS builder
WORKDIR /app

ARG NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Paket kurulumu root; ardından Fortify (Default User Privilege): derleme npm node ile.
RUN apt-get update -y && apt-get install -y openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && chown node:node /app

USER node

COPY --chown=node:node package.json package-lock.json ./
COPY --chown=node:node packages/shared ./packages/shared
COPY --chown=node:node apps/web ./apps/web
COPY --chown=node:node apps/api/package.json ./apps/api/
COPY --chown=node:node apps/mobile/package.json ./apps/mobile/

# ECONNRESET / düşük bant genişliği: yeniden deneme + BuildKit npm cache
RUN npm config set fetch-retries 15 \
  && npm config set fetch-retry-mintimeout 20000 \
  && npm config set fetch-retry-maxtimeout 180000 \
  && npm config set fetch-timeout 600000 \
  && npm config set maxsockets 5

# Yalnızca Web + shared: API/mobil (Nest, Prisma, Expo) node_modules'e girmez — imaj boyutu.
RUN --mount=type=cache,target=/home/node/.npm,uid=1000,gid=1000 \
    npm ci -w @crm/web -w @crm/shared

RUN npm run build -w @crm/shared
RUN npm run build -w @crm/web

WORKDIR /app
RUN npm prune --omit=dev -w @crm/web -w @crm/shared

# Runner: Next standalone — tam node_modules kopyalanmaz (imaj boyutu).
FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN apt-get update -y && apt-get install -y openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static

# Resmi imajdaki node kullanıcısı (uid 1000) — Fortify: Default User Privilege
RUN chown -R node:node /app

USER node

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "apps/web/server.js"]
