# fianchess — Native mobil uygulama (iOS + Android)

Uygulama, **Capacitor** ile iOS ve Android'de native bir uygulama olarak paketlenir.
Native kabuk, canlı Next.js sitesini `server.url` üzerinden yükler — böylece SSR,
gerçek-zamanlı oyun odaları, WebSocket, Firebase ve ödemeler **hiçbir yeniden yazım
olmadan** aynen çalışır. Web ve app tek kod tabanını paylaşır.

**Yüklenen adres (`server.url`):** `https://chessfrontend-production-da79.up.railway.app`
(Railway prod deploy'u).

> **Not — `fianchess.com` şu an bağlı değil:** Alan adı hâlâ bir GoDaddy Airo park
> sayfasına gidiyor, Railway deploy'una yönlendirilmemiş. Domain hazır olduğunda tek
> yapılacak: `capacitor.config.ts` içindeki `serverUrl`'i (ve `allowNavigation` +
> `src/lib/native.ts` `inAppHosts`) `fianchess.com`'a çevirip `npx cap sync` çalıştırmak.

## Yapı

| Öğe | Yer |
| --- | --- |
| Capacitor config | `capacitor.config.ts` |
| Offline/yükleniyor ekranı (fallback) | `www/index.html` |
| Native köprü (status bar, splash, geri tuşu, deep link, dış link) | `src/lib/native.ts` |
| Native köprü mount + native push kaydı | `src/components/NativeBridge.tsx` |
| iOS projesi (Xcode) | `ios/` |
| Android projesi (Android Studio) | `android/` |
| İkon/splash kaynak görseli | `assets/logo.png` |

- **App ID:** `com.fianchess.app`
- **App adı:** `fianchess`

## Günlük geliştirme akışı

Web/JS değişikliği yaptıktan sonra native projelere işlemek için:

```bash
npm run build          # (yalnızca www/ değişirse gerekir; server.url modunda çoğu değişiklik canlı siteden gelir)
npx cap sync           # config + web assets + pluginleri iOS/Android'e kopyalar
npx cap open ios       # Xcode'da aç
npx cap open android   # Android Studio'da aç
```

`server.url` prod'a baktığı için, siteyi deploy ettiğinde app otomatik olarak güncel
içeriği gösterir — her JS değişikliğinde yeni build yüklemene gerek yok.

### Yerel dev sunucusuna bağlanmak

Telefonda yerel Next dev sunucusunu test etmek için (aynı Wi-Fi):

```bash
CAP_SERVER_URL=http://<bilgisayar-LAN-IP>:3000 npx cap sync
CAP_SERVER_URL=http://<bilgisayar-LAN-IP>:3000 npx cap run ios      # veya android
```

### Android debug APK (doğrulandı ✅)

```bash
cd android && ./gradlew assembleDebug
# çıktı: android/app/build/outputs/apk/debug/app-debug.apk
```

## Kalan manuel adımlar (senin hesapların gerekiyor)

Kod tarafı hazır; aşağıdakiler Firebase/Apple/Google hesaplarını gerektirdiği için
konsol üzerinden yapılmalı:

### Native push (FCM) — ✅ KOD TARAFI HAZIR (iOS + Android)
Firebase Console → proje **fianchess** içinde Android + iOS app'leri oluşturuldu,
push tek plugin ile birleştirildi: **`@capacitor-firebase/messaging`** (iOS ve
Android'de gerçek **FCM token** verir). Token mevcut backend ucuna gidiyor
(`POST /api/users/fcm-token/`), web ile aynı → backend'de ek iş yok.

- ✅ `android/app/google-services.json` → APK Firebase Messaging ile derleniyor.
- ✅ `ios/App/App/GoogleService-Info.plist` → Xcode App target'ına **script'le eklendi**.
- ✅ iOS `AppDelegate.swift`'e APNs yönlendirme metodları eklendi.
- ✅ iOS `App.entitlements` (`aps-environment`) + `Info.plist` remote-notification
  background mode eklendi, build ayarına bağlandı.
- ✅ Her iki platform da derleniyor; iOS simülatörde çalışıyor.

### 1. iOS imzalama + push aktivasyonu (Apple Developer hesabı gerekli)
Kod hazır; şu iki adım Apple hesabını gerektirir:
- **Signing:** `npx cap open ios` → Signing & Capabilities → **Team** seç
  (bundle: `com.fianchess.app`). Gerçek cihaz / TestFlight için şart.
- **APNs:** developer.apple.com → APNs Auth Key (.p8) oluştur → Firebase Console →
  Project Settings → Cloud Messaging → Apple app configuration'a yükle. Gerçek
  push'un iPhone'a ulaşması için şart. (Simülatörde push token gelmez, bu normaldir.)
- Deep link istiyorsan **Associated Domains** ekle: `applinks:<domain>`.

> Not: `aps-environment` şu an `development`. TestFlight/App Store dağıtımı için
> Xcode dağıtım profili bunu otomatik `production`'a çevirir.

### 2. Android release imzalama (Play Console)
- Release keystore oluştur, `android/app/build.gradle`'da signingConfig tanımla.
- `./gradlew bundleRelease` ile `.aab` üret, Play Console'a yükle.

### 3. Deep link (opsiyonel ama önerilir)
Push/paylaşım linklerinin app içinde açılması için domainde doğrulama dosyaları
(domain bağlandığında):
- iOS: `https://<domain>/.well-known/apple-app-site-association`
- Android: `https://<domain>/.well-known/assetlinks.json`

### 5. App Store notu
Apple, "sadece web sitesi kabuğu" uygulamalara katı bakar. Native push + native geçişler
mevcut olduğu için genelde geçer; reddi azaltmak için uygulama-içi değerin (oyun deneyimi)
belirgin olması yeterli. **Şu an dijital abonelik/IAP yok** — ileride tek seferlik satın alma
eklenirse Apple IAP (StoreKit) gerekir, Stripe kabul edilmez.
