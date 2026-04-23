"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { Game } from "@/types";

function resultLabel(g: Game): string {
  if (g.result === "draw") return "½–½";
  if (g.result === "white") return "1–0";
  if (g.result === "black") return "0–1";
  return g.result;
}

function myResult(g: Game, username: string): "win" | "loss" | "draw" {
  if (g.result === "draw") return "draw";
  const isWhite = g.white_player?.username === username;
  return (isWhite && g.result === "white") || (!isWhite && g.result === "black") ? "win" : "loss";
}

export default function HistoryPage() {
  const { user } = useAuthStore();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const url = user
      ? `/api/chess/history/${user.username}/`
      : "/api/chess/games/recent/";
    (async () => {
      try {
        const { data } = await api.get<Game[] | { results: Game[] }>(url);
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
  }, [user]);

  if (loading) return <div className="flex justify-center pt-24 text-gray-400">Loading…</div>;
  if (error)   return <div className="flex justify-center pt-24 text-red-400">{error}</div>;

  const isPersonal = !!user;

  return (
    <div className="max-w-3xl mx-auto px-4 pt-24 pb-16">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">
          {isPersonal ? "My Games" : "Recent Games"}
        </h1>
        <p className="text-sm text-gray-500">
          {isPersonal
            ? "All your finished games. Click Replay to step through moves."
            : "Latest finished games on the platform. Sign in to see your own history."}
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
            const res = isPersonal && user ? myResult(g, user.username) : null;
            const resColor =
              res === "win" ? "text-emerald-400" :
              res === "loss" ? "text-red-400" :
              "text-gray-400";
            return (
              <li key={g.id} className="card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium flex items-center gap-2 flex-wrap">
                    {res && (
                      <span className={`text-xs font-bold ${resColor} shrink-0`}>
                        {res === "win" ? "Win" : res === "loss" ? "Loss" : "Draw"}
                      </span>
                    )}
                    <span className="text-gray-200 truncate">{w}</span>
                    <span className="text-gray-500">vs</span>
                    <span className="text-gray-200 truncate">{b}</span>
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
