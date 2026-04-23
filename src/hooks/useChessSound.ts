"use client";
import { useCallback, useEffect, useRef } from "react";

type SoundType = "move" | "capture" | "check" | "win" | "loss" | "draw" | "notify";

function createAudioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    return new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  } catch {
    return null;
  }
}

function playTone(
  ctx: AudioContext,
  freq: number,
  duration: number,
  gain = 0.18,
  type: OscillatorType = "sine",
  startAt = 0,
) {
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + startAt);
  gainNode.gain.setValueAtTime(gain, ctx.currentTime + startAt);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startAt + duration);
  osc.connect(gainNode);
  gainNode.connect(ctx.destination);
  osc.start(ctx.currentTime + startAt);
  osc.stop(ctx.currentTime + startAt + duration);
}

const SOUNDS: Record<SoundType, (ctx: AudioContext) => void> = {
  move: (ctx) => {
    playTone(ctx, 440, 0.08, 0.12, "square");
    playTone(ctx, 660, 0.06, 0.08, "square", 0.06);
  },
  capture: (ctx) => {
    playTone(ctx, 280, 0.12, 0.15, "sawtooth");
    playTone(ctx, 200, 0.1,  0.12, "sawtooth", 0.07);
  },
  check: (ctx) => {
    playTone(ctx, 880, 0.08, 0.18, "sine");
    playTone(ctx, 1100, 0.07, 0.14, "sine", 0.09);
    playTone(ctx, 880, 0.06, 0.10, "sine", 0.18);
  },
  win: (ctx) => {
    [523, 659, 784, 1047].forEach((f, i) => playTone(ctx, f, 0.25, 0.16, "sine", i * 0.18));
  },
  loss: (ctx) => {
    [523, 440, 349, 262].forEach((f, i) => playTone(ctx, f, 0.25, 0.14, "sine", i * 0.18));
  },
  draw: (ctx) => {
    playTone(ctx, 440, 0.2, 0.14, "sine");
    playTone(ctx, 440, 0.2, 0.14, "sine", 0.25);
  },
  notify: (ctx) => {
    playTone(ctx, 660, 0.1, 0.14, "sine");
    playTone(ctx, 880, 0.1, 0.12, "sine", 0.12);
  },
};

export function useChessSound(enabled = true) {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback((): AudioContext | null => {
    if (!enabled) return null;
    if (!ctxRef.current) ctxRef.current = createAudioCtx();
    if (ctxRef.current?.state === "suspended") {
      ctxRef.current.resume().catch(() => {});
    }
    return ctxRef.current;
  }, [enabled]);

  const play = useCallback(
    (type: SoundType) => {
      const ctx = getCtx();
      if (!ctx) return;
      try {
        SOUNDS[type](ctx);
      } catch {
        // audio not supported
      }
    },
    [getCtx],
  );

  useEffect(() => {
    return () => {
      ctxRef.current?.close().catch(() => {});
    };
  }, []);

  return { play };
}
