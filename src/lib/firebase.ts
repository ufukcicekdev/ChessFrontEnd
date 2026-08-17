// Firebase Cloud Messaging (web push) client helpers.
// All values come from NEXT_PUBLIC_FIREBASE_* env vars. If they're absent the
// helpers become no-ops, so the app runs fine without Firebase configured.
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
  type Messaging,
  type MessagePayload,
} from "firebase/messaging";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export function firebaseConfigured(): boolean {
  return Boolean(
    config.apiKey && config.projectId && config.messagingSenderId && config.appId && VAPID_KEY,
  );
}

let app: FirebaseApp | null = null;
function getFirebaseApp(): FirebaseApp | null {
  if (!firebaseConfigured()) return null;
  if (!app) app = getApps().length ? getApps()[0] : initializeApp(config);
  return app;
}

async function getMessagingIfSupported(): Promise<Messaging | null> {
  if (typeof window === "undefined") return null;
  const a = getFirebaseApp();
  if (!a) return null;
  try {
    if (!(await isSupported())) return null;
  } catch {
    return null;
  }
  return getMessaging(a);
}

/** Ask for notification permission and return an FCM token, or null. */
export async function requestFcmToken(): Promise<string | null> {
  const messaging = await getMessagingIfSupported();
  if (!messaging) return null;
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return null;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  try {
    // Pass the (public) config to the service worker via query string so the
    // SW file itself needs no hardcoded values / manual editing.
    const swParams = new URLSearchParams({
      apiKey: config.apiKey ?? "",
      authDomain: config.authDomain ?? "",
      projectId: config.projectId ?? "",
      storageBucket: config.storageBucket ?? "",
      messagingSenderId: config.messagingSenderId ?? "",
      appId: config.appId ?? "",
    });
    const registration = await navigator.serviceWorker.register(
      `/firebase-messaging-sw.js?${swParams.toString()}`,
    );
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    return token || null;
  } catch {
    return null;
  }
}

/** Subscribe to foreground messages. Returns an unsubscribe function. */
export async function onForegroundMessage(
  cb: (payload: MessagePayload) => void,
): Promise<() => void> {
  const messaging = await getMessagingIfSupported();
  if (!messaging) return () => {};
  return onMessage(messaging, cb);
}
