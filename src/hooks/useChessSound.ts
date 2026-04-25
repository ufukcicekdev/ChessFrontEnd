"use client";
import { useCallback, useEffect, useRef } from "react";

export type SoundType = "move" | "capture" | "check" | "win" | "loss" | "draw" | "notify";

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

// Realistic wood thud: filtered noise burst + tonal transient
function woodHit(ctx: AudioContext, pitchMult = 1.0, gainMult = 1.0, offsetSec = 0) {
  const t = ctx.currentTime + offsetSec;
  const dur = 0.07;
  const sr = ctx.sampleRate;

  // Noise buffer for wood body
  const buf = ctx.createBuffer(1, Math.ceil(sr * dur), sr);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

  const src = ctx.createBufferSource();
  src.buffer = buf;

  // Bandpass: wood resonance range
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 1400 * pitchMult;
  bp.Q.value = 2.5;

  const gNoise = ctx.createGain();
  gNoise.gain.setValueAtTime(gainMult * 0.7, t);
  gNoise.gain.exponentialRampToValueAtTime(0.001, t + dur);

  src.connect(bp);
  bp.connect(gNoise);
  gNoise.connect(ctx.destination);
  src.start(t);
  src.stop(t + dur + 0.01);

  // Short tonal click on top
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.value = 800 * pitchMult;
  const gOsc = ctx.createGain();
  gOsc.gain.setValueAtTime(gainMult * 0.25, t);
  gOsc.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
  osc.connect(gOsc);
  gOsc.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.03);
}

function tone(ctx: AudioContext, freq: number, dur: number, gain = 0.15, type: OscillatorType = "sine", offset = 0) {
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
  move:    (c) => { woodHit(c, 1.0, 1.0); },
  capture: (c) => { woodHit(c, 0.7, 1.3); woodHit(c, 1.1, 0.6, 0.04); },
  check:   (c) => { woodHit(c, 1.3, 1.1); tone(c, 880, 0.12, 0.14, "sine", 0.05); },
  win:     (c) => { [523, 659, 784, 1047].forEach((f, i) => tone(c, f, 0.25, 0.16, "sine", i * 0.18)); },
  loss:    (c) => { [523, 440, 349, 262].forEach((f, i) => tone(c, f, 0.25, 0.14, "sine", i * 0.18)); },
  draw:    (c) => { tone(c, 440, 0.2, 0.14); tone(c, 440, 0.2, 0.14, "sine", 0.25); },
  notify:  (c) => { tone(c, 660, 0.1, 0.14); tone(c, 880, 0.1, 0.12, "sine", 0.12); },
};

export function useChessSound(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);

  const ensureReady = useCallback(async (): Promise<AudioContext | null> => {
    if (!enabled) return null;
    if (!ctxRef.current) ctxRef.current = createCtx();
    const ctx = ctxRef.current;
    if (!ctx) return null;
    if (ctx.state === "suspended") {
      try { await ctx.resume(); } catch { return null; }
    }
    return ctx.state === "running" ? ctx : null;
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

  useEffect(() => {
    if (!enabled) return;
    ensureReady().catch(() => {});
  }, [enabled, ensureReady]);

  useEffect(() => {
    return () => { ctxRef.current?.close().catch(() => {}); };
  }, []);

  return { play };
}
