# Runbook: Loki’de kimlik doğrulama olayları

**Amaç:** Başarısız giriş, hesap kilidi, refresh hatası gibi durumları **yapılandırılmış güvenlik logları** üzerinden aramak.

## Ön koşullar

- API `API_JSON_LOG_FILE` veya stdout → Promtail → Loki akışı çalışıyor (`docs/phase-8-monitoring.md` §4.5).
- Grafana’da Loki veri kaynağı; pano **CRM — Uygulama ve güvenlik logları** (`/d/crm-logs/crm-uygulama-ve-guvenlik-loglari`) veya Explore.

## Örnek LogQL

- Tüm güvenlik satırları (son 1 saat):

  `{job="api"} | json | logCategory="security"`

- Başarısız giriş denemeleri:

  `{job="api"} | json | event="auth.login.failure"`

- Refresh token yeniden kullanımı (reuse):

  `{job="api"} | json | event="auth.refresh.reuse_detected"`

- Belirli kullanıcı (ID biliniyorsa; `userId` etiket değil JSON alanı):

  `{job="api"} | json | userId="<KULLANICI_CUID>"`

## Notlar

- Log satırlarında **e-posta ve parola yoktur**; başarısız girişte çoğunlukla `reason` kodu (`invalid_credentials`, `mfa_phone_missing`, vb.) bulunur.
- HTTP access satırları `logCategory="access"`; `/auth/login` için `statusCode=401` ayrıca görülebilir — korelasyon için `requestId` kullanılabilir.
