"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

export interface PlatformStats {
  live_games: number;
  players_in_live_games: number;
  users_active_last_15m: number;
  rooms_waiting: number;
  games_finished_today: number;
  matchmaking_queue: number;
  registered_users: number;
  active_users_window_minutes: number;
}

const empty: PlatformStats = {
  live_games: 0,
  players_in_live_games: 0,
  users_active_last_15m: 0,
  rooms_waiting: 0,
  games_finished_today: 0,
  matchmaking_queue: 0,
  registered_users: 0,
  active_users_window_minutes: 15,
};

type Variant = "hero" | "compact";

export default function LivePlatformStats({
  variant = "hero",
  pollMs = 30000,
}: {
  variant?: Variant;
  pollMs?: number;
}) {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { data } = await api.get<PlatformStats>("/api/chess/stats/");
        if (!cancelled) {
          setStats(data);
          setError(false);
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setStats((s) => s ?? null);
        }
      }
    };

    load();
    const id = window.setInterval(load, pollMs);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [pollMs]);

  const s = stats ?? empty;
  const win = s.active_users_window_minutes || 15;

  if (variant === "compact") {
    return (
      <div
        className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs ${
          error ? "text-red-400/90" : "text-gray-500"
        }`}
      >
        <span>
          <span className="text-amber-400/90 font-mono font-semibold">{s.live_games}</span> live games
        </span>
        <span className="text-gray-600">·</span>
        <span>
          <span className="text-amber-400/90 font-mono font-semibold">{s.players_in_live_games}</span> in play
        </span>
        <span className="text-gray-600">·</span>
        <span>
          <span className="text-amber-400/90 font-mono font-semibold">{s.users_active_last_15m}</span> active ({win}m)
        </span>
        {s.matchmaking_queue > 0 && (
          <>
            <span className="text-gray-600">·</span>
            <span>
              <span className="text-violet-300 font-mono font-semibold">{s.matchmaking_queue}</span> in queue
            </span>
          </>
        )}
      </div>
    );
  }

  const cards = [
    { value: s.users_active_last_15m, label: `Active users (${win}m)` },
    { value: s.players_in_live_games, label: "Players in live games" },
    { value: s.live_games, label: "Live games" },
    { value: s.games_finished_today, label: "Games finished today" },
  ];

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="card text-center">
          <div
            className={`text-2xl sm:text-3xl font-black mb-1 ${
              error ? "text-red-400" : "gradient-text"
            }`}
          >
            {error ? "—" : c.value}
          </div>
          <div className="text-xs text-gray-500 font-medium leading-snug">{c.label}</div>
        </div>
      ))}
      <div className="col-span-2 md:col-span-4 text-center text-[11px] text-gray-600">
        <span className="mr-3">
          In queue: <span className="text-violet-300 font-mono">{s.matchmaking_queue}</span>
        </span>
        <span className="mr-3">
          Waiting rooms: <span className="text-gray-300 font-mono">{s.rooms_waiting}</span>
        </span>
        <span>
          Registered: <span className="text-gray-400 font-mono">{s.registered_users}</span>
        </span>
      </div>
    </div>
  );
}
