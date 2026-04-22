"use client";
import { useEffect, useRef, useState } from "react";
import { GameColor } from "@/types";

export function useClock(
  initialWhite: number,
  initialBlack: number,
  activeSide: GameColor | null
) {
  const [whiteTime, setWhiteTime] = useState(initialWhite);
  const [blackTime, setBlackTime] = useState(initialBlack);
  const interval = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    setWhiteTime(initialWhite);
    setBlackTime(initialBlack);
  }, [initialWhite, initialBlack]);

  useEffect(() => {
    clearInterval(interval.current);
    if (!activeSide) return;

    interval.current = setInterval(() => {
      if (activeSide === "white") {
        setWhiteTime((t) => Math.max(0, t - 1));
      } else {
        setBlackTime((t) => Math.max(0, t - 1));
      }
    }, 1000);

    return () => clearInterval(interval.current);
  }, [activeSide]);

  const format = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  return { whiteTime, blackTime, formatTime: format };
}
