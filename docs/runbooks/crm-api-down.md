# Runbook: CRM API erişilemiyor / readiness kırmızı

**Belirtiler:** Blackbox `blackbox-api-ready` probe başarısız; Grafana uyarısı `CRMApiReadinessDown`; web/mobil API hataları.

## Hızlı kontrol

1. **Süreç:** API host’ta çalışıyor mu? (`PORT` / `HOST` — `apps/api/.env`)
2. **Liveness:** `GET /api/v1/health` → 200 mü?
3. **Readiness:** `GET /api/v1/health/ready` → 200 mü? **503** ise PostgreSQL bağlantısı / `DATABASE_URL` / ağ.
4. **Prometheus:** `http://localhost:9090/targets` — `blackbox-api-ready` state.
5. **Log:** `logs/api.log` (JSON) veya API stdout — son 5xx / DB hataları.

## Olası nedenler

| Neden | Aksiyon |
|--------|---------|
| API süreci kapalı | `npm run dev -w apps/api` veya prod süreç yöneticisi |
| Yanlış port (probe) | `infra/monitoring/prometheus/prometheus.yml` hedefi `apps/api` `PORT` ile aynı olmalı |
| PostgreSQL kapalı / ağ | DB’yi ayağa kaldır; `DATABASE_URL` doğrula |
| Disk / OOM | Host kaynakları; container logları |

## Çözüm sonrası

- Readiness yeşile dönünce Blackbox `probe_success` 1 olur; Grafana uyarısı **Resolved** e-postası (SMTP açıksa) gönderebilir.
- Detaylı mimari: `docs/phase-8-monitoring.md`.
