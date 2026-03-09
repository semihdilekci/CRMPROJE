Phase 1 — Fuar CRM Web Uygulaması Feature Listesi
Mobil uygulama bu fazda kapsam dışıdır.
Geliştirme sırası feature numarasına göre yapılır. Her feature bir öncekine bağımlıdır.

==============================
ALTYAPI & KURULUM (Feature 1–5)
==============================

Feature 1 — Monorepo Kurulumu & Proje Yapılandırması

- npm workspaces ile monorepo başlatma
- apps/api, apps/web, packages/shared klasör yapısı
- Root tsconfig.json (strict mode)
- ESLint + Prettier konfigürasyonu (tüm apps için tutarlı)
- .gitignore, .env.example dosyaları
- Root package.json workspace scripts
  Durum: [x]

Feature 2 — Shared Package Kurulumu

- packages/shared TypeScript projesi oluşturma
- Build konfigürasyonu (tsconfig.json, build script)
- @crm/shared alias tanımı
- Workspace referanslarını apps/api ve apps/web içine ekleme
  Durum: [x]

Feature 3 — Backend: NestJS Proje Kurulumu & Temel Konfigürasyon

- NestJS proje oluşturma (apps/api)
- Helmet middleware (güvenlik başlıkları)
- CORS konfigürasyonu (ortam bazlı)
- Global validation pipe
- Global exception filter (standart hata yanıtları)
- Standart API response format: { success, message, data? }
- Logger konfigürasyonu
- Environment variables yönetimi (@nestjs/config)
  Durum: [x]

Feature 4 — Veritabanı: Prisma Şema Tasarımı & Migration

- Prisma ORM kurulumu ve PostgreSQL bağlantısı
- User modeli (id, email, password, role, name, createdAt, updatedAt)
- Fair modeli (id, name, address, startDate, endDate, createdAt, updatedAt)
- Customer modeli (id, fairId, company, name, phone, email, budgetRaw, budgetCurrency, conversionRate, products, cardImage, createdAt, updatedAt)
- İlişkiler: Fair → Customer (one-to-many), User → Fair (created-by)
- İlk migration çalıştırma (prisma migrate dev)
  Durum: [x]

Feature 5 — Shared: Tip Tanımları, Enum'lar & Sabitler

- User, Fair, Customer TypeScript interface'leri
- Role enum (admin, user)
- ConversionRate enum (very_high, high, medium, low, very_low)
- Currency enum (USD, TL, GBP, EUR)
- Product listesi sabiti (10 ürün kategorisi)
- Dönüşüm oranı renk haritası
- API endpoint sabitleri
  Durum: [x]

==============================
BACKEND MODÜLLERİ (Feature 6–12)
==============================

Feature 6 — Backend: Authentication Modülü

