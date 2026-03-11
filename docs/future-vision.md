Future Vision — Gelecek Faz Önerileri
======================================

Bu doküman, Phase 3 kapsamına alınmayan ancak gelecekte değerlendirilecek
özellik önerilerini içerir. Her özellik kısa açıklaması ve potansiyel
değeri ile listelenmiştir.

Bu özellikler öncelik sırasına göre değil, kategori bazında gruplanmıştır.
Hangilerinin hangi fazda ele alınacağı, Phase 3 tamamlandıktan sonra
ihtiyaca göre belirlenir.

==============================
RAPORLAMA & ANALİZ
==============================

Rapor Kolon Seçimi & Excel Çıktısı
  Fuar detayında "Rapor al" modalında checkbox ile kolon seçimi,
  uygulanan filtrelere göre tablo önizlemesi ve XLSX export.
  Kolon başlıkları Türkçe ve anlamlı.

Rapor Şablonları (Kaydedilebilir Filtre Setleri)
  Sık kullanılan rapor kombinasyonlarını şablon olarak kaydetme.
  Kullanıcıya özel şablonlar: listeleme, yeniden adlandırma, silme.
  Örnekler: "Sıcak Lead'ler", "Bütçesi Yüksek Potansiyel Fırsatlar".

Global Dashboard & KPI Kartları
  Ayrı bir "/dashboard" sayfasında genel istatistikler:
  toplam fuar, toplam fırsat, benzersiz müşteri sayısı,
  dönüşüm dağılımı (chart), en çok ilgi gören ürünler,
  zaman serisi (yeni fırsat trendi).
  KPI kartlarından drill-down.
  NOT: Fuar bazlı KPI, Phase 3 F42-F43 ile karşılandı.
  Bu özellik global (tüm fuarlar arası) dashboard'u kapsar.

Çapraz Fuar Analizi & Müşteri 360° Görünümü
  Aynı müşterinin birden fazla fuarda fırsatlarının görünümü.
  Müşteri detay sayfası: tüm fırsatlar, toplam hacim, dönüşüm geçmişi.
  Müşterinin "sıcaklık skoru" (son N aydaki aktivite).
  İletişim geçmişi (notlar, toplantılar).

==============================
İŞ AKIŞI & TAKİP
==============================

Fırsat Sorumlusu Atama & Filtreleme
  Opportunity üzerinde sorumlu kullanıcı alanı (User referansı).
  Fırsat formunda sorumlu seçimi.
  Fırsat listesinde sorumluya göre filtreleme.
  "Atanmamış" fırsatlar filtresi.
  Admin için sorumlu dağılımı özeti (kişi başı fırsat sayısı).

Görev & Hatırlatıcılar (Follow-up Task'ları)
  Her fırsat için takip görevi oluşturabilme:
  başlık, açıklama, hedef tarih, durum (açık/tamamlandı).
  "Bugün yapılacaklar" veya "Yaklaşan görevler" listesi.
  Görevlerin fırsat detayında görünmesi.

Takvim / Toplantı Entegrasyonu
  Fırsat detayında "Toplantıyı takvime ekle" aksiyonu.
  Google Calendar / Outlook için URL tabanlı event link üretimi.
  Oluşturulan toplantıların fırsat detayında basit listede gösterilmesi.

Beklenen Kapanış Tarihi & Forecasting
  Her fırsata tahmini kapanış tarihi atanması.
  Pipeline görünümünde ay/çeyrek bazında gelir tahmini.
  Tarihi geçmiş ama hâlâ açık fırsatlar için otomatik uyarı.

Fırsat Yaşlanma (Aging) Uyarıları
  Belirli bir süre aynı aşamada kalan fırsatlar için görsel uyarı:
  30+ gün hareketsiz → sarı uyarı
  60+ gün hareketsiz → kırmızı uyarı
  Satış ekibinin "unutulan" fırsatları tespit etmesini sağlar.

==============================
VERİ KALİTESİ & OPERASYON
==============================

Gelişmiş Global Arama
  Tüm fuar, fırsat ve müşterilerde arama yapabilen global arama barı.
  Fuar adı, firma adı, kişi adı, email, telefon alanlarında arama.
  Sonuçların tipine göre gruplanmış görünüm.
  Son aramaların kaydedilmesi.

Toplu İçeri/Dışa Aktarım (Import/Export)
  Fırsatlar ve müşteriler için Excel/CSV'den toplu import:
  kolon eşleştirme ekranı, validation ve duplikasyon uyarısı,
  müşteri yoksa otomatik oluştur. Toplu export, hata raporu.

Rakip Takibi
  Fırsat bazında hangi rakiplerin teklif verdiğinin kaydı.
  Rakip firma adı, rakibin avantajı/dezavantajı notu.
  Kazanılan/kaybedilen fırsatlarda rakip analizi.

Hızlı Teklif Özeti & PDF Çıktısı
  Fırsat içinden basit teklif özeti oluşturma:
  seçili ürünler × tonaj × birim fiyat (manuel).
  Toplam tutar otomatik hesaplama.
  PDF olarak basit şablonla dışa aktarma.

Müşteri Birleştirme (Dedup)
  Aynı kişi farklı fuarlarda ayrı Customer olarak mevcut olabilir.
  Benzer müşterileri tespit etme ve birleştirme özelliği.
  Birleştirme sonrası ilişkili fırsatlar tek müşteriye bağlanır.

==============================
MOBİL UYGULAMA
==============================

React Native + Expo Mobil Uygulaması
  Fuarlarda sahada kullanılacak mobil uygulama.
  Hızlı fırsat girişi, kartvizit fotoğrafı, QR code okuma.
  Offline desteği (fuarlarda internet kesintisi).
  Push bildirimler (görev hatırlatmaları).
  Aynı backend API'yi tüketen, @crm/shared paylaşımlı yapı.
  Teknoloji: React Native + Expo (SDK 52+), Expo Router,
  NativeWind v4, TanStack Query.

==============================
NOTLAR
==============================

- Bu özellikler önceliklendirme ve planlama yapılmadan uygulanmaz.
- Her özellik ayrı bir faz dokümanında detaylandırılır (feature-by-feature).
- Phase 3 tamamlandıktan sonra bu liste tekrar değerlendirilir.
- Yeni fikirler ortaya çıktıkça bu dokümana eklenir.
