"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/types";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

const MEDALS = ["🥇","🥈","🥉"];
const TIME_OPTIONS = [
  { label: "1+0", tc: 60, inc: 0 },
  { label: "2+1", tc: 120, inc: 1 },
  { label: "3+0", tc: 180, inc: 0 },
  { label: "3+2", tc: 180, inc: 2 },
  { label: "5+0", tc: 300, inc: 0 },
  { label: "5+3", tc: 300, inc: 3 },
  { label: "10+0", tc: 600, inc: 0 },
  { label: "10+5", tc: 600, inc: 5 },
];

interface PlatformFeatures {
  paid_challenges_enabled: boolean;
  challenge_fee_percent: string;
  challenge_min_wager: string;
  challenge_max_wager: string;
}

interface ChallengeModalProps {
  target: User;
  onClose: () => void;
  features: PlatformFeatures;
}

function ChallengeModal({ target, onClose, features }: ChallengeModalProps) {
  const router = useRouter();
  const [selected, setSelected] = useState(TIME_OPTIONS[4]);
  const [wager, setWager] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll for acceptance after challenge is sent
  useEffect(() => {
    if (!challengeId) return;
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await api.get(`/api/chess/challenges/${challengeId}/status/`);
        if (data.status === "accepted" && data.room_id) {
          clearInterval(pollRef.current!);
          router.push(`/room/${data.room_id}`);
        } else if (data.status === "declined" || data.status === "expired") {
          clearInterval(pollRef.current!);
          setSent(false);
          setError(data.status === "declined" ? "Challenge declined." : "Challenge expired.");
          setChallengeId(null);
        }
      } catch {}
    }, 2000);
    return () => clearInterval(pollRef.current!);
  }, [challengeId, router]);

  const send = async () => {
    setError("");
    setSending(true);
    try {
      const { data } = await api.post("/api/chess/challenges/", {
        username: target.username,
        time_control: selected.tc,
        increment: selected.inc,
        ...(isPaid && wager ? { wager_amount: parseFloat(wager) } : {}),
      });
      setChallengeId(data.id);
      setSent(true);
    } catch (e: any) {
      setError(e?.response?.data?.error || "Failed to send challenge");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div className="card max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
        {sent ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-3 animate-pulse">⚔️</div>
            <p className="font-bold text-lg mb-1">Waiting for response…</p>
            <p className="text-gray-400 text-sm mb-1">{target.username} has been notified.</p>
            <p className="text-gray-600 text-xs mb-4">You'll be redirected automatically when they accept.</p>
            <button onClick={onClose} className="btn-secondary w-full">Cancel</button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-bold text-amber-400">
                {target.username[0].toUpperCase()}
              </div>
              <div>
                <p className="font-bold">{target.username}</p>
                <p className="text-xs text-gray-500">{target.rating} Elo</p>
              </div>
            </div>

            <p className="text-sm text-gray-400 mb-3">Select time control:</p>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {TIME_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setSelected(opt)}
                  className={`py-2 rounded-lg text-sm font-mono transition-all border ${
                    selected.label === opt.label
                      ? "border-amber-500 bg-amber-500/20 text-amber-400"
                      : "border-white/10 bg-white/[0.03] text-gray-400 hover:border-white/20"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Paid challenge section — only shown when feature enabled */}
            {features.paid_challenges_enabled && (
              <div className="mb-4 border border-white/[0.08] rounded-lg p-3 bg-white/[0.02]">
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={isPaid}
                    onChange={(e) => setIsPaid(e.target.checked)}
                    className="accent-amber-500"
                  />
                  <span className="text-sm font-medium">Paid challenge</span>
                  <span className="text-[10px] text-gray-500 ml-auto">{features.challenge_fee_percent}% fee</span>
                </label>
                {isPaid && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm">$</span>
                    <input
                      type="number"
                      min={features.challenge_min_wager}
                      max={features.challenge_max_wager}
                      step="0.5"
                      value={wager}
                      onChange={(e) => setWager(e.target.value)}
                      placeholder={`${features.challenge_min_wager} – ${features.challenge_max_wager}`}
                      className="flex-1 bg-white/[0.04] border border-white/10 rounded px-2 py-1 text-sm font-mono focus:outline-none focus:border-amber-500/50"
                    />
                    <span className="text-xs text-gray-500">USD</span>
                  </div>
                )}
              </div>
            )}

            {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

            <div className="flex gap-2">
              <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
              <button onClick={send} disabled={sending} className="btn-primary flex-1">
                {sending ? "Sending…" : "⚔ Challenge"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const [players, setPlayers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [challengeTarget, setChallengeTarget] = useState<User | null>(null);
  const [features, setFeatures] = useState<PlatformFeatures>({
    paid_challenges_enabled: false,
    challenge_fee_percent: "10",
    challenge_min_wager: "1.00",
    challenge_max_wager: "100.00",
  });
  const { user } = useAuthStore();

  useEffect(() => {
    api.get("/api/users/leaderboard/").then(({ data }) => setPlayers(data.results ?? data)).finally(() => setLoading(false));
    api.get("/api/chess/features/").then(({ data }) => setFeatures(data)).catch(() => {});
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
                  {user && <th className="px-5 py-3.5 text-right w-10"></th>}
                </tr>
              </thead>
              <tbody>
                {players.map((p, i) => {
                  const winPct = p.games_played ? Math.round((p.games_won / p.games_played) * 100) : 0;
                  const isMe = user?.username === p.username;
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
                          {isMe && <span className="text-[10px] text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">you</span>}
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
                      {user && (
                        <td className="px-3 py-3.5 text-right">
                          {!isMe && (
                            <button
                              onClick={() => setChallengeTarget(p)}
                              className="text-xs text-gray-500 hover:text-amber-400 transition-colors px-2 py-1 rounded hover:bg-amber-500/10"
                              title="Challenge to a game"
                            >
                              ⚔
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {challengeTarget && (
        <ChallengeModal target={challengeTarget} onClose={() => setChallengeTarget(null)} features={features} />
      )}
    </div>
  );
}
