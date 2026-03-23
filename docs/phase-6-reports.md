# Phase 6 — Raporlama & Dashboard Modülü

## Genel Bakış

Bu faz, CRM sistemine kapsamlı bir raporlama altyapısı ekler. **7 kategori, 17 rapor** dashboard'u geliştirilecektir.
Raporlar hem Web hem de Mobil uygulamada kullanılacak olup, **önce Web geliştirmesi** yapılacaktır.

---

## Geliştirme Task Listesi & Feature Planı

Her Feature bir git feature branch'inde, tek bir chat oturumunda geliştirilir.
Feature numaralandırması: R1, R2, ... (Reports Phase)

### Her Feature İçin Standart Akış

```
1. git checkout main && git pull origin main
2. git checkout -b feature/R{n}-kısa-açıklama
3. Geliştirme (aşağıdaki task'ler)
4. Smoke test (build + lint + temel çalışma kontrolü)
5. Geliştirici testi → onay beklenir
6. git checkout main && git merge feature/R{n}-kısa-açıklama
7. git push origin main
8. git branch -d feature/R{n}-kısa-açıklama
```

---

### Feature R1 — Altyapı: Shared Tipler, Backend Report Modülü, Frontend Grafik Bileşenleri
**Branch:** `feature/R1-report-infrastructure`
**Bağımlılık:** Yok (ilk feature)
**Kapsam:** Tüm raporların kullanacağı ortak altyapı

