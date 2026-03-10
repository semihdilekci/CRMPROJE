Phase 2 — Gelişmiş Yönetim & Raporlama Feature Listesi

Mobil uygulama bu fazda kapsam dışıdır. Mobil için ayrı bir faz planlanacaktır.
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
RAPORLAMA (Feature 31)
==============================

Feature 31 — Fuar Detayında "Rapor al" Butonu & Rapor Modalı

  ÖN KOŞUL: Bu feature, Fırsat Geçişi Fazı (docs/firsat-gecisi-fazi.md)
  tamamlandıktan sonra uygulanacaktır.

- Fuar detay sayfasının en altında, ortalanmış bir `Rapor al` butonu.
- Butona tıklandığında açılan modal:
  - Fuar başlangıç–bitiş tarih aralığı filtresi:
    - Varsayılan: ilgili fuarın tarih aralığı.
    - Opsiyonel: tarih aralığını genişletip birden fazla fuarı kapsayabilme.
  - Tahmini bütçe aralığı filtresi (min–max, sayısal aralık).
  - Satışa dönüşme tahmini filtresi (çok yüksek / yüksek / orta / düşük / çok düşük — bir veya birden fazla seviye seçilebilir).
  - İlgilenilen ürün filtresi (ilgilenilen ürünler listesinden bir veya çoklu seçim).
- Hiç filtre uygulanmazsa:
  - Tüm fuarlar için tüm fırsatları getiren rapor üretilir.
  Durum: [ ]

==============================
NOTLAR
==============================

- Toplam: 6 feature (26–31)
- Kapsam: Admin & yönetim (26–30), raporlama başlangıcı (31).
- Feature 31, Fırsat Geçişi Fazı (docs/firsat-gecisi-fazi.md) tamamlandıktan sonra uygulanacaktır.
- Feature 32–41, Phase 3'e taşınmıştır (docs/phase-3-features.md).
- Mobil uygulama ve mobil entegrasyonlar bu fazın kapsamı dışındadır.
- Her feature tamamlandığında Durum alanı [x] olarak işaretlenir.
