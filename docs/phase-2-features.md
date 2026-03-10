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
EKİPLER & SATIŞ LEAD YAPISI (Feature 31–33)
==============================

Feature 31 — Ekip Tanımı ve Kullanıcı-Ekip İlişkisi

- Admin panelinde "Ekipler" için ayrı bir menü öğesi:
  - URL: `/admin/teams`.
  - Liste ekranı: ekip adı, açıklama (opsiyonel), ekipteki kullanıcı sayısı, oluşturulma tarihi.
- Ekip CRUD:
  - Yeni ekip oluşturma (zorunlu: ekip adı, opsiyonel: açıklama, aktif/pasif durumu).
  - Ekip adını ve açıklamasını güncelleme, ekipleri aktif/pasif yapma.
  - Ekip silme öncesi, bu ekibe bağlı kullanıcı sayısını gösteren uyarı. Ekip'e dahil kullanıcı varsa ekip silinemez.
- Kullanıcı ile ekip ilişkisinin tanımlanması:
  - Kullanıcı oluşturma/düzenleme ekranında "Ekip" alanı (dropdown, zorunlu olmaludur. Her kullanıcı mutlaka bir ekibe dahildir).
  - Kullanıcı modelinde ekip referansı (her kullanıcının tek bir ekibi olduğu varsayımıyla başlanır).
- Kullanıcı listesinde:
  - Ekipe göre filtreleme.
  - Ekip kolonunun (isim) gösterilmesi.
  Durum: [x]

Feature 32 — Müşteri Kartı Oluşturan Ekip & Kullanıcı Bilgisi

- Müşteri oluşturma akışında:
  - Oluşturan kullanıcının bilgisi (user id/email) ve bağlı olduğu ekip otomatik olarak kayıt altına alınır.
  - Oluşturulma tarihi zaten var ise, ekip ve kullanıcı bilgileriyle birlikte tek bir meta blokta ele alınır.
- Müşteri detay ekranında:
  - Kart başlığının altında veya sağ üstte "Oluşturan" bilgisi:
    - Oluşturan ekip adı.
    - Oluşturan kullanıcı adı.
    - Oluşturulma tarihi/saat bilgisi.
- İleride raporlama ve filtreleme için:
  - Müşteri listesinde ekip bazlı filtreleme (hangi ekip hangi müşterileri oluşturmuş).
  - Audit log (Feature 30) ile entegrasyon: ilgili kayıtlar ekip ve kullanıcı bilgisiyle birlikte görüntülenir.
  Durum: [ ]

Feature 33 — Müşteri Kartında Siparişler Alanı

- Müşteri kartı içinde, mevcut "İlgilenilen Ürünler" alanının altında yeni bir "Siparişler" bölümü:
  - Başlık: "Siparişler" (opsiyonel açıklama: "Bu müşteriyle ilişkilendirilen potansiyel sipariş lead’leri").
- Sipariş satırı yapısı:
  - Ürün seçimi:
    - İlgilenilen ürünler master listesinden (Feature 28) seçim.
    - Tek sipariş satırı bir ürüne bağlıdır; aynı müşteri için birden fazla sipariş satırı eklenebilir.
  - Tutar/bütçe alanı:
    - Sayısal tutar (ör. para birimi Phase 1/2’deki bütçe para birimi mantığına paralel).
  - Satışa dönüşme tahmini:
    - Mevcut satışa dönüşme tahmini seviyeleri sipariş bazlı hale getirilir:
      - çok yüksek / yüksek / orta / düşük / çok düşük.
  - Statü alanı:
    - Ön tanımlı seçenekler:
      - "Satışa Dönüştü"
      - "Teklif Verildi"
      - "Soru Yanıtlandı"
    - Gerekirse ileride sözlük yönetimi (Feature 29) üzerinden genişletilebilir.
- UI davranışı:
  - Bir müşteri kartı için birden fazla sipariş satırı ekleyebilme, düzenleyebilme, silebilme.
  - Siparişler bölümü boşsa, "Bu müşteri için henüz kayıtlı bir sipariş lead’i yok" şeklinde boş durum mesajı.
- Raporlama etkisi:
  - Satışa dönüşme tahmini artık sipariş düzeyinde tutulur; müşteri seviyesindeki özet değer, bu siparişlerden türetilebilir (Phase 2 tasarımında netleştirilecek).
  Durum: [ ]

==============================
İŞ AKIŞI & TAKİP (Feature 34–37)
==============================

Feature 34 — Müşteri Sorumlusu Atama & Filtreleme

- `Customer` üzerinde "sorumlu kullanıcı" alanının eklenmesi (User referansı).
- Müşteri formunda sorumlu kullanıcı seçimi (multi-tenant olmayacağı varsayımıyla sistem kullanıcıları arasından seçim).
- Müşteri listesinde:
  - Sorumluya göre filtreleme.
  - "Atanmamış" müşteriler için hazır filtre.
