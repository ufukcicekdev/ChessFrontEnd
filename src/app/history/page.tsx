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
        const { data } = await api.get<Game[]>("/api/chess/games/recent/");
        if (!cancelled) setGames(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setError("Could not load recent games.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <div className="flex justify-center pt-24 text-gray-400">Loading history…</div>;
  }

  if (error) {
    return <div className="flex justify-center pt-24 text-red-400">{error}</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pt-24 pb-16">
      <h1 className="text-2xl font-semibold mb-2">Recent games</h1>
      <p className="text-sm text-gray-500 mb-6">
        Finished games from the site. Open one to step through moves or autoplay like a broadcast.
      </p>

      {games.length === 0 ? (
        <div className="card text-center text-gray-400 py-10">No finished games yet.</div>
      ) : (
        <ul className="flex flex-col gap-2">
          {games.map((g) => {
            const w = g.white_player?.username ?? "White";
            const b = g.black_player?.username ?? "Black";
            const tc =
              typeof g.time_control === "number" && typeof g.increment === "number"
                ? `${g.time_control / 60}+${g.increment}`
                : null;
            return (
              <li key={g.id} className="card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">
                    <span className="text-gray-200">{w}</span>
                    <span className="text-gray-500 mx-1">vs</span>
                    <span className="text-gray-200">{b}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                    <span className="font-mono text-amber-400/90">{resultLabel(g)}</span>
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
