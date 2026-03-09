Phase 2 — Gelişmiş Yönetim & Raporlama Feature Listesi

Mobil uygulama bu fazda kapsam dışıdır. Mobil için ayrı bir faz (Phase 3) planlanacaktır.
Phase 2, Phase 1 üzerine inşa edilen gelişmiş yönetim, raporlama ve iş akışı özelliklerini kapsar.

==============================
ADMIN & KONFİGÜRASYON (Feature 26–30)
==============================

Feature 26 — Admin: Gelişmiş Yetki ve Menü Yapısı

- Admin kullanıcı için giriş sonrası ek menü öğeleri:
  - Kullanıcı Yönetimi
  - Ürün Listesi (İlgilenilen Ürünler)
  - Sistem Ayarları (ileride genişletilebilir)
- Tüm admin ekranları için URL yapısının `/admin/...` prefix'i ile düzenlenmesi:
  - Örnekler: `/admin/users`, `/admin/products`, `/admin/settings`, `/admin/audit-log`.
- Normal kullanıcıların bu menü öğelerine erişiminin RolesGuard ile engellenmesi.
- Admin için "Yönetim" başlığı altında gruplanmış alt menüler.
- Admin/normal kullanıcı menülerinin, backend role bilgisinden beslenmesi.
  Durum: [x]

Feature 27 — Admin: Kullanıcı Yönetimi (Web UI)

- Mevcut User CRUD backend'inin üstüne web arayüzü eklenmesi:
  - Kullanıcı listeleme (isim, e-posta, rol, oluşturulma tarihi, son giriş tarihi).
  - Arama ve filtreleme (role göre, aktif/pasif durumuna göre).
- Kullanıcı oluşturma/düzenleme modal'ı:
  - Alanlar: ad soyad, e-posta, rol (admin/user), opsiyonel geçici şifre veya şifre sıfırlama akışı.
  - Form validasyonu (Zod + React Hook Form).
- Kullanıcı silme veya deaktif etme (soft deactivate), rol değişiklikleri için confirm diyalogları.
- Admin dışında kimsenin bu ekrana erişememesi.
  Durum: [x]

Feature 28 — Admin: İlgilenilen Ürünler Master Listesi (CRUD)

- "İlgilenilen Ürünler" listesinin veritabanı tabanlı hale getirilmesi (Product/InterestCategory gibi bir model).
- Admin ekranı:
  - Ürün kategorisi listeleme, arama.
  - Yeni ürün ekleme (isim, açıklama opsiyonel).
  - İsim güncelleme, silme; silme öncesi bu ürünü kullanan müşteri sayısını gösteren uyarı.
- `CustomerForm` üzerindeki multi-select'in bu dinamik listeden beslenmesi.
- Var olan müşterilerle geriye dönük uyumluluk için data migration stratejisinin belirlenmesi.
  Durum: [x]

Feature 29 — Admin: Sistem Parametreleri & Sözlük Yönetimi

- Admin için küçük bir "Sistem Ayarları" ekranı:
  - Varsayılan para birimi (örn. TL).
  - Bazı metin/sözlük değerleri (ör. dönüşüm oranı açıklamaları) için yapılandırma alanları.
- Bu ayarların veritabanında tutulması ve backend üzerinden okunması.
- Sadece admin rolünün bu ayarları görüp değiştirebilmesi.
- Yapılan değişikliklerin audit log'a yazılması (bkz. Feature 30).
  Durum: [x]

Feature 30 — Audit Log & İşlem Geçmişi

- Fuar, müşteri, kullanıcı ve ürün listesi gibi kritik CRUD işlemlerinin loglanması:
  - Kim (user id/email), neyi, ne zaman ve hangi eski/yeni değerlerle değiştirdi.