- Admin için, sorumlu dağılımını görebildiği basit bir özet (ör. kişi başı müşteri sayısı).
  Durum: [ ]

Feature 35 — Görev & Hatırlatıcılar (Follow-up Task’ları)

- Her müşteri için takip görevi oluşturabilme:
  - Başlık, açıklama/not alanı.
  - Hedef tarih (due date).
  - Durum (açık / tamamlandı).
- "Bugün yapılacaklar" veya "Yaklaşan görevler" listesi:
  - Giriş yapan kullanıcıya atanmış açık görevleri gösterir.
- Görevlerin müşteri detayında görünmesi, tamamlandığında işaretlenebilmesi.
  Durum: [ ]

Feature 36 — Basit Takvim/Toplantı Entegrasyonu

- Müşteri detayında:
  - "Toplantıyı takvime ekle" aksiyonu:
    - Google Calendar / Outlook için temel event link’i üretimi (URL tabanlı).
  - Minimum entegrasyon: mailto + calendar link; gerçek API entegrasyonu ileriki fazlarda.
- Oluşturulan toplantıların müşteri detayında basit bir listede gösterilmesi (opsiyonel).
  Durum: [ ]

Feature 37 — Toplu İçeri/Dışa Aktarım (Import/Export Geliştirme)

- Müşteriler için Excel/CSV'den toplu import:
  - Kolon eşleştirme ekranı (Excel kolonlarını sistem alanlarına map etme).
  - Temel validation ve duplikasyon uyarısı (aynı e-posta/telefon tekrarları).
- Var olan müşterilerin toplu export'u:
  - Seçili fuar veya mevcut filtrelenmiş sonuçlara göre export.
- Import sürecinin hata raporu: kaç satır başarılı, kaç satır hatalı ve neden.
  Durum: [ ]

==============================
RAPORLAMA & ANALİZ (Feature 38–42)
==============================

Feature 38 — Fuar Detayında “Rapor al” Butonu & Rapor Modalı

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

Feature 39 — Rapor Kolon Seçimi & Excel Çıktısı

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

Feature 40 — Rapor Şablonları (Kaydedilebilir Filtre Setleri)

- Sık kullanılan rapor kombinasyonlarını "şablon" olarak kaydetme:
  - Örnekler: "Sıcak Lead’ler", "Bütçesi Yüksek Potansiyel Müşteriler".
- Şablon içeriği:
  - Uygulanan filtreler (tarih, bütçe, dönüşüm seviyesi, ürün vb.).
  - Seçili kolon listesi.
- Her kullanıcının kendi rapor şablonlarını kaydedebilmesi:
  - Şablonlar kullanıcıya özeldir, sadece oluşturan kullanıcı tarafından görülür ve kullanılabilir.
- Şablon yönetimi: listeleme, yeniden adlandırma, silme.
  Durum: [ ]

Feature 41 — Global Dashboard & KPI Kartları

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

Feature 42 — Çapraz Fuar Müşteri Analizi

- Aynı firmanın birden fazla fuarda yer alması durumunda bunu gösteren çapraz görünüm:
  - Firma bazlı view: firma → katıldığı fuarlar → her fuardaki temas sayısı, bütçe, dönüşüm tahmini.
- Firma detayında "Katıldığı Fuarlar" sekmesi:
  - Fuar adı, tarih aralığı, o fuardaki tahmini bütçe ve dönüşüm bilgileri.
- Bu görünüm üzerinden, tekrar eden veya artan/azalan ilginin takibini kolaylaştıran UI.
  Durum: [ ]

==============================
VERİ KALİTESİ & SEGMENTASYON (Feature 43–44)
==============================

Feature 43 — Gelişmiş Global Arama

- Tüm fuar ve müşterilerde arama yapabilen global arama barı:
  - Firma adı, kişi adı, e-posta, telefon gibi alanlarda arama.
- Son aramaların kaydedilmesi (opsiyonel) ve hızlı erişim.
- Arama sonucunda:
  - Bulunan kayıtların tipine göre gruplanmış görünüm (fuar sonuçları, müşteri sonuçları).
  Durum: [ ]

Feature 44 — Etiketleme (Tagging) ve Segmentler

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

- Toplam: 19 feature (26–44)
- Kapsam: Admin & yönetim, ekipler & satış lead yapısı, iş akışı & takip, raporlama & analiz, veri kalitesi & segmentasyon.
- Mobil uygulama ve mobil entegrasyonlar bu fazın kapsamı dışındadır (ayrı bir Phase 3'te ele alınacaktır).
- Sıralama: Admin & konfigürasyon (26–30) → Ekipler & satış lead yapısı (31–33) → İş akışı & takip (34–37) → Raporlama & analiz (38–42) → Veri kalitesi & segmentasyon (43–44).
- Her feature tamamlandığında Durum alanı [x] olarak işaretlenir.