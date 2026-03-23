# Fuar CRM — Dashboard & Rapor Design System

Bu doküman, `docs/expo-crm-dashboard.html` referansına göre dashboard ve rapor sayfalarının görsel dili ile animasyon davranışlarını standartlar.

## Amaç

- Tüm dashboard/rapor ekranlarında aynı "premium glass" hissini korumak
- Sayfa açılışında kademeli giriş efekti kullanmak
- Veri yüklenirken "doldurma" hissi veren sayaç ve grafik animasyonları sunmak

## Tasarım Dili

### Stil Prensipleri

1. Glassmorphism tabanlı koyu tema kullanılır.
2. Vurgu dili mor + cyan gradienttir.
3. Bilgi yoğunluğu yüksek olsa da görsel hiyerarşi sade kalır.
4. Hareketler kısa, yumuşak ve dikkat dağıtmayan seviyede tutulur.

### Renk Tokenlari

| Token | Değer | Kullanım |
|---|---|---|
| `--bg` | `#030712` | Ana arka plan |
| `--accent` | `#8b5cf6` | Birincil vurgu |
| `--accent-to` | `#06b6d4` | İkincil vurgu |
| `--text` | `#f8fafc` | Ana metin |
| `--muted` | `rgba(248,250,252,0.55)` | Yardımcı metin |
| `--glass-bg` | `rgba(255,255,255,0.05)` | Kart yüzeyi |
| `--glass-border` | `rgba(255,255,255,0.12)` | Kart kenarlığı |
| `--green` | `#4ade80` | Pozitif metrik |
| `--orange` | `#fb923c` | Uyarı/orta önem |
| `--red` | `#f87171` | Negatif metrik |
| `--amber` | `#fbbf24` | Vurgu/ikincil KPI |

### Tipografi

- Başlık: `Playfair Display`
- Gövde/UI: `DM Sans`
- Dashboard başlıkları: 28px / 700
- KPI büyük değerleri: 30-34px / 700
- Yardımcı metinler: 10-13px aralığı

## Yerleşim Standartlari

- Topbar: `position: sticky`, blur arka plan, ince border
- Ana konteyner: `max-width: 1400px`, merkezde, yeterli iç boşluk
- KPI grid: masaüstünde 4 kolon
- İçerik grid: analitik kartlar + tablo + yardımcı kartlar
- Kart dili: `border-radius: 16px`, `backdrop-filter: blur(20px)`, `glass-bg`

## Dashboard Açılış Efekt Akışı (Zorunlu)

Sayfa ilk açıldığında aşağıdaki sıra uygulanır:

1. **Header giriş**: `fadeUp`, gecikme `~100ms`
2. **KPI kartları**: soldan sağa `fadeUp` (100ms aralıklı gecikme)
3. **Ana analitik kartlar**: `fadeUp` ile ikinci dalga
4. **Tablo satırları ve listeler**: `slideIn` veya `fadeUp` ile sıra sıra

Kural:
- Bir ekranda aynı anda en fazla 2 farklı giriş animasyonu kullan.
- Toplam açılış süresi 1.2s-1.8s bandını geçmesin.

## Veri Doldurma Efekti (Zorunlu)

Rapor ekranlarında veri hissi statik olmamalıdır. Aşağıdaki desenler kullanılır:

### 1) Sayaç Doldurma (Counter)

- KPI değerleri "0"dan hedef değere akar.
- Süre: `700ms-1200ms`
- Easing: `ease-out`
- Gecikme: kartın giriş gecikmesinden sonra başlar

Önerilen davranış:
- Büyük sayılar adım adım artar (`requestAnimationFrame`)
- Para birimi ve yüzde formatı animasyon sonrası doğru formatta sabitlenir

### 2) Dikey Çubuk Doldurma

- Sparkline ve column chart için `transform: scaleY(0 -> 1)`
- `transform-origin: bottom`
- Süre: `700ms-1000ms`

### 3) Yatay Çubuk Doldurma

- Pipeline/progress satırları için `transform: scaleX(0 -> 1)`
- `transform-origin: left`
- Süre: `800ms-1200ms`

### 4) Donut/Progress Ring Çizim Efekti

- `stroke-dasharray` + `stroke-dashoffset` ile çizim animasyonu
- Segmentler sırayla gelir (stagger)
- Toplam süre: `1200ms-1800ms`

## Animasyon Tokenlari

| Token | Değer |
|---|---|
| `--motion-fast` | `0.2s` |
| `--motion-normal` | `0.5s` |
| `--motion-slow` | `0.9s` |
| `--stagger-step` | `0.1s` |
| `--ease-standard` | `ease` |
| `--ease-emphasis` | `cubic-bezier(0.22, 1, 0.36, 1)` |

## Standart Keyframe Seti

Dashboard/rapor ekranlarında aşağıdaki isimler korunur:

- `fadeUp`: alt eksenden opaklığa geçiş
- `slideIn`: yatay satır girişi
- `barGrow`: dikey bar büyümesi
- `barH`: yatay bar büyümesi
- `dashAnim`: donut/ring stroke çizimi

Not: Keyframe adlarının sabit tutulması, bileşenler arası tekrar kullanılabilirliği artırır.

## Bileşen Bazlı Kurallar

### KPI Kartı

- Başlık + değer + trend + mini grafik düzeni korunur
- Değerde sayaç animasyonu zorunlu
- Mini barlarda kademeli gecikme zorunlu

### Analitik Kart

- Kart header ve body ayrımı yapılır
- Başlık 13px/600, subtitle 11px/muted
- Chart elemanlarında mutlaka doldurma animasyonu bulunur

### Tablo/Liste Kartı

- Satırlar tek tek girer (`slideIn` veya `fadeUp`)
- Satır gecikmeleri 60-120ms aralığında artar
- Border opaklığı düşük tutulur (`~0.05-0.08`)

### Durum Badge/Pill

- Pozitif: yeşil ton
- Nötr/planlı: mor veya gri ton
- Negatif: kırmızı ton
- Her badge düşük opak glass taban üzerinde görünmelidir

## Erişilebilirlik ve Performans

- Yalnızca `transform` ve `opacity` animasyonları tercih edilir.
- Uzun listelerde ilk 6-8 öğeden sonra animasyon sadeleştirilir.
- `prefers-reduced-motion` desteklenir; bu modda animasyonlar kapatılır veya anlık geçişe döner.
- Kontrast oranı düşük metinlerde `muted` kullanımını aşırıya kaçırma.

## Uygulama Kontrol Listesi

Dashboard/rapor sayfası tesliminden önce:

- [ ] Açılış sırası header -> KPI -> kartlar -> satırlar akışını izliyor
- [ ] KPI sayıları 0'dan doluyor
- [ ] Çubuk grafikler scale tabanlı doluyor
- [ ] Donut/ring segmentleri çizim animasyonuyla geliyor
- [ ] Renk ve tipografi tokenları bu dokümana uyuyor
- [ ] `prefers-reduced-motion` için güvenli davranış var

## Referanslar

- Tasarım örneği: `docs/expo-crm-dashboard.html`
- Genel stil token kaynakları: `apps/web/src/app/globals.css`
