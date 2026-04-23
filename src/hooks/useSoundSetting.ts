"use client";
import { useCallback, useEffect, useState } from "react";
import { getSoundEnabled, setSoundEnabled, SOUND_KEY } from "./useChessSound";

export function useSoundSetting() {
  const [enabled, setEnabled] = useState(getSoundEnabled);

  // Sync across tabs/windows
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === SOUND_KEY) setEnabled(e.newValue !== "false");
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      setSoundEnabled(!prev);
      return !prev;
    });
  }, []);

  return { enabled, toggle };
}
