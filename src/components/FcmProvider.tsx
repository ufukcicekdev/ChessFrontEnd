"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import { firebaseConfigured, requestFcmToken, onForegroundMessage } from "@/lib/firebase";

/**
 * Registers the browser's FCM token with the backend after login and surfaces
 * foreground push messages. Renders nothing. No-op when Firebase isn't configured.
 */
export default function FcmProvider() {
  const { token } = useAuthStore();
  const router = useRouter();
  const registeredToken = useRef<string | null>(null);

  useEffect(() => {
    if (!token || !firebaseConfigured()) return;
    let unsub: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      const fcmToken = await requestFcmToken();
      if (cancelled || !fcmToken) return;

      if (registeredToken.current !== fcmToken) {
        registeredToken.current = fcmToken;
        try {
          await api.post("/api/users/fcm-token/", { token: fcmToken });
        } catch {
          /* ignore */
        }
      }

      unsub = await onForegroundMessage((payload) => {
        const title = payload.notification?.title ?? "fianchess";
        const body = payload.notification?.body ?? "";
        const link = (payload.data?.link as string) || "/";

        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          const n = new Notification(title, { body, icon: "/fianchess-emblem.jpg" });
          n.onclick = () => {
            window.focus();
            router.push(link);
            n.close();
          };
        }
      });
    })();

    return () => {
      cancelled = true;
      if (unsub) unsub();
    };
  }, [token, router]);

  return null;
}