- Audit log verisinin veritabanı modelinin tasarlanması.
- Admin için "İşlem Geçmişi" ekranı:
  - Tarih aralığına, kullanıcıya, kaynak tipine (fair/customer/user/product) göre filtreleme.
  - Sadece okunur görünüm, silme/güncelleme yok.
  Durum: [x]

==============================
RAPORLAMA & ANALİZ (Feature 31–35)
==============================

Feature 31 — Fuar Detayında “Rapor al” Butonu & Rapor Modalı

- Fuar detay sayfasının en altında, ortalanmış bir `Rapor al` butonu.
- Butona tıklandığında açılan modal:
  - Fuar başlangıç–bitiş tarih aralığı filtresi:
    - Varsayılan: ilgili fuarın tarih aralığı.
    - Opsiyonel: tarih aralığını genişletip birden fazla fuarı kapsayabilme.
  - Tahmini bütçe aralığı filtresi (min–max, sayısal aralık).
  - Satışa dönüşme tahmini filtresi (çok yüksek / yüksek / orta / düşük / çok düşük — bir veya birden fazla seviye seçilebilir).
  - İlgilenilen ürün filtresi (ilgilenilen ürünler listesinden bir veya çoklu seçim).
- Hiç filtre uygulanmazsa:
  - Tüm fuarlar için tüm müşterileri getiren rapor üretilir.
  Durum: [ ]

Feature 32 — Rapor Kolon Seçimi & Excel Çıktısı

- Aynı rapor modalında açılır-kapanır (accordion) bir "Rapor Kolonları" bölümü:
  - Checkbox ile hangi alanların raporda yer alacağının seçilmesi:
    - Fuar adı
    - Firma adı
    - Kişi adı
    - Telefon
    - E-posta
    - Tahmini bütçe + para birimi
    - Satışa dönüşme tahmini
    - İlgilenilen ürün(ler)
    - Kayıt tarihi
    - Kartvizit URL'si (varsa)
- Uygulanan filtrelere ve seçili kolonlara göre tablo önizlemesi.
- "Excel’e Aktar" butonu:
  - Üretilen veriyi XLSX formatında indirme.
  - Kolon başlıklarının Türkçe ve anlamlı olması.
  Durum: [ ]

Feature 33 — Rapor Şablonları (Kaydedilebilir Filtre Setleri)

- Sık kullanılan rapor kombinasyonlarını "şablon" olarak kaydetme:
  - Örnekler: "Sıcak Lead’ler", "Bütçesi Yüksek Potansiyel Müşteriler".
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
  - Toplam müşteri sayısı.
  - Dönüşüm oranı dağılımı (ör. bar/pie chart).
  - En çok ilgi gören ilk 5 ürün (müşteri sayısına göre).
  - Son X gün/ay içindeki yeni müşteri sayısı (zaman serisi görünümü).
- KPI kartları üzerinden drill-down:
  - Örneğin bir dönüşüm seviyesi kartına tıklayınca, o seviyedeki müşterilerin listelendiği ekrana gitme.
- Fuar ekranından (fuar listesi veya detay sayfası) `/dashboard` sayfasına erişim için görünür bir navigasyon öğesi.
  Durum: [ ]

Feature 35 — Çapraz Fuar Müşteri Analizi

- Aynı firmanın birden fazla fuarda yer alması durumunda bunu gösteren çapraz görünüm:
  - Firma bazlı view: firma → katıldığı fuarlar → her fuardaki temas sayısı, bütçe, dönüşüm tahmini.
- Firma detayında "Katıldığı Fuarlar" sekmesi:
  - Fuar adı, tarih aralığı, o fuardaki tahmini bütçe ve dönüşüm bilgileri.
- Bu görünüm üzerinden, tekrar eden veya artan/azalan ilginin takibini kolaylaştıran UI.
  Durum: [ ]

==============================
İŞ AKIŞI & TAKİP (Feature 36–39)
==============================

Feature 36 — Müşteri Sorumlusu Atama & Filtreleme

