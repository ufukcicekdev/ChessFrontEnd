"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { Room } from "@/types";

const GLYPH: Record<string, string> = {
  K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙",
  k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟",
};

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";

/** Parse the piece-placement field of a FEN into 64 cells (a8..h1). */
function fenToCells(fen: string): string[] {
  const placement = (fen || START_FEN).split(" ")[0];
  const cells: string[] = [];
  for (const row of placement.split("/")) {
    for (const ch of row) {
      if (/\d/.test(ch)) {
        for (let i = 0; i < Number(ch); i++) cells.push("");
      } else {
        cells.push(GLYPH[ch] ?? "");
      }
    }
  }
  while (cells.length < 64) cells.push("");
  return cells.slice(0, 64);
}

function MiniBoard({ fen }: { fen: string }) {
  const cells = fenToCells(fen);
  return (
    <div className="inline-grid grid-cols-8 rounded-md overflow-hidden border border-black/10 shrink-0 shadow-sm">
      {cells.map((p, i) => {
        const isLight = (Math.floor(i / 8) + i) % 2 === 0;
        return (
          <div
            key={i}
            className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-[11px] sm:text-sm leading-none"
            style={{ background: isLight ? "#f0d9b5" : "#b58863", color: "#1a1a1a" }}
          >
            {p}
          </div>
        );
      })}
    </div>
  );
}

function fmtClock(seconds: number | undefined): string {
  if (seconds == null) return "--:--";
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

function PlayerTag({
  name,
  rating,
  title,
  align = "left",
}: {
  name: string;
  rating?: number;
  title?: string;
  align?: "left" | "right";
}) {
  return (
    <div className={`flex items-center gap-2.5 min-w-0 ${align === "right" ? "flex-row-reverse text-right" : ""}`}>
      <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-sm font-bold text-amber-400 shrink-0">
        {name?.[0]?.toUpperCase() ?? "?"}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          {title && (
            <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-1 py-0.5 rounded leading-none">
              {title}
            </span>
          )}
          <span className="text-sm font-semibold truncate">{name}</span>
        </div>
        <div className="text-xs text-gray-500 font-mono">{rating ?? "—"}</div>
      </div>
    </div>
  );
}

export default function LiveGamesPreview({ limit = 2 }: { limit?: number }) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      api
        .get("/api/chess/rooms/?status=active")
        .then(({ data }) => {
          if (cancelled) return;
          const list: Room[] = data.results ?? data ?? [];
          setRooms(list.filter((r) => r.game?.white_player && r.game?.black_player));
        })
        .catch(() => {})
        .finally(() => !cancelled && setLoading(false));
    load();
    const t = setInterval(load, 10000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className="card h-24 animate-pulse bg-white/[0.02]" />
        ))}
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="card flex flex-col sm:flex-row items-center justify-between gap-4 py-8">
        <div className="flex items-center gap-3 text-gray-500">
          <span className="text-3xl opacity-40">♟</span>
          <span className="text-sm font-medium">No live games right now — be the first to start one.</span>
        </div>
        <Link href="/play" className="btn-primary text-sm px-6">Play Now →</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rooms.slice(0, limit).map((room) => {
        const g = room.game!;
        return (
          <div key={room.id} className="card flex items-center gap-4 sm:gap-6 flex-wrap sm:flex-nowrap">
            <div className="flex-1 min-w-[120px]">
              <PlayerTag
                name={g.white_player!.username}
                rating={g.white_player!.rating}
                title={g.white_player!.title}
              />
            </div>

            <span className="text-xs font-bold text-gray-500 shrink-0">VS</span>

            <MiniBoard fen={g.fen} />

            <div className="flex-1 min-w-[120px] flex justify-end">
              <PlayerTag
                name={g.black_player!.username}
                rating={g.black_player!.rating}
                title={g.black_player!.title}
                align="right"
              />
            </div>

            <div className="flex items-center gap-3 shrink-0 ml-auto sm:ml-0">
              <div className="flex flex-col items-center gap-1">
                <span className="badge-green flex items-center gap-1.5 text-[10px]">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />LIVE
                </span>
                <span className="font-mono text-xs text-gray-400">{fmtClock(g.white_time_remaining)}</span>
              </div>
              <Link href={`/room/${room.id}`} className="btn-primary text-sm px-5 py-2">
                Watch
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
