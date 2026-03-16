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

> **Alternatif:** QR kod çalışmazsa `expo start --tunnel` kullanın (ngrok tüneli; ilk seferde `npx expo install @expo/ngrok` gerekebilir).

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
- `npx expo start --tunnel` ile tünel modunu deneyin
- Veya USB ile bağlayıp `npx expo run:ios --device` kullanın (Xcode gerekir)

---

## Test Sonrası

Simülatörde çalışmaya geri dönmek için `apps/mobile/.env` dosyasında:

```
EXPO_PUBLIC_API_URL=http://localhost:3001/api/v1
```

olarak geri alabilirsiniz.
