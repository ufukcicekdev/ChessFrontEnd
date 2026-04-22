"use client";
import { useEffect, useState } from "react";
import { User } from "@/types";
import api from "@/lib/api";

const MEDALS = ["🥇","🥈","🥉"];

export default function LeaderboardPage() {
  const [players, setPlayers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/users/leaderboard/").then(({ data }) => setPlayers(data.results ?? data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-hero pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black mb-2"><span className="gradient-text">Leaderboard</span></h1>
          <p className="text-gray-500 text-sm">Top players ranked by Elo rating</p>
        </div>

        {!loading && players.length >= 3 && (
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[players[1], players[0], players[2]].map((p, idx) => {
              const rank = idx === 1 ? 0 : idx === 0 ? 1 : 2;
              const sizes = ["h-24","h-32","h-20"];
              return (
                <div key={p.id} className={`card flex flex-col items-center justify-end pb-4 pt-2 ${sizes[idx]}`}>
                  <div className="text-2xl mb-1">{MEDALS[rank]}</div>
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-bold text-amber-400 text-sm mb-1">
                    {p.username[0].toUpperCase()}
                  </div>
                  <p className="text-xs font-bold truncate max-w-full px-2">{p.username}</p>
                  <p className="text-xs font-mono text-amber-400">{p.rating}</p>
                </div>
              );
            })}
          </div>
        )}

        <div className="card overflow-hidden p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading…</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-gray-600 text-xs uppercase tracking-wider">
                  <th className="px-5 py-3.5 text-left w-12">#</th>
                  <th className="px-5 py-3.5 text-left">Player</th>
                  <th className="px-5 py-3.5 text-right">Elo</th>
                  <th className="px-5 py-3.5 text-right hidden sm:table-cell">W/D/L</th>
                  <th className="px-5 py-3.5 text-right hidden sm:table-cell">Win %</th>
                </tr>
              </thead>
              <tbody>
                {players.map((p, i) => {
                  const winPct = p.games_played ? Math.round((p.games_won / p.games_played) * 100) : 0;
                  return (
                    <tr key={p.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.03] transition-colors">
                      <td className="px-5 py-3.5">
                        {i < 3 ? <span className="text-base">{MEDALS[i]}</span> : <span className="text-gray-600 font-mono text-xs">{i + 1}</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-sm font-bold text-amber-400 shrink-0">
                            {p.username[0].toUpperCase()}
                          </div>
                          <span className="font-semibold">{p.username}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right"><span className="font-mono font-bold text-amber-400">{p.rating}</span></td>
                      <td className="px-5 py-3.5 text-right text-xs text-gray-500 hidden sm:table-cell">
                        <span className="text-emerald-400">{p.games_won}</span> / <span className="text-gray-400">{p.games_drawn}</span> / <span className="text-red-400">{p.games_played - p.games_won - p.games_drawn}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right hidden sm:table-cell">
                        <div className="flex items-center gap-2 justify-end">
                          <div className="w-16 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${winPct}%` }} />
                          </div>
                          <span className="text-xs text-gray-500 w-8 text-right">{winPct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
