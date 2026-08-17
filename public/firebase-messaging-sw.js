/* Firebase Cloud Messaging service worker (background push).
 * Config is passed via query string at registration time (see src/lib/firebase.ts),
 * so this file needs no manual editing.
 */
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

const params = new URLSearchParams(self.location.search);
const firebaseConfig = {
  apiKey: params.get("apiKey"),
  authDomain: params.get("authDomain"),
  projectId: params.get("projectId"),
  storageBucket: params.get("storageBucket"),
  messagingSenderId: params.get("messagingSenderId"),
  appId: params.get("appId"),
};

if (firebaseConfig.apiKey) {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const title = (payload.notification && payload.notification.title) || "fianchess";
    const body = (payload.notification && payload.notification.body) || "";
    const data = payload.data || {};
    self.registration.showNotification(title, {
      body,
      icon: "/fianchess-emblem.jpg",
      badge: "/fianchess-emblem.jpg",
      data,
      tag: data.room_id || data.type || "fianchess",
    });
  });
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if (w.url.includes(link) && "focus" in w) return w.focus();
      }
      if (clients.openWindow) return clients.openWindow(link);
    }),
  );
});
