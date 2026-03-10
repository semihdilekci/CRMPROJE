Phase 3 — Raporlama, İş Akışı & Veri Kalitesi Feature Listesi
==============================================================

Bu faz, Fırsat Geçişi Fazı tamamlandıktan sonra uygulanacaktır.
Fırsat Geçişi detayları: docs/firsat-gecisi-fazi.md

Mobil uygulama bu fazda kapsam dışıdır. Mobil için ayrı bir faz planlanacaktır.
Phase 3, Phase 2 ve Fırsat Geçişi üzerine inşa edilen raporlama, iş akışı
ve veri kalitesi özelliklerini kapsar.

NOT: Bu feature'lardaki terminoloji Fırsat Geçişi sonrasına göre güncellenmiştir.
"Fırsat" = satış fırsatı (Opportunity), her fırsat bir fuara ve bir müşteriye bağlıdır.

==============================
RAPORLAMA & ANALİZ (Feature 32–35)
==============================

Feature 32 — Rapor Kolon Seçimi & Excel Çıktısı

- Rapor modalında (Feature 31'den devam) açılır-kapanır "Rapor Kolonları" bölümü:
  - Checkbox ile hangi alanların raporda yer alacağının seçilmesi:
    - Fuar adı
    - Firma adı (fırsata bağlı müşteriden)
    - Kişi adı (fırsata bağlı müşteriden)
    - Telefon (fırsata bağlı müşteriden)
    - E-posta (fırsata bağlı müşteriden)
    - Tahmini bütçe + para birimi (fırsattan)
    - Satışa dönüşme tahmini (fırsattan)
    - İlgilenilen ürün(ler) (fırsattan)
    - Kayıt tarihi (fırsattan)
    - Kartvizit URL'si (fırsattan, varsa)
- Uygulanan filtrelere ve seçili kolonlara göre tablo önizlemesi.
- "Excel'e Aktar" butonu:
  - Üretilen veriyi XLSX formatında indirme.
  - Kolon başlıklarının Türkçe ve anlamlı olması.
  Durum: [ ]

Feature 33 — Rapor Şablonları (Kaydedilebilir Filtre Setleri)

- Sık kullanılan rapor kombinasyonlarını "şablon" olarak kaydetme:
  - Örnekler: "Sıcak Lead'ler", "Bütçesi Yüksek Potansiyel Fırsatlar".
- Şablon içeriği:
  - Uygulanan filtreler (tarih, bütçe, dönüşüm seviyesi, ürün vb.).
  - Seçili kolon listesi.
- Her kullanıcının kendi rapor şablonlarını kaydedebilmesi:
  - Şablonlar kullanıcıya özeldir, sadece oluşturan kullanıcı tarafından görülür ve kullanılabilir.
- Şablon yönetimi: listeleme, yeniden adlandırma, silme.
  Durum: [ ]

Feature 34 — Global Dashboard & KPI Kartları

- Ayrı bir "Dashboard" sayfasında genel istatistikler:
  - URL: `/dashboard`.
  - Toplam fuar sayısı.
  - Toplam fırsat sayısı.
  - Toplam benzersiz müşteri sayısı.
  - Dönüşüm oranı dağılımı (ör. bar/pie chart) — fırsatlar bazında.
  - En çok ilgi gören ilk 5 ürün (fırsat sayısına göre).
  - Son X gün/ay içindeki yeni fırsat sayısı (zaman serisi görünümü).
- KPI kartları üzerinden drill-down:
  - Örneğin bir dönüşüm seviyesi kartına tıklayınca, o seviyedeki fırsatların listelendiği ekrana gitme.
- Fuar ekranından (fuar listesi veya detay sayfası) `/dashboard` sayfasına erişim için görünür bir navigasyon öğesi.
  Durum: [ ]

Feature 35 — Çapraz Fuar Fırsat Analizi

- Aynı müşterinin birden fazla fuarda fırsatlarının olması durumunda bunu gösteren çapraz görünüm:
  - Müşteri bazlı view: müşteri → ilişkili fırsatlar → her fuardaki fırsat sayısı, bütçe, dönüşüm tahmini.
- Müşteri detayında "Fırsatları" sekmesi:
  - Fuar adı, tarih aralığı, o fuardaki tahmini bütçe ve dönüşüm bilgileri.
- Bu görünüm üzerinden, tekrar eden veya artan/azalan ilginin takibini kolaylaştıran UI.
  Durum: [ ]

==============================
İŞ AKIŞI & TAKİP (Feature 36–39)
==============================

Feature 36 — Fırsat Sorumlusu Atama & Filtreleme

- `Opportunity` üzerinde "sorumlu kullanıcı" alanının eklenmesi (User referansı).
- Fırsat formunda sorumlu kullanıcı seçimi (sistem kullanıcıları arasından seçim).
- Fırsat listesinde:
  - Sorumluya göre filtreleme.
  - "Atanmamış" fırsatlar için hazır filtre.
- Admin için, sorumlu dağılımını görebildiği basit bir özet (ör. kişi başı fırsat sayısı).
  Durum: [ ]

Feature 37 — Görev & Hatırlatıcılar (Follow-up Task'ları)

- Her fırsat için takip görevi oluşturabilme:
  - Başlık, açıklama/not alanı.
  - Hedef tarih (due date).
  - Durum (açık / tamamlandı).
- "Bugün yapılacaklar" veya "Yaklaşan görevler" listesi:
  - Giriş yapan kullanıcıya atanmış açık görevleri gösterir.
- Görevlerin fırsat detayında görünmesi, tamamlandığında işaretlenebilmesi.
  Durum: [ ]

Feature 38 — Basit Takvim/Toplantı Entegrasyonu

- Fırsat detayında:
  - "Toplantıyı takvime ekle" aksiyonu:
    - Google Calendar / Outlook için temel event link'i üretimi (URL tabanlı).
  - Minimum entegrasyon: mailto + calendar link; gerçek API entegrasyonu ileriki fazlarda.
- Oluşturulan toplantıların fırsat detayında basit bir listede gösterilmesi (opsiyonel).
  Durum: [ ]

Feature 39 — Toplu İçeri/Dışa Aktarım (Import/Export Geliştirme)

- Fırsatlar ve müşteriler için Excel/CSV'den toplu import:
  - Kolon eşleştirme ekranı (Excel kolonlarını sistem alanlarına map etme).
  - Temel validation ve duplikasyon uyarısı (aynı müşteri e-posta/telefon tekrarları).
  - Müşteri yoksa otomatik oluştur, varsa mevcut müşteriye bağla.
- Var olan fırsatların toplu export'u:
  - Seçili fuar veya mevcut filtrelenmiş sonuçlara göre export.
- Import sürecinin hata raporu: kaç satır başarılı, kaç satır hatalı ve neden.
  Durum: [ ]

==============================
VERİ KALİTESİ & SEGMENTASYON (Feature 40–41)
==============================

Feature 40 — Gelişmiş Global Arama

- Tüm fuar, fırsat ve müşterilerde arama yapabilen global arama barı:
  - Fuar adı, firma adı, kişi adı, e-posta, telefon gibi alanlarda arama.
- Son aramaların kaydedilmesi (opsiyonel) ve hızlı erişim.
- Arama sonucunda:
  - Bulunan kayıtların tipine göre gruplanmış görünüm (fuar sonuçları, fırsat sonuçları, müşteri sonuçları).
  Durum: [ ]

Feature 41 — Etiketleme (Tagging) ve Segmentler

- Fırsatlara serbest etiket ekleme:
  - Örnek: "VIP", "Rakip Firma", "Sıcak Lead", "Teklif Gönderildi".
- Fırsat listesinde etiketlere göre filtreleme.
- Kayıtlı segmentler:
  - Belirli filtre + etiket kombinasyonlarını "segment" olarak kaydetme.
  - Segment üzerinden hızlı liste/rapor oluşturma.
  Durum: [ ]

==============================
NOTLAR
==============================

- Toplam: 10 feature (32–41)
- Kapsam: Raporlama & analiz (32–35), iş akışı & takip (36–39), veri kalitesi & segmentasyon (40–41).
- Ön koşul: Phase 2 (F26–F31) ve Fırsat Geçişi Fazı tamamlanmış olmalıdır.
- Mobil uygulama ve mobil entegrasyonlar bu fazın kapsamı dışındadır.
- Her feature tamamlandığında Durum alanı [x] olarak işaretlenir.