- `Customer` üzerinde "sorumlu kullanıcı" alanının eklenmesi (User referansı).
- Müşteri formunda sorumlu kullanıcı seçimi (multi-tenant olmayacağı varsayımıyla sistem kullanıcıları arasından seçim).
- Müşteri listesinde:
  - Sorumluya göre filtreleme.
  - "Atanmamış" müşteriler için hazır filtre.
- Admin için, sorumlu dağılımını görebildiği basit bir özet (ör. kişi başı müşteri sayısı).
  Durum: [ ]

Feature 37 — Görev & Hatırlatıcılar (Follow-up Task’ları)

- Her müşteri için takip görevi oluşturabilme:
  - Başlık, açıklama/not alanı.
  - Hedef tarih (due date).
  - Durum (açık / tamamlandı).
- "Bugün yapılacaklar" veya "Yaklaşan görevler" listesi:
  - Giriş yapan kullanıcıya atanmış açık görevleri gösterir.
- Görevlerin müşteri detayında görünmesi, tamamlandığında işaretlenebilmesi.
  Durum: [ ]

Feature 38 — Basit Takvim/Toplantı Entegrasyonu

- Müşteri detayında:
  - "Toplantıyı takvime ekle" aksiyonu:
    - Google Calendar / Outlook için temel event link’i üretimi (URL tabanlı).
  - Minimum entegrasyon: mailto + calendar link; gerçek API entegrasyonu ileriki fazlarda.
- Oluşturulan toplantıların müşteri detayında basit bir listede gösterilmesi (opsiyonel).
  Durum: [ ]

Feature 39 — Toplu İçeri/Dışa Aktarım (Import/Export Geliştirme)

- Müşteriler için Excel/CSV'den toplu import:
  - Kolon eşleştirme ekranı (Excel kolonlarını sistem alanlarına map etme).
  - Temel validation ve duplikasyon uyarısı (aynı e-posta/telefon tekrarları).
- Var olan müşterilerin toplu export'u:
  - Seçili fuar veya mevcut filtrelenmiş sonuçlara göre export.
- Import sürecinin hata raporu: kaç satır başarılı, kaç satır hatalı ve neden.
  Durum: [ ]

==============================
VERİ KALİTESİ & SEGMENTASYON (Feature 40–41)
==============================

Feature 40 — Gelişmiş Global Arama

- Tüm fuar ve müşterilerde arama yapabilen global arama barı:
  - Firma adı, kişi adı, e-posta, telefon gibi alanlarda arama.
- Son aramaların kaydedilmesi (opsiyonel) ve hızlı erişim.
- Arama sonucunda:
  - Bulunan kayıtların tipine göre gruplanmış görünüm (fuar sonuçları, müşteri sonuçları).
  Durum: [ ]

Feature 41 — Etiketleme (Tagging) ve Segmentler

- Müşterilere serbest etiket ekleme:
  - Örnek: "VIP", "Rakip Firma", "Sıcak Lead", "Teklif Gönderildi".
- Müşteri listesinde etiketlere göre filtreleme.
- Kayıtlı segmentler:
  - Belirli filtre + etiket kombinasyonlarını "segment" olarak kaydetme.
  - Segment üzerinden hızlı liste/rapor oluşturma.
  Durum: [ ]

==============================
NOTLAR
==============================

- Toplam: 16 feature (26–41)
- Kapsam: Admin & yönetim, raporlama & analiz, iş akışı & takip, veri kalitesi & segmentasyon.
- Mobil uygulama ve mobil entegrasyonlar bu fazın kapsamı dışındadır (ayrı bir Phase 3'te ele alınacaktır).
- Sıralama: Admin & konfigürasyon (26–30) → Raporlama & analiz (31–35) → İş akışı & takip (36–39) → Veri kalitesi & segmentasyon (40–41).
- Her feature tamamlandığında Durum alanı [x] olarak işaretlenir.
