# Mobil Uygulamayı Fiziksel Cihazda Test Etme

Bu rehber, Fuar CRM mobil uygulamasını fiziksel iPhone'unuzda çalıştırmak için gereken adımları açıklar.

## Ön Koşullar

- Mac ve iPhone **aynı Wi‑Fi ağında** olmalı
- iPhone'da **Expo Go** uygulaması yüklü olmalı

### ⚠️ Önemli: SDK 55 Uyumluluğu

Bu proje **Expo SDK 55** kullanıyor. App Store'daki Expo Go hâlâ SDK 54'tür ve projeyle uyumlu değildir.

**Çözüm:** TestFlight üzerinden Expo Go SDK 55 beta sürümünü yükleyin:

1. App Store'dan **TestFlight** uygulamasını indirin
2. iPhone'da şu bağlantıyı açın: **https://testflight.apple.com/join/GZJxxfUU**
3. "Accept" ile Expo Go beta sürümünü TestFlight'a ekleyin
4. TestFlight içinden **Expo Go**'yu yükleyin (App Store sürümünün üzerine yazacaktır)

Bu sürüm SDK 55 projeleriyle uyumludur.

---

## Adım 1: Mac IP Adresini Öğrenin

Terminal'de çalıştırın:

```bash
ipconfig getifaddr en0
```

Örnek çıktı: `192.168.1.8`

> **Not:** IP adresi değişebilir (Wi‑Fi değişikliği, router yeniden başlatma). Her test öncesi kontrol edin.

---

## Adım 2: Mobil .env Dosyasını Güncelleyin

`apps/mobile/.env` dosyasında `EXPO_PUBLIC_API_URL` değerini Mac IP'niz ile değiştirin:

```
EXPO_PUBLIC_API_URL=http://192.168.1.8:3001/api/v1
```

> `192.168.1.8` yerine Adım 1'de aldığınız IP'yi yazın.

---

## Adım 3: API Sunucusunu Başlatın

Yeni bir terminal penceresinde:

```bash
cd /Users/semihdilekci/Documents/CRMProje
npm run start:dev -w apps/api
```

API `http://localhost:3001` üzerinde çalışacak. Aynı makinede `0.0.0.0` üzerinden de erişilebilir olacaktır (fiziksel cihaz için gerekli).

---

## Adım 4: Expo Geliştirme Sunucusunu Başlatın

Başka bir terminal penceresinde:

```bash
cd /Users/semihdilekci/Documents/CRMProje
npm run start -w apps/mobile
```

veya:

```bash
cd apps/mobile && npx expo start
```

Terminal'de bir **QR kod** görünecektir.

---

## Adım 5: iPhone'da Uygulamayı Açın

1. iPhone'da **Expo Go** uygulamasını açın
2. **Kamera** ile terminaldeki QR kodu tarayın
3. "Open in Expo Go" ile uygulama açılacak

> **Alternatif:** Mac ve telefon aynı Wi‑Fi / hotspot’ta değilse veya AP izolasyonu varsa önce ağı düzeltin; QR için `npm run start:lan` ile Metro’nun verdiği adresi kullanın.

---

## Sorun Giderme

### "Unable to connect" / Bağlantı hatası
- Mac ve iPhone aynı Wi‑Fi'de mi kontrol edin
- `.env` içindeki IP doğru mu kontrol edin
- Mac firewall API portunu (3001) engelliyor olabilir; geçici olarak kapatmayı deneyin

### API'ye ulaşamıyor
- API sunucusu çalışıyor mu kontrol edin
- Tarayıcıda `http://192.168.1.8:3001/api/v1` adresini açın; JSON yanıt görmelisiniz

### QR kod taranmıyor
- `npm run start:lan` ile Metro’nun yazdığı `exp://` / QR’yı kullanın; Mac firewall Expo/Node için izin vermeli
- Veya USB ile bağlayıp `npx expo run:ios --device` kullanın (Xcode gerekir)

---

## Farklı Ekran Boyutları ve Safe Area

Uygulama farklı cihazlarda test edilmeli:

- **Küçük ekran** (örn. iPhone SE): Fuarlar listesi, formlar, tab bar düzgün görünmeli
- **Büyük ekran** (örn. iPhone Pro Max): İçerik taşmamalı, boşluklar makul olmalı
- **Safe area**: Tab bar ve BottomSheet home indicator (iPhone X+) alanına saygı duymalı

Simülatörde farklı cihazlar: Xcode → Window → Devices and Simulators → farklı iPhone modelleri.

---

## Offline / Network Kesintisi Simülasyonu

Ağ hatası ve retry akışını test etmek için:

### Yöntem 1: Uçak modu
1. Uygulamayı açın, fuarlar listesini yükleyin
2. Uçak modunu açın (veya Wi‑Fi’yi kapatın)
3. Listeyi yenileyin veya başka bir sayfaya gidin
4. "Sunucuya bağlanılamıyor" mesajı ve "Tekrar Dene" butonu görünmeli
5. Uçak modunu kapatın, "Tekrar Dene"ye basın — veri yüklenmeli

### Yöntem 2: Yanlış API URL
1. `apps/mobile/.env` içinde `EXPO_PUBLIC_API_URL` değerini geçersiz yapın (örn. `http://192.168.1.99:9999/api/v1`)
2. Uygulamayı yeniden başlatın
3. Login veya fuarlar sayfasında hata + retry görünmeli

### Yöntem 3: API sunucusunu durdurmak
1. API çalışırken uygulamayı açın
2. API sunucusunu durdurun (`Ctrl+C`)
3. Uygulamada sayfa değiştirin veya yenileyin
4. Hata + retry görünmeli

---

## Test Sonrası

Simülatörde çalışmaya geri dönmek için `apps/mobile/.env` dosyasında:

```
EXPO_PUBLIC_API_URL=http://localhost:3001/api/v1
```

olarak geri alabilirsiniz.