- [x] **R1.1** `packages/shared` — Rapor response tipleri tanımla (`ReportFilterParams`, her rapor için response interface'leri)
- [x] **R1.2** `apps/api` — `ReportModule` oluştur (module + controller + service iskelet yapısı)
- [x] **R1.3** `apps/api` — Rapor endpoint'leri için ortak yardımcı fonksiyonlar (tarih aralığı filtreleme, bütçe aggregation, ağırlıklı pipeline hesabı)
- [x] **R1.4** `apps/web` — Recharts kütüphanesi kur ve grafik sarmalayıcı bileşenler oluştur:
  - `ReportBarChart`, `ReportLineChart`, `ReportPieChart`, `ReportAreaChart`
  - `ReportScatterChart`, `ReportHeatmap`, `ReportTreemap`
  - `ReportGauge`, `ReportFunnel`
- [x] **R1.5** `apps/web` — Ortak dashboard bileşenleri oluştur:
  - `KpiCard` (büyük sayı + değişim oranı + sparkline desteği)
  - `ReportFilterBar` (tarih aralığı, fuar seçimi, çoklu filtre desteği)
  - `ReportTable` (sıralanabilir, filtrelenebilir veri tablosu)
  - `Leaderboard` (sıralı liste bileşeni)
  - `ActivityFeed` (kronolojik olay akışı)
  - `ProgressBarGroup` (çoklu progress bar)
- [x] **R1.6** `apps/web` — Rapor katalog sayfası (`/reports`): kategori başlıkları altında rapor kartları
- [x] **R1.7** `apps/web` — Ortak rapor sayfa layout'u (`ReportDashboardLayout`): başlık, filtreler, grid düzen, export butonları (PDF/CSV)
- [x] **R1.8** Smoke test: build + lint + rapor katalog sayfası görsel kontrol
  Durum: [x]

---

### Feature R2 — Yönetici Özeti: Genel Durum Dashboard'u
**Branch:** `feature/R2-executive-summary`
**Bağımlılık:** R1
**Kapsam:** 1 rapor (Rapor 1.1) — Backend endpoint + Frontend dashboard

- [x] **R2.1** `apps/api` — `GET /api/v1/reports/executive-summary` endpoint: KPI hesaplamaları (aktif fuar, açık fırsat, pipeline değeri, kazanılan gelir, dönüşüm oranı, toplam müşteri)
- [x] **R2.2** `apps/api` — Aylık gelir trendi hesaplama (son 12 ay)
- [x] **R2.3** `apps/api` — Pipeline aşama dağılımı ve dönüşüm oranı dağılımı aggregation
- [x] **R2.4** `apps/api` — En aktif 5 fuar ve en değerli 5 müşteri leaderboard verileri
- [x] **R2.5** `apps/web` — `useExecutiveSummary` hook
- [x] **R2.6** `apps/web` — Executive Summary dashboard sayfası: 6 KPI kartı + çizgi grafik + bar grafik + pasta grafik + sparkline + 2 leaderboard + tablo
- [x] **R2.7** Smoke test: endpoint yanıtı + dashboard görsel kontrol
  Durum: [x]

---

### Feature R3 — Fuar Performans Raporları (3 Rapor)
**Branch:** `feature/R3-fair-performance`
**Bağımlılık:** R1
**Kapsam:** Rapor 2.1, 2.2, 2.3 — Ortak fuar verisini paylaşan 3 rapor

- [x] **R3.1** `apps/api` — `GET /api/v1/reports/fair-performance` endpoint: fuar bazlı metrikler (fırsat sayıları, pipeline değeri, dönüşüm oranı, tonaj), filtreler (tarih aralığı, durum, oluşturan)
- [x] **R3.2** `apps/api` — `GET /api/v1/reports/fair-comparison` endpoint: seçili fuarların detaylı karşılaştırma verileri, fuar×aşama ve fuar×ürün matrisleri
- [x] **R3.3** `apps/api` — `GET /api/v1/reports/fair-targets` endpoint: hedef vs. gerçekleşme verileri (bütçe, tonaj, lead)
- [x] **R3.4** `apps/web` — `useFairPerformance`, `useFairComparison`, `useFairTargets` hook'ları
- [x] **R3.5** `apps/web` — Fuar Genel Performans dashboard sayfası: KPI kartları + bar grafikler + scatter plot + veri tablosu
- [x] **R3.6** `apps/web` — Fuar Karşılaştırma dashboard sayfası: grouped bar grafikler + 2 heatmap + karşılaştırma tablosu
- [x] **R3.7** `apps/web` — Fuar Hedef Takibi dashboard sayfası: 3 gauge + progress bar grubu + grouped bar + veri tablosu
- [x] **R3.8** Smoke test: 3 endpoint yanıtı + 3 dashboard görsel kontrol
  Durum: [x]

---

### Feature R4 — Satış Pipeline Raporları (3 Rapor)
**Branch:** `feature/R4-sales-pipeline`
**Bağımlılık:** R1
**Kapsam:** Rapor 3.1, 3.2, 3.3 — Pipeline ve StageLog verisini yoğun kullanan 3 rapor

- [x] **R4.1** `apps/api` — `GET /api/v1/reports/pipeline-overview` endpoint: aşama bazlı fırsat sayıları ve değerleri, funnel verisi, dönüşüm oranı dağılımı, treemap verisi
- [x] **R4.2** `apps/api` — `GET /api/v1/reports/pipeline-velocity` endpoint: StageLog tarihlerinden aşamalar arası ortalama/medyan geçiş süreleri, satış döngüsü süresi, en uzun bekleyen fırsat, fuar×aşama süre matrisi
- [x] **R4.3** `apps/api` — `GET /api/v1/reports/win-loss` endpoint: kazanma/kayıp oranları, lossReason dağılımı, aylık kazanma trendi, fuar ve conversionRate bazlı başarı oranları
- [x] **R4.4** `apps/web` — `usePipelineOverview`, `usePipelineVelocity`, `useWinLoss` hook'ları
- [x] **R4.5** `apps/web` — Pipeline Genel Bakış dashboard sayfası: KPI kartları + funnel bar + stacked bar + 2 pasta + treemap + veri tablosu
- [x] **R4.6** `apps/web` — Pipeline Hız Analizi dashboard sayfası: KPI kartları + bar grafik + çizgi grafik + scatter plot + heatmap + yavaş fırsatlar tablosu
- [x] **R4.7** `apps/web` — Kazanma/Kaybetme Analizi dashboard sayfası: KPI kartları + donut + bar grafikler + çizgi grafik + stacked bar + 2 veri tablosu
- [x] **R4.8** Smoke test: 3 endpoint yanıtı + 3 dashboard görsel kontrol
  Durum: [x]

---

### Feature R5 — Gelir & Finansal Raporlar (2 Rapor)
**Branch:** `feature/R5-revenue-financial`
**Bağımlılık:** R1
**Kapsam:** Rapor 4.1, 4.2 — Bütçe ve gelir odaklı 2 rapor

- [x] **R5.1** `apps/api` — `GET /api/v1/reports/revenue` endpoint: kazanılan gelir aggregation (fuar, ürün, müşteri, para birimi bazlı), aylık gelir trendi, ortalama fırsat değeri trendi
- [x] **R5.2** `apps/api` — `GET /api/v1/reports/forecast` endpoint: ağırlıklı pipeline hesabı (aşama ağırlığı × conversionRate çarpanı × bütçe), tahmini kazanma sayısı
- [x] **R5.3** `apps/web` — `useRevenue`, `useForecast` hook'ları
- [x] **R5.4** `apps/web` — Gelir Analizi dashboard sayfası: KPI kartları + alan grafik + bar grafikler + pasta + treemap + çizgi grafik + veri tablosu
- [x] **R5.5** `apps/web` — Bütçe Tahmini dashboard sayfası: KPI kartları + stacked bar + grouped bar + gauge + ağırlıklı pipeline tablosu
- [x] **R5.6** Smoke test: 2 endpoint yanıtı + 2 dashboard görsel kontrol
  Durum: [x]

---

### Feature R6 — Müşteri Raporları (3 Rapor)
**Branch:** `feature/R6-customer-reports`
**Bağımlılık:** R1
**Kapsam:** Rapor 5.1, 5.2, 5.3 — Müşteri analizi ve yaşam döngüsü

- [x] **R6.1** `apps/api` — `GET /api/v1/reports/customer-overview` endpoint: müşteri KPI'ları, aylık yeni müşteri trendi, müşteri durum dağılımı, portföy değer verisi
- [x] **R6.2** `apps/api` — `GET /api/v1/reports/customer-segmentation` endpoint: değer vs. fırsat scatter verisi, top müşteriler, fuar bazlı müşteri dağılımı, müşteri×fuar matrisi
- [x] **R6.3** `apps/api` — `GET /api/v1/reports/customer-lifecycle` endpoint: tekrarlayan müşteri analizi, hareketsiz müşteri tespiti (90+ gün), fuar katılım sıklığı, yaşam boyu değer trendi, son etkileşimler
- [x] **R6.4** `apps/web` — `useCustomerOverview`, `useCustomerSegmentation`, `useCustomerLifecycle` hook'ları
- [x] **R6.5** `apps/web` — Müşteri Genel Bakış dashboard sayfası: KPI kartları + çizgi grafik + bar grafik + pasta + treemap + veri tablosu
- [x] **R6.6** `apps/web` — Müşteri Segmentasyonu dashboard sayfası: scatter plot + bar grafikler + pasta + heatmap + veri tablosu
- [x] **R6.7** `apps/web` — Müşteri Yaşam Döngüsü dashboard sayfası: KPI kartları + bar grafik + çizgi grafik + leaderboard + hareketsiz müşteri tablosu + activity feed
- [x] **R6.8** Smoke test: 3 endpoint yanıtı + 3 dashboard görsel kontrol
  Durum: [x]

---

### Feature R7 — Ürün Raporları (2 Rapor)
**Branch:** `feature/R7-product-reports`
**Bağımlılık:** R1
**Kapsam:** Rapor 6.1, 6.2 — Ürün talep ve fuar matrisi

- [x] **R7.1** `apps/api` — `GET /api/v1/reports/product-analysis` endpoint: ürün popülerlik sıralaması, tonaj dağılımı, aylık talep trendi (top 5 ürün), ürün detay metrikleri
- [x] **R7.2** `apps/api` — `GET /api/v1/reports/product-fair-matrix` endpoint: ürün×fuar matrisi (fırsat sayısı ve tonaj), fuar bazlı top ürünler
- [x] **R7.3** `apps/web` — `useProductAnalysis`, `useProductFairMatrix` hook'ları
- [x] **R7.4** `apps/web` — Ürün Talep & Performans dashboard sayfası: KPI kartları + bar grafikler + pasta + treemap + çizgi grafik + veri tablosu
- [x] **R7.5** `apps/web` — Ürün-Fuar Performans Matrisi dashboard sayfası: 2 heatmap + grouped bar + stacked bar + veri tablosu
- [x] **R7.6** Smoke test: 2 endpoint yanıtı + 2 dashboard görsel kontrol
  Durum: [x]

---

### Feature R8 — Ekip & Kullanıcı Performans Raporları (3 Rapor)
**Branch:** `feature/R8-team-performance`
**Bağımlılık:** R1
**Kapsam:** Rapor 7.1, 7.2, 7.3 — Ekip, bireysel ve aktivite analizi

- [x] **R8.1** `apps/api` — `GET /api/v1/reports/team-performance` endpoint: ekip bazlı fırsat sayıları, kazanma oranları, gelir (User.teamId + Fair.createdById üzerinden)
- [x] **R8.2** `apps/api` — `GET /api/v1/reports/individual-performance` endpoint: kullanıcı bazlı metrikler, leaderboard sıralaması, kişisel trend (son 6 ay)
- [x] **R8.3** `apps/api` — `GET /api/v1/reports/activity-analysis` endpoint: StageLog + OpportunityNote + AuditLog üzerinden aktivite aggregation, gün×saat heatmap verisi, aktivite tipi dağılımı
- [x] **R8.4** `apps/web` — `useTeamPerformance`, `useIndividualPerformance`, `useActivityAnalysis` hook'ları
- [x] **R8.5** `apps/web` — Ekip Performans dashboard sayfası: KPI kartları + grouped bar grafikler + leaderboard + veri tablosu
- [x] **R8.6** `apps/web` — Bireysel Performans dashboard sayfası: leaderboard + bar grafikler + sparkline satırlar + scatter plot + veri tablosu
- [x] **R8.7** `apps/web` — Aktivite Analizi dashboard sayfası: KPI kartları + çizgi grafik + heatmap + stacked bar + bar grafik + activity feed + veri tablosu
- [x] **R8.8** Smoke test: 3 endpoint yanıtı + 3 dashboard görsel kontrol
  Durum: [x]

---

### Feature R9 — Export, Polish & Mobil Hazırlık
**Branch:** `feature/R9-export-polish`
**Bağımlılık:** R2–R8
**Kapsam:** Tüm raporlara PDF/CSV export, responsive iyileştirme, mobil rapor ekranı hazırlığı

- [x] **R9.1** `apps/web` — PDF export altyapısı (dashboard ekran görüntüsü → PDF)
- [x] **R9.2** `apps/web` — CSV export altyapısı (tablo verisini CSV dosyasına dönüştürme)
- [x] **R9.3** `apps/web` — Tüm dashboard sayfalarına export butonları entegre et
- [x] **R9.4** `apps/web` — Responsive düzen iyileştirmesi (tablet: 2 sütun, mobil: tek sütun)
- [x] **R9.5** `apps/web` — Boş veri durumları (empty state) ve yükleme durumları (skeleton) tüm raporlarda kontrol
- [x] **R9.6** `apps/mobile` — Mobil rapor katalog sayfası ve temel dashboard görünümü hazırlığı (Phase 6 mobil scope tanımı)
- [x] **R9.7** Smoke test: tüm export fonksiyonları + responsive kontrol
  Durum: [x]

---

## Bağımlılık Grafiği

```
R1 (Altyapı)
├── R2 (Yönetici Özeti)
├── R3 (Fuar Performans)
├── R4 (Satış Pipeline)
├── R5 (Gelir & Finans)
├── R6 (Müşteri)
├── R7 (Ürün)
├── R8 (Ekip & Performans)
└── R9 (Export & Polish) ← R2–R8 tamamlandıktan sonra
```

R2–R8 arası sıra zorunluluğu yoktur, ancak önerilen geliştirme sırası numaralandırmaya göredir. R1 mutlaka ilk, R9 mutlaka en son yapılır.

---

## Raporlar Ekranı — Kullanıcı Deneyimi

### Ana Raporlar Sayfası (`/reports`)

Kullanıcı **üst menüden (top bar)** **Raporlar**'a tıkladığında, kart görünümü ile düzenlenmiş bir rapor kataloğu açılır.

**Yapı:**
- Sayfanın üst kısmında genel bir başlık ve kısa açıklama yer alır.
- Raporlar **kategorilere** ayrılır. Her kategori bir başlık altında gösterilir.
- Her rapor bir **kart** olarak listelenir. Kartta:
  - Rapor adı (başlık)
  - Kısa açıklama (1-2 cümle, raporun ne gösterdiği)
  - İlgili bir ikon
- Karta tıklanınca ilgili raporun **dashboard sayfası** açılır.

### Rapor Dashboard Sayfası (`/reports/:slug`)

Her rapor kartına tıklanınca açılan tam sayfa dashboard:

- **En üstte:** Raporun başlığı, kısa açıklaması ve bağlamsal **filtreler**.
  - Filtreler rapora göre değişir (fuar seçimi, tarih aralığı, müşteri, ürün, aşama, vb.).
  - Filtreler uygulandığında tüm dashboard elementleri güncellenir.
- **Gövde:** Raporun içeriğine göre düzenlenmiş dashboard elementleri:
  - KPI kartları (üst bant)
  - Grafikler (çizgi, bar, pasta, alan, scatter, heatmap, treemap)
  - Gauge / Progress bar elementleri
  - Veri tabloları (sıralanabilir, filtrelenebilir)
  - Leaderboard / Sıralama listeleri
  - Aktivite akışları (feed)
- **Export:** Her dashboard'un sağ üst köşesinde raporu PDF veya CSV olarak dışa aktarma butonu.

---

## Rapor Kategorileri ve Detayları

---

## Kategori 1: Yönetici Özeti (Executive Summary)

**Açıklama:** Üst yönetim ve satış direktörleri için tek bir bakışta tüm operasyonun durumunu gösteren özet dashboard.

---

### Rapor 1.1: Genel Durum Dashboard'u

**Amaç:** Satış operasyonunun anlık fotoğrafı. Patron veya direktör açtığında tüm kritik metrikleri tek sayfada görmeli.

**Filtreler:**
- Tarih aralığı (bu ay / bu çeyrek / bu yıl / özel aralık)

**Dashboard Elementleri:**

| # | Element Tipi | Veri | Açıklama |
|---|-------------|------|----------|
| 1 | **KPI Kartı** | Toplam Aktif Fuar | Şu an devam eden fuarların sayısı |
| 2 | **KPI Kartı** | Toplam Açık Fırsat | Pipeline'daki terminal olmayan fırsatlar |
| 3 | **KPI Kartı** | Toplam Pipeline Değeri | Açık fırsatların toplam bütçe değeri (TRY karşılığı) |
| 4 | **KPI Kartı** | Kazanılan Gelir | `satisa_donustu` aşamasındaki fırsatların toplam değeri |
| 5 | **KPI Kartı** | Genel Dönüşüm Oranı (%) | Kazanılan / Toplam fırsat (dönem içi) + önceki döneme göre değişim |
| 6 | **KPI Kartı** | Toplam Müşteri | Sistemdeki benzersiz müşteri sayısı |
| 7 | **Çizgi Grafik** | Aylık Kazanılan Gelir Trendi | Son 12 ay kazanılan gelir çizgisi. Trendi gösterir. |
| 8 | **Bar Grafik (yatay)** | Pipeline Aşama Dağılımı | Her aşamadaki fırsat sayısı (funnel benzeri). Tanışma → Toplantı → Teklif → Sözleşme → Satışa Dönüştü / Olumsuz |
| 9 | **Pasta Grafik** | Dönüşüm Oranı Dağılımı | Fırsatların conversionRate alanına göre dağılımı (Çok Yüksek, Yüksek, Orta, Düşük, Çok Düşük) |
| 10 | **Sparkline KPI** | Bu Ayki Yeni Fırsat Trendi | Günlük oluşturulan fırsat sayısı mini çizgi grafik |
| 11 | **Leaderboard** | En Aktif 5 Fuar | Açık fırsat sayısına göre sıralı fuar listesi |
| 12 | **Leaderboard** | En Değerli 5 Müşteri | Toplam bütçe değerine göre sıralı müşteri listesi |
| 13 | **Veri Tablosu** | Son Kazanılan Fırsatlar | Son 10 "satışa dönüştü" fırsat: müşteri, fuar, değer, tarih |

---

## Kategori 2: Fuar Performans Raporları

**Açıklama:** Fuarların verimliliğini, hedef gerçekleşmelerini ve birbirleriyle kıyaslamasını sağlayan raporlar. Hangi fuara katılmaya devam etmeliyiz, hangisi verimsiz?

---

### Rapor 2.1: Fuar Genel Performans

**Amaç:** Tüm fuarların performansını tek ekranda karşılaştırmalı görmek. Hangi fuar en çok fırsat üretiyor, hangisi en yüksek gelir getiriyor?

**Filtreler:**
- Fuar durumu: Aktif / Geçmiş / Tümü
- Tarih aralığı (fuar başlangıç tarihine göre)
- Oluşturan kullanıcı

**Dashboard Elementleri:**

| # | Element Tipi | Veri | Açıklama |
|---|-------------|------|----------|
| 1 | **KPI Kartı** | Toplam Fuar Sayısı | Filtreye uygun fuarların toplamı |
| 2 | **KPI Kartı** | Toplam Fırsat | Tüm fuarlardan toplam fırsat |
| 3 | **KPI Kartı** | Toplam Kazanılan Gelir | Tüm fuarlardan kazanılan toplam |
| 4 | **KPI Kartı** | Ortalama Dönüşüm Oranı (%) | Tüm fuarların ağırlıklı ortalaması |
| 5 | **Bar Grafik (dikey)** | Fuar Bazlı Fırsat Sayısı | Her fuarın toplam / kazanılan / kaybedilen fırsat sayısı (stacked veya grouped bar) |
| 6 | **Bar Grafik (dikey)** | Fuar Bazlı Pipeline Değeri | Her fuarın toplam pipeline + kazanılan gelir değeri |
| 7 | **Bar Grafik (yatay)** | Fuar Bazlı Dönüşüm Oranı | Fuarlar dönüşüm oranına göre sıralı |
| 8 | **Scatter Plot** | Fırsat Sayısı vs. Kazanılan Gelir | Her fuar bir nokta; verimli fuarlar sağ üstte, verimsizler sol altta. Nokta boyutu: toplam fırsat sayısı |
| 9 | **Veri Tablosu** | Fuar Detay Tablosu | Sıralanabilir: Fuar Adı, Tarih, Fırsat Sayısı, Kazanılan, Kaybedilen, Açık, Pipeline Değeri, Kazanılan Gelir, Dönüşüm Oranı, Tonaj |

---

### Rapor 2.2: Fuar Karşılaştırma

**Amaç:** Seçilen 2-5 fuarı yan yana karşılaştırmak. Direktör ve patron için "hangi fuara tekrar katılalım?" sorusunun cevabı.

**Filtreler:**
- Fuar seçimi (multi-select, min 2, max 5 fuar)

**Dashboard Elementleri:**

| # | Element Tipi | Veri | Açıklama |
|---|-------------|------|----------|
| 1 | **Grouped Bar Grafik** | Karşılaştırma: Fırsat Sayıları | Seçili fuarların toplam / kazanılan / kaybedilen / açık fırsat sayıları yan yana |
| 2 | **Grouped Bar Grafik** | Karşılaştırma: Gelir | Seçili fuarların pipeline değeri ve kazanılan gelir yan yana |
| 3 | **Grouped Bar Grafik** | Karşılaştırma: Tonaj | Seçili fuarların toplam tonaj ve kazanılan tonaj yan yana |
| 4 | **Grouped Bar Grafik** | Karşılaştırma: Dönüşüm Oranı | Seçili fuarların dönüşüm oranları yan yana |
| 5 | **Heatmap** | Fuar × Aşama Matrisi | Satırlar: seçili fuarlar, Sütunlar: pipeline aşamaları, Hücre: fırsat sayısı. Renk yoğunluğu. |
| 6 | **Heatmap** | Fuar × Ürün Matrisi | Satırlar: seçili fuarlar, Sütunlar: ürünler, Hücre: talep/tonaj yoğunluğu |
| 7 | **Veri Tablosu** | Karşılaştırma Özet Tablosu | Tüm metrikler satır satır: her sütun bir fuar. Fırsat sayısı, dönüşüm oranı, gelir, tonaj, lead hedef gerçekleşme, ortalama fırsat değeri |

---

### Rapor 2.3: Fuar Hedef Takibi

**Amaç:** Fuarlara tanımlanan hedeflerin (bütçe, tonaj, lead sayısı) gerçekleşme durumlarını izlemek. Hedeflere ne kadar yakınız?

**Filtreler:**
- Fuar seçimi (tek veya multi-select)
- Fuar durumu: Aktif / Geçmiş / Tümü

**Dashboard Elementleri:**

| # | Element Tipi | Veri | Açıklama |
|---|-------------|------|----------|
| 1 | **Gauge (Kadran)** | Bütçe Hedef Gerçekleşme (%) | Seçili fuarın kazanılan gelir / hedef bütçe oranı. Yeşil-sarı-kırmızı bölgeler. |
| 2 | **Gauge (Kadran)** | Tonaj Hedef Gerçekleşme (%) | Kazanılan tonaj / hedef tonaj |
| 3 | **Gauge (Kadran)** | Lead Sayısı Hedef Gerçekleşme (%) | Toplam fırsat / hedef lead sayısı |
| 4 | **Progress Bar Grubu** | Tüm Fuarlar Hedef Karşılaştırma | Her fuar için 3 progress bar (bütçe, tonaj, lead). Fuarlar alt alta. |
| 5 | **Bar Grafik (grouped)** | Hedef vs. Gerçekleşen Bütçe | Her fuar için hedef ve gerçekleşen değerler yan yana |
| 6 | **Bar Grafik (grouped)** | Hedef vs. Gerçekleşen Tonaj | Her fuar için hedef ve gerçekleşen tonaj yan yana |
| 7 | **KPI Kartı** | Ortalama Hedef Gerçekleşme (%) | Tüm fuarların ortalama hedef gerçekleşme yüzdesi |
| 8 | **Veri Tablosu** | Hedef Detay Tablosu | Fuar Adı, Hedef Bütçe, Gerçekleşen Bütçe, %, Hedef Tonaj, Gerçekleşen Tonaj, %, Hedef Lead, Gerçekleşen Lead, % |

---

## Kategori 3: Satış Pipeline Raporları

**Açıklama:** Satış hunisinin durumu, fırsatların aşamalar arasındaki akışı, darboğazlar ve kayıp analizi. Satış yöneticisinin en kritik raporları.

---

### Rapor 3.1: Pipeline Genel Bakış

**Amaç:** Pipeline'ın anlık durumunu görmek. Hangi aşamada kaç fırsat var, toplam değer ne, darboğazlar nerede?

**Filtreler:**
- Fuar (multi-select veya tümü)
- Dönüşüm oranı (very_high, high, medium, low, very_low)
- Tarih aralığı (fırsat oluşturma tarihine göre)

**Dashboard Elementleri:**

| # | Element Tipi | Veri | Açıklama |
|---|-------------|------|----------|
| 1 | **KPI Kartı** | Toplam Açık Fırsat | Terminal olmayan aşamalardaki fırsat sayısı |
| 2 | **KPI Kartı** | Toplam Pipeline Değeri | Açık fırsatların toplam bütçe değeri |
| 3 | **KPI Kartı** | Ortalama Fırsat Değeri | Pipeline değeri / açık fırsat sayısı |
| 4 | **KPI Kartı** | Teklif Aşamasındaki Fırsat | Teklif gönderilmiş ama henüz sonuçlanmamış fırsatlar |
| 5 | **Bar Grafik (yatay, funnel benzeri)** | Pipeline Funnel | Aşamalar yukarıdan aşağı: Tanışma → Toplantı → Teklif → Sözleşme. Her bar o aşamadaki fırsat sayısı. Huni daralan şekilde. |
| 6 | **Bar Grafik (stacked)** | Aşama Bazlı Pipeline Değeri | Her aşama bir bar, değer toplam bütçe. Renk: dönüşüm oranı segmenti. |
| 7 | **Pasta Grafik** | Aşama Dağılımı (sayı) | Açık fırsatların aşamalara göre yüzde dağılımı |
| 8 | **Pasta Grafik** | Dönüşüm Oranı Dağılımı | Açık fırsatların conversionRate değerine göre dağılımı |
| 9 | **Treemap** | Fuar × Aşama × Değer | Büyük bloklar: fuarlar, alt bloklar: aşamalar, boyut: bütçe değeri |
| 10 | **Veri Tablosu** | Pipeline Detay Tablosu | Fırsat ID, Müşteri, Fuar, Aşama, Bütçe, Para Birimi, Dönüşüm Oranı, Oluşturma Tarihi, Son Güncelleme. Sıralanabilir/filtrelenebilir. |

---

### Rapor 3.2: Pipeline Hız Analizi (Velocity)

**Amaç:** Fırsatların pipeline'da ne kadar hızlı ilerlediğini ölçmek. Satış döngüsü süresi, aşamalar arası geçiş süreleri, darboğaz aşamalar. "Fırsatlarımız nerede takılıyor?"

**Filtreler:**
- Fuar (multi-select veya tümü)
- Tarih aralığı
- Son durum: Kazanılan / Kaybedilen / Açık / Tümü

**Dashboard Elementleri:**

| # | Element Tipi | Veri | Açıklama |
|---|-------------|------|----------|
| 1 | **KPI Kartı** | Ortalama Satış Döngüsü Süresi (gün) | İlk aşamadan (tanışma) terminal aşamaya (satışa dönüştü) kadar ortalama gün. StageLog tarihlerinden hesaplanır. |
| 2 | **KPI Kartı** | Medyan Satış Döngüsü Süresi (gün) | Aşırı değerlerden etkilenmeyen medyan süre |
| 3 | **KPI Kartı** | En Uzun Bekleyen Fırsat (gün) | Pipeline'da en uzun süredir açık olan fırsat ve süresi |
| 4 | **Bar Grafik (dikey)** | Aşama Bazlı Ortalama Bekleme Süresi | Her aşamada fırsatlar ortalama kaç gün kalıyor? Darboğaz aşama en uzun bar. StageLog aralıklarından hesaplanır. |
| 5 | **Çizgi Grafik** | Aylık Ortalama Satış Döngüsü Trendi | Son 12 ayda kazanılan fırsatların ortalama döngü süresi. Hızlanıyor muyuz? |
| 6 | **Scatter Plot** | Fırsat Değeri vs. Döngü Süresi | X: bütçe değeri, Y: gün. Büyük fırsatlar daha mı uzun sürüyor? Nokta rengi: kazanılan/kaybedilen |
| 7 | **Heatmap** | Aşama × Fuar Ortalama Süre | Satırlar: fuarlar, Sütunlar: aşamalar, Hücre: ortalama gün. Hangi fuarın pipeline'ı daha hızlı? |
| 8 | **Veri Tablosu** | Yavaş Fırsatlar | Son aşama değişikliğinden bu yana 30+ gün geçmiş açık fırsatlar. Müşteri, Fuar, Aşama, Gün Sayısı, Değer. Acil aksiyon listesi. |

---

### Rapor 3.3: Kazanma / Kaybetme Analizi (Win/Loss)

**Amaç:** Neden kazanıyoruz, neden kaybediyoruz? Kayıp nedenleri analizi, kazanma trendleri, hangi fuar/ürün/müşteri segmentinde daha başarılıyız?

**Filtreler:**
- Fuar (multi-select veya tümü)
- Tarih aralığı
- Kayıp nedeni (multi-select)
- Dönüşüm oranı

**Dashboard Elementleri:**

| # | Element Tipi | Veri | Açıklama |
|---|-------------|------|----------|
| 1 | **KPI Kartı** | Kazanma Oranı (%) | Kazanılan / (Kazanılan + Kaybedilen) × 100 |
| 2 | **KPI Kartı** | Kazanılan Fırsat Sayısı | Dönem içi satışa dönüşen fırsat sayısı |
| 3 | **KPI Kartı** | Kaybedilen Fırsat Sayısı | Dönem içi olumsuz sonuçlanan fırsat sayısı |
| 4 | **KPI Kartı** | Kaybedilen Toplam Değer | Kaybedilen fırsatların toplam bütçe değeri (kaçırdığımız gelir) |
| 5 | **Halka (Donut) Grafik** | Kazanma / Kayıp Oranı | Kazanılan vs. Kaybedilen (oran) |
| 6 | **Bar Grafik (yatay)** | Kayıp Nedenleri Dağılımı | lossReason alanına göre: Fiyat yüksek, Rakip tercih edildi, İhtiyaç ortadan kalktı, Zamanlama, İletişim koptu, Bütçe onaylanmadı, Diğer. Sayı + yüzde. |
| 7 | **Çizgi Grafik** | Aylık Kazanma Oranı Trendi | Son 12 ay kazanma oranının değişimi. İyileşiyor muyuz? |
| 8 | **Stacked Bar Grafik** | Fuar Bazlı Kazanma/Kayıp | Her fuar bir bar: kazanılan (yeşil) + kaybedilen (kırmızı) + açık (mavi) |
| 9 | **Bar Grafik** | Dönüşüm Oranına Göre Başarı | conversionRate segmentleri (Çok Yüksek → Çok Düşük) için kazanma oranı. Tahminlerimiz ne kadar doğru? |
| 10 | **Pasta Grafik** | Kayıp Değer Dağılımı (Nedene Göre) | Kaybedilen bütçenin kayıp nedenlerine göre dağılımı |
| 11 | **Veri Tablosu** | Kaybedilen Fırsatlar Detay | Müşteri, Fuar, Değer, Kayıp Nedeni, Son Aşama, Tarih. Sıralanabilir. Geri kazanılabilecek fırsatları tespit etmek için. |
| 12 | **Veri Tablosu** | Kazanılan Fırsatlar Detay | Müşteri, Fuar, Değer, Ürünler, Döngü Süresi (gün). Başarı hikayelerini görmek için. |

---

## Kategori 4: Gelir & Finansal Raporlar

**Açıklama:** Para konuşur. Gelir trendleri, bütçe dağılımları, para birimi analizi ve tahmin.

---

### Rapor 4.1: Gelir Analizi

**Amaç:** Kazanılan gelirin detaylı analizi. Nereden, ne kadar, hangi ürünlerden, hangi müşterilerden gelir elde ediyoruz?

**Filtreler:**
- Tarih aralığı (fırsatın kapanış tarihine göre)
- Fuar (multi-select)
- Para birimi (USD, EUR, TRY, GBP veya tümü — tümü seçildiğinde TRY karşılığı)
- Ürün (multi-select)

**Dashboard Elementleri:**

| # | Element Tipi | Veri | Açıklama |
|---|-------------|------|----------|
| 1 | **KPI Kartı** | Toplam Kazanılan Gelir | Dönem içi satışa dönüşen fırsatların toplam bütçe değeri |
| 2 | **KPI Kartı** | Ortalama Fırsat Değeri | Kazanılan fırsatların ortalama bütçe değeri |
| 3 | **KPI Kartı** | En Büyük Fırsat | En yüksek değerli kazanılan fırsat (müşteri adı + değer) |
| 4 | **KPI Kartı** | Aylık Ortalama Gelir | Dönem içi aylık ortalama kazanılan gelir |
| 5 | **Alan (Area) Grafik** | Aylık Gelir Trendi | Son 12 ay kümülatif kazanılan gelir. Büyüme trendi. |
| 6 | **Bar Grafik (dikey)** | Fuara Göre Gelir | Her fuarın kazanılan geliri, büyükten küçüğe |
| 7 | **Bar Grafik (dikey)** | Ürüne Göre Gelir | Ürün bazlı kazanılan gelir dağılımı (OpportunityProduct üzerinden) |
| 8 | **Pasta Grafik** | Para Birimi Dağılımı | Kazanılan gelirin USD/EUR/TRY/GBP dağılımı |
| 9 | **Treemap** | Müşteri Bazlı Gelir | Her müşteri bir kutu, boyut: toplam kazanılan gelir. En büyük kutular en değerli müşteriler. |
| 10 | **Çizgi Grafik** | Aylık Ortalama Fırsat Değeri Trendi | Kazanılan fırsatların ortalama değeri ay ay. Daha büyük fırsatlar mı kapatıyoruz? |
| 11 | **Veri Tablosu** | Gelir Detay Tablosu | Müşteri, Fuar, Bütçe, Para Birimi, Ürünler, Tonaj, Kapanış Tarihi. Sıralanabilir. |

---

### Rapor 4.2: Bütçe Tahmini & Pipeline Değerleme

**Amaç:** Açık pipeline'daki potansiyel gelirin ağırlıklı tahmini. Her fırsatın conversionRate ve aşamasına göre ağırlıklı pipeline değeri. "Bu çeyrek ne kadar gelir bekleyebiliriz?"

**Filtreler:**
- Fuar (multi-select veya tümü)
- Tarih aralığı

**Dashboard Elementleri:**

| # | Element Tipi | Veri | Açıklama |
|---|-------------|------|----------|
| 1 | **KPI Kartı** | Ham Pipeline Değeri | Tüm açık fırsatların toplam bütçe değeri (ağırlıksız) |
| 2 | **KPI Kartı** | Ağırlıklı Pipeline Değeri | Her fırsatın bütçesi × aşama ağırlığı × conversionRate ağırlığı. Gerçekçi tahmin. |
| 3 | **KPI Kartı** | Tahmini Kazanma Sayısı | Ağırlıklı olasılıklara göre kazanması beklenen fırsat sayısı |
| 4 | **Stacked Bar Grafik** | Aşama Bazlı Pipeline Değeri | Her aşama bir bölüm: ham değer ve ağırlıklı değer yan yana |
| 5 | **Bar Grafik (grouped)** | Dönüşüm Oranına Göre Pipeline | conversionRate segmentlerinin ham ve ağırlıklı değerleri |
| 6 | **Gauge (Kadran)** | Çeyreklik Gelir Hedefi Tahmini | Ağırlıklı pipeline + kazanılan gelir vs. hedef (varsa) |
| 7 | **Veri Tablosu** | Ağırlıklı Pipeline Detay | Müşteri, Fuar, Aşama, Bütçe, conversionRate, Aşama Ağırlığı, Ağırlıklı Değer. Potansiyel gelir büyükten küçüğe. |

**Aşama Ağırlıkları (Weighted Pipeline Hesabı):**
- Tanışma: %10
- Toplantı: %25
- Teklif: %50
- Sözleşme: %75
- Satışa Dönüştü: %100
- Olumsuz: %0

**Dönüşüm Oranı Çarpanları:**
- Çok Yüksek: ×1.0
- Yüksek: ×0.8
- Orta: ×0.5
- Düşük: ×0.3
- Çok Düşük: ×0.1

---

## Kategori 5: Müşteri Raporları

**Açıklama:** Müşteri portföyünün analizi. En değerli müşteriler kimler, müşteri segmentasyonu, müşteri yaşam döngüsü ve sadakat analizi.

---

### Rapor 5.1: Müşteri Genel Bakış

**Amaç:** Müşteri portföyünün büyük resmi. Kaç müşterimiz var, aktif müşteri oranı, müşteri başına ortalama fırsat ve değer.

**Filtreler:**
- Fuar (multi-select — o fuarlardaki müşteriler)
- Tarih aralığı (müşterinin ilk temas tarihine göre)
- Dönüşüm oranı filtresi

**Dashboard Elementleri:**

| # | Element Tipi | Veri | Açıklama |
|---|-------------|------|----------|
| 1 | **KPI Kartı** | Toplam Müşteri | Benzersiz müşteri sayısı |
| 2 | **KPI Kartı** | Aktif Müşteri | En az 1 açık fırsatı olan müşteri sayısı |
| 3 | **KPI Kartı** | Müşteri Başına Ort. Fırsat | Toplam fırsat / toplam müşteri |
| 4 | **KPI Kartı** | Müşteri Dönüşüm Oranı (%) | En az 1 kazanılan fırsatı olan müşteri / toplam müşteri |
| 5 | **Çizgi Grafik** | Aylık Yeni Müşteri Kazanma Trendi | Her ay kaç yeni müşteri eklendi (ilk fırsat tarihine göre) |
| 6 | **Bar Grafik (yatay)** | Müşteri Fırsat Sayısı Dağılımı | X: müşteri adı (top 15), Y: fırsat sayısı. En aktif müşteriler. |
| 7 | **Pasta Grafik** | Müşteri Durum Dağılımı | Sadece kazanılmış fırsatı olanlar / sadece açık fırsatı olanlar / sadece kayıp fırsatı olanlar / karışık |
| 8 | **Treemap** | Müşteri Portföy Değeri | Her müşteri bir kutu, boyut: toplam bütçe. Renk: ortalama conversionRate. |
| 9 | **Veri Tablosu** | Müşteri Listesi | Şirket, Kişi, Fırsat Sayısı, Kazanılan, Kaybedilen, Açık, Toplam Bütçe, İlk Temas, Son Temas, Dönüşüm Oranı. Sıralanabilir. |

---

### Rapor 5.2: Müşteri Segmentasyonu

**Amaç:** Müşterileri değer, aktivite ve potansiyel gibi boyutlarda segmentlere ayırmak. Kaynaklarımızı nereye yoğunlaştırmalıyız?

**Filtreler:**
- Segmentasyon kriteri: Değer / Fırsat Sayısı / Dönüşüm Oranı / Aktivite
- Fuar (multi-select)

**Dashboard Elementleri:**

| # | Element Tipi | Veri | Açıklama |
|---|-------------|------|----------|
| 1 | **Scatter Plot** | Değer vs. Fırsat Sayısı | X: fırsat sayısı, Y: toplam bütçe değeri. Her nokta bir müşteri. Nokta rengi: conversionRate. 4 çeyrek: yüksek değer-yüksek fırsat (en iyi), yüksek değer-az fırsat (odaklan), düşük değer-çok fırsat (verimlilik sorunu), düşük değer-az fırsat (düşük öncelik). |
| 2 | **Bar Grafik (yatay)** | En Değerli 10 Müşteri | Toplam bütçe değerine göre sıralı. Stacked: kazanılan (yeşil) + açık (mavi) + kaybedilen (kırmızı) |
| 3 | **Pasta Grafik** | Dönüşüm Oranı Segmentleri | Müşterilerin conversionRate ortalamasına göre segmentlere dağılımı |
| 4 | **Bar Grafik** | Fuar Bazlı Müşteri Dağılımı | Her fuarda kaç benzersiz müşteri ile temas kurulmuş |
| 5 | **Heatmap** | Müşteri × Fuar Matrisi | Satırlar: top 20 müşteri, Sütunlar: fuarlar, Hücre: o müşterinin o fuardaki fırsat sayısı. Sadık müşterileri (birden fazla fuara katılan) tespit etmek. |
| 6 | **Veri Tablosu** | Segment Detay | Müşteri, Segment, Toplam Değer, Fırsat Sayısı, Kazanma Oranı, Ortalama Döngü Süresi |

---

### Rapor 5.3: Müşteri Yaşam Döngüsü & Sadakat

**Amaç:** Müşterilerle ilişkinin zaman içindeki gelişimini izlemek. Tekrarlayan müşteriler kimler, müşteri ömür boyu değeri, hareketsiz müşterilerin tespiti.

**Filtreler:**
- Tarih aralığı
- Müşteri durumu: Aktif / Hareketsiz (son 90 gün aktivite yok) / Tümü
- Fuar (multi-select)

**Dashboard Elementleri:**

| # | Element Tipi | Veri | Açıklama |
|---|-------------|------|----------|
| 1 | **KPI Kartı** | Tekrarlayan Müşteri Sayısı | 2+ fuarda fırsatı olan müşteri sayısı (birden fazla fuar ilişkisi) |
| 2 | **KPI Kartı** | Tekrarlayan Müşteri Oranı (%) | Tekrarlayan müşteri / toplam müşteri |
| 3 | **KPI Kartı** | Hareketsiz Müşteri Sayısı | Son 90 gün aşama değişikliği veya not eklenmemiş müşteriler |
| 4 | **KPI Kartı** | Ortalama Müşteri Ömrü (gün) | İlk temas → son aktivite arasındaki ortalama süre |
| 5 | **Bar Grafik** | Fuar Katılım Sıklığı | Kaç müşteri 1 fuara, 2 fuara, 3+ fuara katılmış (histogram) |
| 6 | **Çizgi Grafik** | Müşteri Yaşam Boyu Değer Trendi | Aylık olarak yeni vs. tekrarlayan müşterilerden gelen gelir |
| 7 | **Leaderboard** | En Sadık Müşteriler | En fazla fuara katılan müşteriler. Fuar sayısı, toplam fırsat, toplam değer. |
| 8 | **Veri Tablosu** | Hareketsiz Müşteri Listesi | Son aktiviteden bu yana geçen gün, müşteri adı, şirket, açık fırsat sayısı, değer. Geri kazanım kampanyası için aksiyon listesi. |
| 9 | **Activity Feed** | Son Müşteri Etkileşimleri | Son 20 müşteri ile ilgili aktivite: aşama geçişleri, not eklemeleri, fırsat oluşturmaları. Kronolojik. |

---

## Kategori 6: Ürün Raporları

**Açıklama:** Hangi ürünler en çok talep ediliyor, hangi fuarlarda hangi ürünler öne çıkıyor, ürün bazlı gelir ve tonaj analizi.

---

### Rapor 6.1: Ürün Talep & Performans Analizi

**Amaç:** Ürün portföyünün performansını analiz etmek. En popüler ürünler, tonaj dağılımı, ürün bazlı gelir.

**Filtreler:**
- Fuar (multi-select veya tümü)
- Tarih aralığı
- Aşama filtresi (tüm fırsatlar / sadece kazanılan / sadece açık)

**Dashboard Elementleri:**

| # | Element Tipi | Veri | Açıklama |
|---|-------------|------|----------|
| 1 | **KPI Kartı** | Toplam Ürün Çeşidi | Fırsatlarda kullanılan benzersiz ürün sayısı |
| 2 | **KPI Kartı** | En Popüler Ürün | En çok fırsatta yer alan ürün adı + fırsat sayısı |
| 3 | **KPI Kartı** | Toplam Tonaj | Tüm OpportunityProduct kayıtlarının quantity toplamı |
| 4 | **KPI Kartı** | Kazanılan Tonaj | Sadece satışa dönüşen fırsatlardaki tonaj |
| 5 | **Bar Grafik (yatay)** | Ürün Popülerlik Sıralaması | Her ürünün kaç fırsatta yer aldığı, büyükten küçüğe |
| 6 | **Bar Grafik (dikey)** | Ürün Bazlı Tonaj | Her ürün için toplam talep edilen tonaj |
| 7 | **Pasta Grafik** | Ürün Tonaj Dağılımı | Ürünlerin toplam tonaj içindeki pay yüzdeleri |
| 8 | **Treemap** | Ürün Hiyerarşisi | Ürünler kutu olarak, boyut: fırsat sayısı veya tonaj, renk: kazanma oranı |
| 9 | **Çizgi Grafik** | Ürün Talebi Zaman Trendi | Aylık bazda en popüler 5 ürünün fırsat sayısı trendi |
| 10 | **Veri Tablosu** | Ürün Detay Tablosu | Ürün Adı, Fırsat Sayısı, Toplam Tonaj, Kazanılan Tonaj, Kazanma Oranı, İlişkili Fuar Sayısı. Sıralanabilir. |

---

### Rapor 6.2: Ürün-Fuar Performans Matrisi

**Amaç:** Hangi ürünler hangi fuarlarda daha iyi performans gösteriyor? Fuar katılım stratejisini ürün bazlı optimize etmek.

**Filtreler:**
- Fuar seçimi (multi-select)
- Ürün seçimi (multi-select)
- Metrik: Fırsat Sayısı / Tonaj / Kazanma Oranı

**Dashboard Elementleri:**

| # | Element Tipi | Veri | Açıklama |
|---|-------------|------|----------|
| 1 | **Heatmap** | Ürün × Fuar Matrisi (Fırsat Sayısı) | Satırlar: ürünler, Sütunlar: fuarlar, Hücre rengi yoğunluğu: fırsat sayısı |
| 2 | **Heatmap** | Ürün × Fuar Matrisi (Tonaj) | Aynı yapı, tonaj değeri ile |
| 3 | **Grouped Bar Grafik** | Fuar Bazlı Top 5 Ürün | Her fuar bir grup, içinde en popüler 5 ürünün fırsat sayısı |
| 4 | **Stacked Bar Grafik** | Ürün Bazlı Fuar Dağılımı | Her ürün bir bar, fuarlar renk segmentleri |
| 5 | **Veri Tablosu** | Matris Detay Tablosu | Ürün, Fuar, Fırsat Sayısı, Tonaj, Kazanılan Tonaj, Kazanma Oranı. Satır: her ürün-fuar kombinasyonu. |

---

## Kategori 7: Ekip & Kullanıcı Performans Raporları

**Açıklama:** Satış ekibinin ve bireysel temsilcilerin performans metrikleri. Kimin ne kadar fırsat yönettiği, kim daha hızlı kapatıyor, aktivite dağılımı.

---

### Rapor 7.1: Ekip Performans Dashboard

**Amaç:** Ekip bazlı performans karşılaştırması. Hangi ekip daha verimli çalışıyor?

**Filtreler:**
- Tarih aralığı
- Ekip seçimi (multi-select veya tümü)
- Fuar (multi-select)

**Dashboard Elementleri:**

| # | Element Tipi | Veri | Açıklama |
|---|-------------|------|----------|
| 1 | **KPI Kartı** | Toplam Ekip Sayısı | Aktif ekip sayısı |
| 2 | **KPI Kartı** | En Başarılı Ekip | En yüksek kazanma oranına sahip ekip adı + oranı |
| 3 | **KPI Kartı** | En Aktif Ekip | En çok fırsat yöneten ekip |
| 4 | **Bar Grafik (grouped)** | Ekip Bazlı Fırsat Sayıları | Her ekip: toplam / kazanılan / kaybedilen / açık fırsat |
| 5 | **Bar Grafik (grouped)** | Ekip Bazlı Gelir | Her ekip: pipeline değeri + kazanılan gelir |
| 6 | **Bar Grafik** | Ekip Kazanma Oranları | Ekiplerin kazanma oranları sıralı |
| 7 | **Leaderboard** | Ekip Sıralaması | Kazanma oranına göre sıralı: ekip adı, fırsat sayısı, kazanılan, oran, toplam gelir |
| 8 | **Veri Tablosu** | Ekip Detay Tablosu | Ekip Adı, Üye Sayısı, Toplam Fırsat, Kazanılan, Kaybedilen, Açık, Kazanma Oranı, Pipeline Değeri, Kazanılan Gelir, Ortalama Döngü Süresi |

> **Not:** Ekip performansı, ekip üyelerinin (User.teamId) oluşturduğu fuarlar (Fair.createdById) ve bu fuarlardaki fırsatlar üzerinden hesaplanır. Alternatif olarak, aşama geçişlerini yapan kullanıcı (StageLog.changedById) baz alınarak hangi ekibin fırsatları ilerlettiği de ölçülebilir.

---

### Rapor 7.2: Bireysel Performans (Leaderboard)

**Amaç:** Her satış temsilcisinin bireysel performansını ölçmek ve karşılaştırmak. Motivasyon ve adil değerlendirme aracı.

**Filtreler:**
- Tarih aralığı
- Ekip (multi-select veya tümü)
- Fuar (multi-select)
- Sıralama kriteri: Kazanma Oranı / Fırsat Sayısı / Gelir / Aktivite

**Dashboard Elementleri:**

| # | Element Tipi | Veri | Açıklama |
|---|-------------|------|----------|
| 1 | **Leaderboard** | Top Performans Sıralaması | Kullanıcılar seçili kritere göre sıralı. Sıra, Ad, Ekip, Fırsat Sayısı, Kazanılan, Kazanma Oranı, Gelir. İlk 3'e özel vurgulu tasarım. |
| 2 | **Bar Grafik (yatay)** | Kullanıcı Bazlı Kazanılan Gelir | Her kullanıcının kazanılan geliri, büyükten küçüğe |
| 3 | **Bar Grafik (grouped)** | Kullanıcı Bazlı Pipeline Durumu | Her kullanıcı: açık fırsat + kazanılan + kaybedilen |
| 4 | **Sparkline Satırlar** | Kişisel Trend | Her kullanıcının son 6 aydaki aylık kazanma sayısı mini çizgi grafik |
| 5 | **Scatter Plot** | Fırsat Sayısı vs. Kazanma Oranı | X: yönetilen fırsat sayısı, Y: kazanma oranı. İdeal: sağ üst (çok fırsat + yüksek oran). Nokta boyutu: gelir. |
| 6 | **Veri Tablosu** | Kullanıcı Performans Detay | Ad, Ekip, Fırsat Sayısı, Kazanılan, Kaybedilen, Açık, Kazanma Oranı, Pipeline Değeri, Kazanılan Gelir, Ort. Döngü Süresi, Son Aktivite |

> **Not:** Kullanıcı-fırsat ilişkisi, Fair.createdById ve StageLog.changedById / OpportunityNote.createdById üzerinden kurulur. Bir fırsatın "sahibi" fuarı oluşturan kişi olarak kabul edilir.

---

### Rapor 7.3: Aktivite Analizi

**Amaç:** Ekibin günlük operasyonel aktivitesini izlemek. Kim ne yapıyor, ne sıklıkla, hangi saatlerde?

**Filtreler:**
- Tarih aralığı
- Kullanıcı (multi-select veya tümü)
- Ekip (multi-select)
- Aktivite tipi: Aşama Değişikliği / Not Ekleme / Fırsat Oluşturma / Tümü

**Dashboard Elementleri:**

| # | Element Tipi | Veri | Açıklama |
|---|-------------|------|----------|
| 1 | **KPI Kartı** | Toplam Aktivite (dönem) | Seçili dönemdeki toplam aktivite sayısı (stage log + note + opportunity creation) |
| 2 | **KPI Kartı** | Günlük Ortalama Aktivite | Toplam / gün sayısı |
| 3 | **KPI Kartı** | En Aktif Kullanıcı | En fazla aktivitesi olan kullanıcı adı + sayı |
| 4 | **Çizgi Grafik** | Günlük Aktivite Trendi | Günlük toplam aktivite sayısı zaman serisi. Hafta sonları düşüş normal. |
| 5 | **Heatmap** | Gün × Saat Aktivite Yoğunluğu | Haftanın günleri (satır) × günün saatleri (sütun), hücre: aktivite yoğunluğu. Ekip ne zaman en aktif? |
| 6 | **Bar Grafik (stacked)** | Aktivite Tipi Dağılımı | Her gün: aşama değişikliği (mavi) + not ekleme (yeşil) + fırsat oluşturma (turuncu) |
| 7 | **Bar Grafik (yatay)** | Kullanıcı Bazlı Aktivite Sayısı | Her kullanıcının toplam aktivitesi sıralı |
| 8 | **Activity Feed** | Son 30 Aktivite | Kronolojik sırada son aktiviteler: "[Kullanıcı] [fırsat] için aşamayı [X]'den [Y]'ye geçirdi", "[Kullanıcı] [fırsat]'a not ekledi" |
| 9 | **Veri Tablosu** | Aktivite Log | Tarih, Kullanıcı, Aktivite Tipi, Fırsat, Müşteri, Fuar, Detay. Filtrelenebilir ve sıralanabilir. |

---

## Veri Kaynakları Özeti

Aşağıdaki tablo, her rapor için hangi veritabanı tablolarının kullanılacağını özetler:

| Rapor | Ana Tablolar | İlişkili Tablolar |
|-------|-------------|-------------------|
| Genel Durum Dashboard | Opportunity, Fair, Customer | OpportunityProduct, OpportunityStageLog |
| Fuar Genel Performans | Fair, Opportunity | OpportunityProduct |
| Fuar Karşılaştırma | Fair, Opportunity | OpportunityProduct, Product |
| Fuar Hedef Takibi | Fair, Opportunity | OpportunityProduct |
| Pipeline Genel Bakış | Opportunity | Fair, Customer |
| Pipeline Hız Analizi | OpportunityStageLog, Opportunity | Fair |
| Kazanma/Kaybetme Analizi | Opportunity | Fair, Customer |
| Gelir Analizi | Opportunity (satisa_donustu) | Fair, Customer, OpportunityProduct, Product |
| Bütçe Tahmini | Opportunity (açık) | Fair |
| Müşteri Genel Bakış | Customer, Opportunity | Fair |
| Müşteri Segmentasyonu | Customer, Opportunity | Fair, OpportunityProduct |
| Müşteri Yaşam Döngüsü | Customer, Opportunity, OpportunityStageLog, OpportunityNote | Fair |
| Ürün Talep Analizi | OpportunityProduct, Product, Opportunity | Fair |
| Ürün-Fuar Matrisi | OpportunityProduct, Product, Opportunity, Fair | — |
| Ekip Performans | User, Team, Fair, Opportunity | OpportunityStageLog |
| Bireysel Performans | User, Fair, Opportunity, OpportunityStageLog | Team |
| Aktivite Analizi | OpportunityStageLog, OpportunityNote, Opportunity, AuditLog | User, Fair, Customer |

---

## Uygulama Notları

### Backend API Endpoint'leri

| Endpoint | Rapor |
|----------|-------|
| `GET /api/v1/reports/executive-summary` | Yönetici Özeti |
| `GET /api/v1/reports/fair-performance` | Fuar Genel Performans |
| `GET /api/v1/reports/fair-comparison` | Fuar Karşılaştırma |
| `GET /api/v1/reports/fair-targets` | Fuar Hedef Takibi |
| `GET /api/v1/reports/pipeline-overview` | Pipeline Genel Bakış |
| `GET /api/v1/reports/pipeline-velocity` | Pipeline Hız Analizi |
| `GET /api/v1/reports/win-loss` | Kazanma/Kaybetme Analizi |
| `GET /api/v1/reports/revenue` | Gelir Analizi |
| `GET /api/v1/reports/forecast` | Bütçe Tahmini |
| `GET /api/v1/reports/customer-overview` | Müşteri Genel Bakış |
| `GET /api/v1/reports/customer-segmentation` | Müşteri Segmentasyonu |
| `GET /api/v1/reports/customer-lifecycle` | Müşteri Yaşam Döngüsü |
| `GET /api/v1/reports/product-analysis` | Ürün Talep Analizi |
| `GET /api/v1/reports/product-fair-matrix` | Ürün-Fuar Matrisi |
| `GET /api/v1/reports/team-performance` | Ekip Performans |
| `GET /api/v1/reports/individual-performance` | Bireysel Performans |
| `GET /api/v1/reports/activity-analysis` | Aktivite Analizi |

Her endpoint filtreleri query parameter olarak alır.

### Frontend Grafik Kütüphanesi

Dashboard grafikleri için **Recharts** kütüphanesi kullanılacaktır (React uyumlu, TailwindCSS ile entegre, responsive).

Desteklenmesi gereken grafik tipleri:
- LineChart, BarChart, PieChart, AreaChart, ScatterChart (Recharts yerleşik)
- Heatmap (özel bileşen veya Recharts ile grid yapısı)
- Treemap (Recharts yerleşik)
- Gauge / Kadran (özel bileşen)
- Funnel (özel bileşen veya yatay bar simülasyonu)

### Responsive Tasarım

- Masaüstü: Grid layout (2-4 sütun, grafikler yan yana)
- Tablet: 2 sütun
- Mobil: Tek sütun, grafik genişlikleri %100

### Export

Her dashboard'dan:
- **PDF Export:** Tüm grafik ve tabloların anlık görüntüsü
- **CSV Export:** Ham veri tablosu

---

## Rapor Listesi Özet Tablosu

| # | Kategori | Rapor Adı | Kart Açıklaması |
|---|----------|-----------|-----------------|
| 1.1 | Yönetici Özeti | Genel Durum Dashboard'u | Tüm operasyonun anlık fotoğrafı: KPI'lar, trendler ve öne çıkan metrikler |
| 2.1 | Fuar Performans | Fuar Genel Performans | Tüm fuarların performans metrikleri ve karşılaştırmalı analizi |
| 2.2 | Fuar Performans | Fuar Karşılaştırma | Seçilen fuarları birebir karşılaştır: fırsat, gelir, tonaj, dönüşüm |
| 2.3 | Fuar Performans | Fuar Hedef Takibi | Bütçe, tonaj ve lead hedeflerinin gerçekleşme durumu |
| 3.1 | Satış Pipeline | Pipeline Genel Bakış | Satış hunisinin anlık durumu: aşama dağılımı, değerler, darboğazlar |
| 3.2 | Satış Pipeline | Pipeline Hız Analizi | Fırsatların aşamalar arası geçiş hızları ve darboğaz tespiti |
| 3.3 | Satış Pipeline | Kazanma/Kaybetme Analizi | Neden kazanıyoruz, neden kaybediyoruz? Kayıp nedenleri detayı |
| 4.1 | Gelir & Finans | Gelir Analizi | Kazanılan gelirin fuar, ürün, müşteri bazlı detaylı analizi |
| 4.2 | Gelir & Finans | Bütçe Tahmini & Pipeline Değerleme | Ağırlıklı pipeline değeri ile gelir tahmini |
| 5.1 | Müşteri | Müşteri Genel Bakış | Müşteri portföyünün büyük resmi: sayılar, trendler, dağılımlar |
| 5.2 | Müşteri | Müşteri Segmentasyonu | Müşterilerin değer, aktivite ve potansiyele göre segmentleri |
| 5.3 | Müşteri | Müşteri Yaşam Döngüsü & Sadakat | Tekrarlayan müşteriler, hareketsiz müşteriler, ömür boyu değer |
| 6.1 | Ürün | Ürün Talep & Performans Analizi | Hangi ürünler ne kadar talep ediliyor ve hangisi daha başarılı? |
| 6.2 | Ürün | Ürün-Fuar Performans Matrisi | Hangi ürün hangi fuarda daha iyi performans gösteriyor? |
| 7.1 | Ekip & Performans | Ekip Performans Dashboard | Ekiplerin karşılaştırmalı performans metrikleri |
| 7.2 | Ekip & Performans | Bireysel Performans (Leaderboard) | Satış temsilcilerinin kişisel performans sıralaması |
| 7.3 | Ekip & Performans | Aktivite Analizi | Ekibin operasyonel aktivite akışı ve yoğunluk haritası |
