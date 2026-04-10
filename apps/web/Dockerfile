# syntax=docker/dockerfile:1
# Monorepo kökünden build: docker build -f apps/web/Dockerfile --build-arg NEXT_PUBLIC_API_URL=... .
#
# NEXT_PUBLIC_* build zamanında gömülür; tarayıcının erişebileceği tam API base URL verin.

FROM node:20-bookworm-slim AS builder
WORKDIR /app

ARG NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN apt-get update -y && apt-get install -y openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web
COPY apps/api/package.json ./apps/api/
COPY apps/mobile/package.json ./apps/mobile/

RUN npm ci

RUN npm run build -w @crm/shared
RUN npm run build -w @crm/web

WORKDIR /app
RUN npm prune --omit=dev

FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN apt-get update -y && apt-get install -y openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/apps/web ./apps/web
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/mobile/package.json ./apps/mobile/package.json

WORKDIR /app/apps/web

EXPOSE 3000

CMD ["npx", "next", "start", "-H", "0.0.0.0", "-p", "3000"]
