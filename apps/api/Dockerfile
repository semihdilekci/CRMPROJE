# syntax=docker/dockerfile:1
# Monorepo kökünden build: docker build -f apps/api/Dockerfile .
#
# Çalışma cwd: /app/apps/api (uploads/, Prisma, statik dosyalar)

FROM node:20-bookworm-slim AS builder
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json tsconfig.json ./
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
COPY apps/web/package.json ./apps/web/
COPY apps/mobile/package.json ./apps/mobile/

# ECONNRESET / düşük bant genişliği: yeniden deneme + BuildKit npm cache
RUN npm config set fetch-retries 15 \
  && npm config set fetch-retry-mintimeout 20000 \
  && npm config set fetch-retry-maxtimeout 180000 \
  && npm config set fetch-timeout 600000 \
  && npm config set maxsockets 5

# Yalnızca API + shared: Next/mobil bağımlılıkları imaja girmez (imaj boyutu).
RUN --mount=type=cache,target=/root/.npm \
    npm ci -w @crm/api -w @crm/shared

RUN npm run build -w @crm/shared

WORKDIR /app/apps/api
RUN npx prisma generate
RUN npm run build

WORKDIR /app
RUN npm prune --omit=dev -w @crm/api -w @crm/shared

FROM node:20-bookworm-slim AS runner
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json
COPY --from=builder /app/apps/mobile/package.json ./apps/mobile/package.json
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/assets ./apps/api/assets

WORKDIR /app/apps/api

EXPOSE 3001

CMD ["node", "dist/main.js"]