- Passport.js + JWT strategy
- Access token (kısa süreli) + Refresh token (uzun süreli)
- Login endpoint (POST /auth/login)
- Register endpoint (POST /auth/register)
- Refresh token endpoint (POST /auth/refresh)
- Logout endpoint (POST /auth/logout)
- Argon2 ile parola hashleme
- JWT AuthGuard (korumalı endpoint'ler için)
- Role-based guard (RBAC)
  Durum: [x]

Feature 7 — Backend: User Yönetimi Modülü

- User CRUD (Controller → Service → Prisma)
- GET /users — kullanıcı listesi (admin only)
- GET /users/:id — tekil kullanıcı
- PATCH /users/:id — güncelleme
- DELETE /users/:id — silme (admin only)
- Parola alanı API yanıtlarından hariç tutma
- Admin seed script (ilk admin kullanıcısını oluşturma)
  Durum: [ ]

Feature 8 — Shared: Zod Validasyon Şemaları

- createFairSchema (name zorunlu, dates opsiyonel)
- updateFairSchema (partial)
- createCustomerSchema (company + name zorunlu, diğerleri opsiyonel)
- updateCustomerSchema (partial)
- loginSchema (email + password)
- registerSchema (email + password + name)
- Backend ve web aynı şemaları @crm/shared'dan import eder
  Durum: [ ]

Feature 9 — Backend: Fuar Yönetimi Modülü

- Fair CRUD (Controller → Service → Prisma)
- POST /fairs — fuar oluşturma
- GET /fairs — fuar listesi (startDate azalan sıralama)
- GET /fairs/:id — fuar detayı (müşterilerle birlikte)
- PATCH /fairs/:id — fuar güncelleme
- DELETE /fairs/:id — fuar silme (cascade: müşteriler de silinir)
- Zod validasyon entegrasyonu
  Durum: [ ]

Feature 10 — Backend: Müşteri Yönetimi Modülü

- Customer CRUD (Controller → Service → Prisma)
- POST /fairs/:fairId/customers — müşteri ekleme
- GET /fairs/:fairId/customers — müşteri listesi
- PATCH /customers/:id — müşteri güncelleme
- DELETE /customers/:id — müşteri silme
- Arama endpoint'i (isim veya firma, case-insensitive)
- Dönüşüm oranı filtresi
- Zod validasyon entegrasyonu
  Durum: [ ]

Feature 11 — Backend: Dosya Yükleme Servisi

- Kartvizit fotoğrafı upload endpoint'i (POST /upload/card-image)
- Geliştirmede local storage, production'da S3/Cloudinary-ready
- Dosya boyutu ve format validasyonu (sadece image/\*)
- Upload sonrası URL döndürme
  Durum: [ ]

Feature 12 — Shared: Yardımcı Fonksiyonlar (Utils)

- formatDate(iso) → "12 Mar 2025" (Türkçe locale)
- formatDateTime(iso) → "12 Mar 2025, 14:35"
- formatBudget(raw) → "1.000.000,00" (Türk sayı formatı)
- parseBudgetRaw(display) → temizlenmiş ham sayı string'i
- Dönüşüm oranı label ve renk mapper'ı
  Durum: [ ]

==============================
WEB FRONTEND (Feature 13–25)
==============================

Feature 13 — Web: Next.js Proje Kurulumu & Yapılandırma

- Next.js 14+ (App Router) proje oluşturma (apps/web)
- TailwindCSS kurulumu
- shadcn/ui kurulumu
- Axios instance (base URL, interceptors, token yönetimi)
- TanStack Query provider
- Zustand store yapısı
- @crm/shared bağlantısı
  Durum: [ ]

Feature 14 — Web: Tasarım Sistemi Kurulumu

- TailwindCSS dark theme renk token'ları:
  bg (#0A0A0F), surface (#12121A), card (#1A1A26), border (#2A2A3E),
  accent (#FF6B35), accentSoft (#FF6B3520), gold (#FFB347), goldSoft (#FFB34715),
  text (#F0EDE8), muted (#8A8AA0), green (#4ADE80), greenSoft (#4ADE8015)
- Dönüşüm oranı renkleri: very_high (#4ADE80), high (#86EFAC), medium (#FFB347), low (#FB923C), very_low (#F87171)
- Tehlike/silme rengi: #F87171
- Google Fonts: Playfair Display (serif, başlıklar) + DM Sans (sans-serif, gövde)
- Font boyutu skalası (10px–34px)
- Spacing hiyerarşisi (sayfa 36px/24px → kart 20-22px → detay 16-18px → küçük 8-12px)
- Scrollbar özelleştirmesi (6px genişlik, temalı renkler)
- Select dropdown özelleştirmesi (option arka planı surface rengi)
  Durum: [ ]

Feature 15 — Web: Temel UI Bileşenleri

- Input bileşeni (label: uppercase 12px 700 weight, focus/blur border transition 0.2s)
- Textarea bileşeni (resize: vertical, minHeight 80px)
- Badge bileşeni (arka plan: color+"20", border: color+"40", 6px radius)
- Modal bileşeni (fixed overlay #00000090, içerik maxWidth 620px, maxHeight 90vh, scroll, backdrop close, stopPropagation)
- Button bileşeni (primary/secondary/danger varyantları)
- Select dropdown bileşeni
- Toggle button / chip bileşeni (seçili: color+"25" arka plan, transition 0.15s)
  Durum: [ ]

Feature 16 — Web: Layout & Navigasyon

- Sticky Top Bar (position: sticky, top: 0, z-index: 100)
- Glassmorphism efekti (backdrop-filter: blur(12px), arka plan #0A0A0FEE)
- Sol: logo ikonu + "Fuar CRM" (Playfair Display serif, 18px)
- Breadcrumb görünümü (fuar detayında: Fuar CRM › [Fuar Adı], muted renk)
- Sağ: "+ Yeni Fuar" CTA butonu (sadece ana ekranda görünür)
- Content wrapper (maxWidth: 960px, margin: 0 auto, padding: 36px 24px)
- İki katmanlı navigasyon state yönetimi (selectedFair state)
  Durum: [ ]

Feature 17 — Web: Authentication Sayfaları & State Yönetimi

- Login sayfası (email + password formu)
- Auth state (Zustand store: user, token, isAuthenticated)
- Protected route wrapper (auth yoksa login'e redirect)
- Axios interceptor (access token ekleme, 401'de refresh token denemesi)
- Logout işlevi
  Durum: [ ]

Feature 18 — Web: Fuar Listesi Sayfası

- Fuar kartları grid (repeat(auto-fill, minmax(280px, 1fr)), gap 14px, responsive 1-3 kolon)
- FairCard bileşeni:
  Fuar adı (Playfair Display serif, 19px),
  adres (📍 prefix), tarih aralığı (📅 prefix),
  müşteri sayısı (accent renk, 20px, 800 weight) + "müşteri kaydı" açıklaması,
  sağ altta → accent ok ikonu
- Hover efekti (border-color: accent, translateY(-2px), 0.2s transition)
- Aktif fuar tespiti (now >= startDate && now <= endDate → accent border #60 opacity + yeşil "DEVAM EDİYOR" rozeti, absolute positioned)
- Geçmiş fuar tespiti (now > endDate → tarih rengi muted)
- Sıralama (startDate azalan — en yeni üstte)
- Empty state (büyük 🏛 emoji 56px, başlık, açıklama, CTA butonu)
- "Yeni Fuar Ekle" dashed border kartı (2px dashed, hover'da accent renk)
- Özet istatistik satırı ("X fuar · Y toplam müşteri kaydı")
  Durum: [ ]

Feature 19 — Web: Fuar CRUD İşlemleri (UI)

- FairForm bileşeni:
  Fuar Adı (text input), Adres/Yer (textarea, dikey resize),
  Başlangıç Tarihi + Bitiş Tarihi (date picker, 1fr 1fr grid yan yana)
- Fuar oluşturma modal'ı (top bar CTA veya empty state CTA ile açılır)
- Fuar düzenleme modal'ı (initial prop ile önceden dolu, fuar detay sayfasından ✏️ Düzenle butonu)
- Fuar silme (confirm dialog: "Fuarı silmek istediğinizden emin misiniz?", cascade uyarısı)
- Kaydet sonrası modal kapanır, liste güncellenir
- Düzenleme sonrası hem fairs state hem selectedFair güncellenir
- Form validasyonu (name zorunlu, boşken kaydet butonu çalışmaz)
- Kaydet (accent, flex:1) + İptal (surface, border) butonları
  Durum: [ ]

Feature 20 — Web: Fuar Detay Sayfası — Header & İstatistikler

- ← Fuarlara Dön geri butonu (muted renk, border yok)
- Fuar adı (Playfair Display, 28px) + 📍 adres + 📅 tarih aralığı
- Sağ üstte ✏️ Düzenle ve 🗑 Sil butonları yan yana (sil butonu kırmızı tonlarında)
- İstatistik kartları satırı (yatay scroll edilebilir):
  Toplam müşteri (accent renk, 26px bold sayı),
  Dönüşüm bazlı kartlar (her seviye için ayrı kart, ≥1 müşteri varsa görünür, kendi rengiyle sayı, border %30 opacity)
  Durum: [ ]

Feature 21 — Web: Fuar Detay — Toolbar & Filtreleme

- Arama input'u (gerçek zamanlı, toLowerCase() case-insensitive, isim veya firma adı)
- Dönüşüm oranı <select> filtresi ("Tüm Dönüşümler" + 5 seçenek)
- - Müşteri Ekle butonu (accent, nowrap)
- Arama + filtre kombinasyonu (eş zamanlı çalışır)
- Toolbar elemanları flexWrap ile responsive
- Boş arama sonucu mesajı ("Arama sonucu bulunamadı.")
  Durum: [ ]

Feature 22 — Web: Müşteri Kartı Bileşeni

- Kapalı hali:
  Kişi adı (700 weight, 15px), firma adı (accent rengi, 600 weight),
  Badge satırı: dönüşüm rozeti (kendi rengi) + ilk 2 ürün rozeti (muted) + "+N" fazla ürün rozeti,
  Sağ üst: kartvizit varsa 📇 ikonu (tooltip) + ▲/▼ göstergesi,
  Hover'da border #3A3A5E
- Açık/genişletilmiş hali:
  Üstten 1px solid border ile ayrılmış detay bölümü,
  Tahmini Bütçe (formatBudget + para birimi, gold renk, yoksa "—"),
  Kayıt Zamanı (formatDateTime, Türkçe),
  Telefon (📞 prefix, href="tel:..." tıklanabilir),
  E-posta (✉️ prefix, href="mailto:..." tıklanabilir, wordBreak: break-all),
  Telefon + E-posta 1fr 1fr grid (yoksa gizli),
  İlgilenilen Ürünler (accent badge'leri, yoksa gizli),
  Kartvizit (maxHeight 120px preview, yoksa gizli),
  Alt kısım: ✏️ Düzenle (accent, flex-1) + 🗑 Sil (kırmızı, sabit genişlik)
- Accordion toggle (tıkla aç/kapat, ok ikonu değişir)
- Müşteri kartları grid (repeat(auto-fill, minmax(300px, 1fr)), gap 10px)
  Durum: [ ]

Feature 23 — Web: Müşteri Formu & CRUD İşlemleri

- CustomerForm bileşeni:
  Firma Adı + Ad Soyad (1fr 1fr grid, yan yana),
  Telefon (type="tel") + E-posta (type="email") (1fr 1fr grid, yan yana),
  Tahmini Bütçe (sadece sayı, inputMode="numeric", gerçek zamanlı Türk formatlaması toLocaleString("tr-TR") + ",00", sağa hizalı, ham değer ve display ayrı state),
  Para birimi dropdown (USD/TL/GBP/EUR, bütçe input'una yapışık birleşik blok: input sağ border yok + borderRadius "10px 0 0 10px", dropdown sol border + borderRadius "0 10px 10px 0", accent bold metin),
  Satışa Dönüşme Tahmini (5 seçenek toggle group: Çok Yüksek 80-100% / Yüksek 60-80% / Orta 40-60% / Düşük 20-40% / Çok Düşük 0-20%, renk kodlu, yüzde opacity 0.7),
  İlgilenilen Ürünler (10 kategori multi-select chip: Endüstriyel Pompalar, Vana Sistemleri, Kompresörler, Filtre Üniteleri, Otomasyon Yazılımı, Sensörler & Ölçüm, Boru & Fitting, Isı Eşanjörleri, Proses Ekipmanları, Kontrol Panelleri — seçili: ✓ prefix + accent, flexWrap),
  Kartvizit Fotoğrafı (hidden file input, accept="image/\*", useRef tetikleme, 2px dashed upload area, hover accent border, seçilince base64 preview maxHeight 160px + ✕ sil butonu #000000AA)
- Müşteri ekleme modal'ı (fuar detay toolbar'dan + Müşteri Ekle ile açılır, boş form, createdAt otomatik set)
- Müşteri düzenleme modal'ı (genişletilmiş karttaki ✏️ ile açılır, initial prop ile dolu, bütçe display formatBudget ile yeniden hesaplanır)
- Müşteri silme (genişletilmiş karttaki 🗑, confirm dialog, onay sonrası listeden çıkarılır)
- Form validasyonu (company + name zorunlu, boşken kaydet çalışmaz)
- Kaydet (accent, flex:1) + İptal (surface, border) butonları
  Durum: [ ]

Feature 24 — Web: Boş Durumlar & Yükleme Ekranları

- Fuar listesi empty state (🏛 56px emoji, başlık, açıklama, CTA butonu)
- Müşteri listesi empty state (👥 ikonu + yönlendirme metni)
- Arama sonuçsuz durumu ("Arama sonucu bulunamadı.")
- Sayfa yükleme durumu (loaded === false iken tam sayfa ortalı "Yükleniyor..." mesajı)
  Durum: [ ]

Feature 25 — Web: Entegrasyon, Test & Son Düzenlemeler

- Backend ↔ Web uçtan uca akış testi (tüm CRUD operasyonları)
- Fuar oluştur → müşteri ekle → düzenle → sil → fuar sil akışı doğrulama
- Responsive tasarım kontrolü (1-3 kolon geçişleri)
- Edge case'ler (uzun metin, boş alanlar, özel karakterler)
- Performans optimizasyonu (TanStack Query cache stratejisi)
- Hata yönetimi (network error, validation error kullanıcı geri bildirimleri)
- Tüm modal'ların backdrop close davranışı doğrulama
- Conditional rendering kontrolleri (opsiyonel alanlar boşken gizli mi)
  Durum: [ ]

==============================
NOTLAR
==============================

- Toplam: 25 feature
- Kapsam: Backend + Web Admin Panel (mobil Faz 2'de)
- Sıralama: Altyapı (1-5) → Backend (6-12) → Frontend (13-25)
- Her feature tamamlandığında Durum alanı [x] olarak işaretlenir
- Feature numarası atlanmaz, sırayla ilerlenir
