import type { ReportCategory } from '../types/report';

export const STAGE_WEIGHTS: Record<string, number> = {
  tanisma: 0.10,
  toplanti: 0.25,
  teklif: 0.50,
  sozlesme: 0.75,
  satisa_donustu: 1.00,
  olumsuz: 0,
};

export const CONVERSION_RATE_MULTIPLIERS: Record<string, number> = {
  very_high: 1.0,
  high: 0.8,
  medium: 0.5,
  low: 0.3,
  very_low: 0.1,
};

export const REPORT_CATALOG: ReportCategory[] = [
  {
    id: 'executive',
    title: 'Yönetici Özeti',
    description: 'Üst yönetim için tek bakışta tüm operasyonun durumu',
    reports: [
      {
        slug: 'executive-summary',
        name: 'Genel Durum Dashboard\'u',
        description: 'Tüm operasyonun anlık fotoğrafı: KPI\'lar, trendler ve öne çıkan metrikler',
        icon: '📊',
        category: 'Yönetici Özeti',
      },
    ],
  },
  {
    id: 'fair-performance',
    title: 'Fuar Performans Raporları',
    description: 'Fuarların verimliliği, hedef gerçekleşmeleri ve karşılaştırma',
    reports: [
      {
        slug: 'fair-performance',
        name: 'Fuar Genel Performans',
        description: 'Tüm fuarların performans metrikleri ve karşılaştırmalı analizi',
        icon: '🏛',
        category: 'Fuar Performans',
      },
      {
        slug: 'fair-comparison',
        name: 'Fuar Karşılaştırma',
        description: 'Seçilen fuarları birebir karşılaştır: fırsat, gelir, tonaj, dönüşüm',
        icon: '⚖️',
        category: 'Fuar Performans',
      },
      {
        slug: 'fair-targets',
        name: 'Fuar Hedef Takibi',
        description: 'Bütçe, tonaj ve lead hedeflerinin gerçekleşme durumu',
        icon: '🎯',
        category: 'Fuar Performans',
      },
    ],
  },
  {
    id: 'sales-pipeline',
    title: 'Satış Pipeline Raporları',
    description: 'Satış hunisinin durumu, darboğazlar ve kayıp analizi',
    reports: [
      {
        slug: 'pipeline-overview',
        name: 'Pipeline Genel Bakış',
        description: 'Satış hunisinin anlık durumu: aşama dağılımı, değerler, darboğazlar',
        icon: '🔄',
        category: 'Satış Pipeline',
      },
      {
        slug: 'pipeline-velocity',
        name: 'Pipeline Hız Analizi',
        description: 'Fırsatların aşamalar arası geçiş hızları ve darboğaz tespiti',
        icon: '⚡',
        category: 'Satış Pipeline',
      },
      {
        slug: 'win-loss',
        name: 'Kazanma/Kaybetme Analizi',
        description: 'Neden kazanıyoruz, neden kaybediyoruz? Kayıp nedenleri detayı',
        icon: '🏆',
        category: 'Satış Pipeline',
      },
    ],
  },
  {
    id: 'revenue',
    title: 'Gelir & Finansal Raporlar',
    description: 'Gelir trendleri, bütçe dağılımları ve tahmin',
    reports: [
      {
        slug: 'revenue',
        name: 'Gelir Analizi',
        description: 'Kazanılan gelirin fuar, ürün, müşteri bazlı detaylı analizi',
        icon: '💰',
        category: 'Gelir & Finans',
      },
      {
        slug: 'forecast',
        name: 'Bütçe Tahmini & Pipeline Değerleme',
        description: 'Ağırlıklı pipeline değeri ile gelir tahmini',
        icon: '📈',
        category: 'Gelir & Finans',
      },
    ],
  },
  {
    id: 'customer',
    title: 'Müşteri Raporları',
    description: 'Müşteri portföyü, segmentasyon ve yaşam döngüsü analizi',
    reports: [
      {
        slug: 'customer-overview',
        name: 'Müşteri Genel Bakış',
        description: 'Müşteri portföyünün büyük resmi: sayılar, trendler, dağılımlar',
        icon: '👥',
        category: 'Müşteri',
      },
      {
        slug: 'customer-segmentation',
        name: 'Müşteri Segmentasyonu',
        description: 'Müşterilerin değer, aktivite ve potansiyele göre segmentleri',
        icon: '🧩',
        category: 'Müşteri',
      },
      {
        slug: 'customer-lifecycle',
        name: 'Müşteri Yaşam Döngüsü & Sadakat',
        description: 'Tekrarlayan müşteriler, hareketsiz müşteriler, ömür boyu değer',
        icon: '♻️',
        category: 'Müşteri',
      },
    ],
  },
  {
    id: 'product',
    title: 'Ürün Raporları',
    description: 'Ürün talep analizi ve fuar-ürün performans matrisi',
    reports: [
      {
        slug: 'product-analysis',
        name: 'Ürün Talep & Performans Analizi',
        description: 'Hangi ürünler ne kadar talep ediliyor ve hangisi daha başarılı?',
        icon: '📦',
        category: 'Ürün',
      },
      {
        slug: 'product-fair-matrix',
        name: 'Ürün-Fuar Performans Matrisi',
        description: 'Hangi ürün hangi fuarda daha iyi performans gösteriyor?',
        icon: '🗂',
        category: 'Ürün',
      },
    ],
  },
  {
    id: 'team',
    title: 'Ekip & Kullanıcı Performans Raporları',
    description: 'Ekip ve bireysel performans metrikleri, aktivite analizi',
    reports: [
      {
        slug: 'team-performance',
        name: 'Ekip Performans Dashboard',
        description: 'Ekiplerin karşılaştırmalı performans metrikleri',
        icon: '👨‍👩‍👧‍👦',
        category: 'Ekip & Performans',
      },
      {
        slug: 'individual-performance',
        name: 'Bireysel Performans (Leaderboard)',
        description: 'Satış temsilcilerinin kişisel performans sıralaması',
        icon: '🥇',
        category: 'Ekip & Performans',
      },
      {
        slug: 'activity-analysis',
        name: 'Aktivite Analizi',
        description: 'Ekibin operasyonel aktivite akışı ve yoğunluk haritası',
        icon: '📋',
        category: 'Ekip & Performans',
      },
    ],
  },
];
