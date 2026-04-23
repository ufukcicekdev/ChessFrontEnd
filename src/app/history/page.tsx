"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import type { Game } from "@/types";

function resultLabel(g: Game): string {
  if (g.result === "draw") return "½–½";
  if (g.result === "white") return "1–0";
  if (g.result === "black") return "0–1";
  return g.result;
}

export default function HistoryPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get<Game[] | { results: Game[] }>("/api/chess/games/recent/");
        if (!cancelled) {
          const list = Array.isArray(data) ? data : (data as { results: Game[] }).results ?? [];
          setGames(list);
        }
      } catch {
        if (!cancelled) setError("Could not load games.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="flex justify-center pt-24 text-gray-400">Loading…</div>;
  if (error)   return <div className="flex justify-center pt-24 text-red-400">{error}</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 pt-24 pb-16">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Game History</h1>
        <p className="text-sm text-gray-500">
          All finished games on the platform. Click Replay to step through any game move by move.
        </p>
      </div>

      {games.length === 0 ? (
        <div className="card text-center text-gray-400 py-10">No games yet.</div>
      ) : (
        <ul className="flex flex-col gap-2">
          {games.map((g) => {
            const w  = g.white_player?.username ?? "White";
            const b  = g.black_player?.username ?? "Black";
            const tc = typeof g.time_control === "number"
              ? `${g.time_control / 60}+${g.increment ?? 0}`
              : null;
            return (
              <li key={g.id} className="card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium flex items-center gap-2 flex-wrap">
                    <Link href={`/profile/${w}`} className="text-gray-200 hover:text-amber-400 transition-colors truncate">{w}</Link>
                    <span className="text-amber-400/80 font-mono text-xs shrink-0">{resultLabel(g)}</span>
                    <Link href={`/profile/${b}`} className="text-gray-200 hover:text-amber-400 transition-colors truncate">{b}</Link>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                    {g.ended_at && <span>{new Date(g.ended_at).toLocaleString()}</span>}
                    {tc && <span>{tc} min</span>}
                    <span>{g.moves?.length ?? 0} moves</span>
                  </div>
                </div>
                <Link href={`/games/${g.id}/review`} className="btn-secondary text-sm text-center shrink-0">
                  Replay
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
