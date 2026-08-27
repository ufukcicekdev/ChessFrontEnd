"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import { isNative, initNativeShell, initNativePush } from "@/lib/native";

/**
 * Boots the Capacitor native shell when the site runs inside the iOS/Android
 * app: status bar, splash, back button, deep links, and native FCM push.
 * Renders nothing and is a no-op in a normal browser.
 */
export default function NativeBridge() {
  const { token } = useAuthStore();
  const router = useRouter();
  const shellReady = useRef(false);
  const registeredToken = useRef<string | null>(null);

  // Native shell setup — once per app launch.
  useEffect(() => {
    if (!isNative() || shellReady.current) return;
    shellReady.current = true;
    initNativeShell((path) => router.push(path));
  }, [router]);

  // Native push — register after auth so the token maps to a user.
  useEffect(() => {
    if (!isNative() || !token) return;
    initNativePush(
      async (fcmToken) => {
        if (registeredToken.current === fcmToken) return;
        registeredToken.current = fcmToken;
        try {
          await api.post("/api/users/fcm-token/", { token: fcmToken });
        } catch {
          /* ignore */
        }
      },
      (path) => router.push(path),
    );
  }, [token, router]);

  return null;
}
