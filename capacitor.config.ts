import type { CapacitorConfig } from "@capacitor/cli";

/**
 * fianchess native shell (Capacitor).
 *
 * The app is an online, real-time multiplayer chess platform, so the native
 * iOS/Android build loads the live Next.js site (server.url) rather than a
 * static export. This keeps SSR, dynamic game rooms, WebSocket, Firebase and
 * payments working with zero rewrite. `webDir` (www/) is only a local fallback
 * shown while the site loads or if the device is offline.
 *
 * For local development against the dev server, set CAP_SERVER_URL, e.g.
 *   CAP_SERVER_URL=http://192.168.1.20:3000 npx cap run ios
 */
const serverUrl =
  process.env.CAP_SERVER_URL || "https://chessfrontend-production-da79.up.railway.app";

const config: CapacitorConfig = {
  appId: "com.fianchess.app",
  appName: "fianchess",
  webDir: "www",
  server: {
    url: serverUrl,
    cleartext: serverUrl.startsWith("http://"),
    // Origins the WebView is allowed to navigate to in-app (OAuth, backend, payments).
    allowNavigation: [
      "chessfrontend-production-da79.up.railway.app",
      "chessbackend-production-7a57.up.railway.app",
      "*.up.railway.app",
      "*.firebaseapp.com",
      "*.google.com",
      "accounts.google.com",
      "*.gstatic.com",
      "*.stripe.com",
      "js.stripe.com",
    ],
  },
  backgroundColor: "#0a0a0f",
  ios: {
    contentInset: "always",
    backgroundColor: "#0a0a0f",
    limitsNavigationsToAppBoundDomains: false,
  },
  android: {
    allowMixedContent: false,
    backgroundColor: "#0a0a0f",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: "#0a0a0f",
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
    },
    Keyboard: {
      resize: "native",
    },
  },
};

export default config;
