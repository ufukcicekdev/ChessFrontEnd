"use client";
import { useCallback, useEffect, useRef } from "react";

type SoundType = "move" | "capture" | "check" | "win" | "loss" | "draw" | "notify";

export const SOUND_KEY = "chess_sound_enabled";

export function getSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const val = localStorage.getItem(SOUND_KEY);
  return val === null ? true : val === "true";
}

export function setSoundEnabled(v: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SOUND_KEY, String(v));
}

function createCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    return new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  } catch { return null; }
}

function tone(
  ctx: AudioContext,
  freq: number,
  dur: number,
  gain = 0.15,
  type: OscillatorType = "sine",
  offset = 0,
) {
  const t = ctx.currentTime + offset;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + dur);
}

const SOUNDS: Record<SoundType, (ctx: AudioContext) => void> = {
  move:    (c) => { tone(c, 440, 0.08, 0.12, "square"); tone(c, 660, 0.06, 0.08, "square", 0.06); },
  capture: (c) => { tone(c, 280, 0.12, 0.15, "sawtooth"); tone(c, 200, 0.10, 0.12, "sawtooth", 0.07); },
  check:   (c) => { tone(c, 880, 0.08, 0.18); tone(c, 1100, 0.07, 0.14, "sine", 0.09); tone(c, 880, 0.06, 0.10, "sine", 0.18); },
  win:     (c) => { [523, 659, 784, 1047].forEach((f, i) => tone(c, f, 0.25, 0.16, "sine", i * 0.18)); },
  loss:    (c) => { [523, 440, 349, 262].forEach((f, i) => tone(c, f, 0.25, 0.14, "sine", i * 0.18)); },
  draw:    (c) => { tone(c, 440, 0.2, 0.14); tone(c, 440, 0.2, 0.14, "sine", 0.25); },
  notify:  (c) => { tone(c, 660, 0.1, 0.14); tone(c, 880, 0.1, 0.12, "sine", 0.12); },
};

export function useChessSound(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  const readyRef = useRef(false);

  const ensureReady = useCallback(async (): Promise<AudioContext | null> => {
    if (!enabled) return null;
    if (!ctxRef.current) {
      ctxRef.current = createCtx();
      readyRef.current = false;
    }
    const ctx = ctxRef.current;
    if (!ctx) return null;
    if (ctx.state === "suspended") {
      try { await ctx.resume(); } catch { return null; }
    }
    readyRef.current = ctx.state === "running";
    return readyRef.current ? ctx : null;
  }, [enabled]);

  const play = useCallback(
    (type: SoundType) => {
      ensureReady().then((ctx) => {
        if (!ctx) return;
        try { SOUNDS[type](ctx); } catch { /* audio not supported */ }
      });
    },
    [ensureReady],
  );

  // Warm up context on mount so it's ready by first move
  useEffect(() => {
    if (!enabled) return;
    ensureReady().catch(() => {});
  }, [enabled, ensureReady]);

  useEffect(() => {
    return () => { ctxRef.current?.close().catch(() => {}); };
  }, []);

  return { play };
}
