"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

interface ChallengeEntry {
  id: string;
  opponent: string;
  opponent_rating: number | null;
  time_control: number;
  increment: number;
  status: "accepted" | "declined" | "expired";
  is_challenger: boolean;
  room_id: string | null;
  wager_amount: string | null;
  created_at: string;
  game_result?: string;
  white_player?: string;
  black_player?: string;
  move_count?: number;
  game_id?: string;
}

function formatTime(tc: number, inc: number) {
  return `${tc / 60}+${inc}`;
}

function resultLabel(result: string | undefined, myUsername: string, white: string | undefined, black: string | undefined) {
  if (!result || result === "ongoing" || result === "aborted") return result ?? "—";
  if (result === "draw") return "½–½";
  const iWon = (result === "white" && white === myUsername) || (result === "black" && black === myUsername);
  return iWon ? "Won" : "Lost";
}

function resultColor(result: string | undefined, myUsername: string, white: string | undefined, black: string | undefined) {
  if (!result || result === "draw") return "text-gray-400";
  const iWon = (result === "white" && white === myUsername) || (result === "black" && black === myUsername);
  return iWon ? "text-emerald-400" : "text-red-400";
}

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<ChallengeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    api.get("/api/chess/challenges/history/")
      .then(({ data }) => setChallenges(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const myUsername = user?.username ?? "";

  return (
    <div className="max-w-3xl mx-auto px-4 pt-24 pb-16">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1">Challenge History</h1>
        <p className="text-sm text-gray-500">Challenges you sent or received</p>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-10">Loading…</div>
      ) : challenges.length === 0 ? (
        <div className="card text-center text-gray-400 py-10">No challenges yet. Go to the <Link href="/leaderboard" className="text-amber-400 hover:underline">leaderboard</Link> to challenge someone!</div>
      ) : (
        <ul className="flex flex-col gap-2">
          {challenges.map((c) => {
            const label = resultLabel(c.game_result, myUsername, c.white_player, c.black_player);
            const color = resultColor(c.game_result, myUsername, c.white_player, c.black_player);
            const date = new Date(c.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

            return (
              <li key={c.id} className="card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center font-bold text-amber-400 shrink-0">
                    {c.opponent[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium flex items-center gap-2">
                      <span>{c.opponent}</span>
                      {c.opponent_rating && <span className="text-xs text-gray-500 font-mono">{c.opponent_rating}</span>}
                      <span className="text-xs text-gray-600">{c.is_challenger ? "← you challenged" : "challenged you →"}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 flex flex-wrap gap-x-3">
                      <span className="font-mono text-amber-400/80">{formatTime(c.time_control, c.increment)}</span>
                      {c.wager_amount && <span className="text-emerald-400">${c.wager_amount}</span>}
                      <span>{date}</span>
                      {c.status !== "accepted" && (
                        <span className={c.status === "declined" ? "text-red-400" : "text-gray-600"}>
                          {c.status}
                        </span>
                      )}
                      {c.game_result && c.move_count !== undefined && (
                        <span>{c.move_count} moves</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {c.game_result && (
                    <span className={`text-sm font-bold font-mono ${color}`}>{label}</span>
                  )}
                  {c.game_id && (
                    <Link href={`/games/${c.game_id}/review`} className="btn-secondary text-xs px-3 py-1.5">
                      Replay
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
