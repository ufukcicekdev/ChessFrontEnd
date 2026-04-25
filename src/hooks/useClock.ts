"use client";
import { useEffect, useRef, useState } from "react";
import { GameColor } from "@/types";

export function useClock(
  serverWhite: number,
  serverBlack: number,
  activeSide: GameColor | null,
) {
  const [whiteTime, setWhiteTime] = useState(serverWhite);
  const [blackTime, setBlackTime] = useState(serverBlack);

  // Snapshot: times + timestamp when server last sent them + which side is active
  const snap = useRef({ white: serverWhite, black: serverBlack, ts: Date.now(), side: activeSide });

  useEffect(() => {
    snap.current = { white: serverWhite, black: serverBlack, ts: Date.now(), side: activeSide };
    setWhiteTime(serverWhite);
    setBlackTime(serverBlack);
  }, [serverWhite, serverBlack, activeSide]);

  // Single 100ms interval — accurate because we measure real elapsed time
  useEffect(() => {
    const id = setInterval(() => {
      const { white, black, ts, side } = snap.current;
      const elapsed = (Date.now() - ts) / 1000;
      if (side === "white") setWhiteTime(Math.max(0, white - elapsed));
      else if (side === "black") setBlackTime(Math.max(0, black - elapsed));
    }, 100);
    return () => clearInterval(id);
  }, []);

  const formatTime = (secs: number): string => {
    if (secs < 20) {
      const s = Math.floor(secs);
      const tenths = Math.floor((secs % 1) * 10);
      return `${s}.${tenths}`;
    }
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs) % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  return { whiteTime, blackTime, formatTime };
}
