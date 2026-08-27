// Capacitor native-shell helpers.
//
// The web build is loaded inside the native iOS/Android app (Capacitor) via
// server.url. Everything here is a no-op in a normal browser, so the same
// build runs on the web and inside the app.
import { Capacitor } from "@capacitor/core";

/** True only when running inside the native iOS/Android shell. */
export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

export function nativePlatform(): "ios" | "android" | "web" {
  return Capacitor.getPlatform() as "ios" | "android" | "web";
}

/**
 * One-time native setup: status bar, splash hide, Android back button,
 * external links → system browser, and deep links → in-app navigation.
 * `navigate` should push a client-side route (e.g. Next's router.push).
 */
export async function initNativeShell(navigate: (path: string) => void): Promise<void> {
  if (!isNative()) return;

  // Lets CSS target the native shell (e.g. safe-area insets for the notch).
  document.documentElement.classList.add("native-app", `native-${nativePlatform()}`);

  const [{ StatusBar, Style }, { SplashScreen }, { App }, { Browser }] = await Promise.all([
    import("@capacitor/status-bar"),
    import("@capacitor/splash-screen"),
    import("@capacitor/app"),
    import("@capacitor/browser"),
  ]);

  // Dark theme status bar to match the app background.
  try {
    await StatusBar.setStyle({ style: Style.Dark });
    if (nativePlatform() === "android") {
      await StatusBar.setBackgroundColor({ color: "#0a0a0f" });
    }
  } catch {
    /* status bar not critical */
  }

  // Hide the splash once the site is interactive.
  try {
    await SplashScreen.hide();
  } catch {
    /* ignore */
  }

  // Android hardware back button: go back in history, or exit at the root.
  App.addListener("backButton", ({ canGoBack }) => {
    if (canGoBack && window.history.length > 1) {
      window.history.back();
    } else {
      App.exitApp();
    }
  });

  // Deep links (universal links / app links) → in-app navigation.
  App.addListener("appUrlOpen", ({ url }) => {
    try {
      const u = new URL(url);
      const path = `${u.pathname}${u.search}${u.hash}` || "/";
      navigate(path);
    } catch {
      /* ignore malformed */
    }
  });

  // Open off-domain links in the system browser instead of trapping the
  // WebView on an external page.
  const inAppHosts = [
    "chessfrontend-production-da79.up.railway.app",
    "chessbackend-production-7a57.up.railway.app",
    "accounts.google.com",
    "js.stripe.com",
  ];
  document.addEventListener(
    "click",
    (e) => {
      const anchor = (e.target as HTMLElement)?.closest?.("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("/")) return;
      let host: string;
      try {
        host = new URL(href, window.location.href).host;
      } catch {
        return;
      }
      const external =
        /^https?:/i.test(href) &&
        !inAppHosts.some((h) => host === h || host.endsWith(`.${h}`));
      if (external) {
        e.preventDefault();
        Browser.open({ url: href });
      }
    },
    true,
  );
}

/**
 * Register the device for native push via Firebase Cloud Messaging and hand the
 * FCM token to `onToken`, which should POST it to the backend (same endpoint the
 * web uses). Notification taps call `onNavigate`. Works on both iOS and Android
 * and returns a real FCM token on both. No-op on web.
 */
export async function initNativePush(
  onToken: (token: string) => void | Promise<void>,
  onNavigate: (path: string) => void,
): Promise<void> {
  if (!isNative()) return;

  const { FirebaseMessaging } = await import("@capacitor-firebase/messaging");

  const perm = await FirebaseMessaging.checkPermissions();
  let receive = perm.receive;
  if (receive === "prompt" || receive === "prompt-with-rationale") {
    receive = (await FirebaseMessaging.requestPermissions()).receive;
  }
  if (receive !== "granted") return;

  // Token can arrive now and again on refresh.
  await FirebaseMessaging.addListener("tokenReceived", (event) => {
    if (event?.token) onToken(event.token);
  });

  // Notification tapped by the user → deep-link into the app.
  await FirebaseMessaging.addListener("notificationActionPerformed", (event) => {
    const data = (event.notification?.data ?? {}) as Record<string, unknown>;
    const link = (data.link as string) || "/";
    onNavigate(link);
  });

  try {
    const { token } = await FirebaseMessaging.getToken();
    if (token) await onToken(token);
  } catch {
    /* getToken can fail before APNs is ready on iOS; tokenReceived covers it */
  }
}
