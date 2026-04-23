"use client";
import { useChallenges } from "@/hooks/useChallenges";

function formatTime(tc: number, inc: number) {
  return `${tc / 60}+${inc}`;
}

export default function ChallengeNotification() {
  const { received, sent, accept, decline, dismissSent } = useChallenges();

  const sentFeedback = sent.filter((c) => c.status === "declined" || c.status === "expired");

  if (received.length === 0 && sentFeedback.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4">
      {received.map((c) => (
        <div key={c.id} className="card border border-amber-500/40 bg-[#1a1610] shadow-xl flex flex-col gap-3 p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-bold text-amber-400 shrink-0">
              {c.challenger[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">{c.challenger}</p>
              <p className="text-xs text-gray-400">
                challenges you · <span className="font-mono text-amber-400">{formatTime(c.time_control, c.increment)}</span>
                {c.challenger_rating && <span className="text-gray-500"> · {c.challenger_rating} Elo</span>}
                {c.wager_amount && <span className="text-emerald-400 font-semibold"> · ${c.wager_amount}</span>}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => decline(c.id)} className="btn-secondary flex-1 text-sm py-1.5">Decline</button>
            <button onClick={() => accept(c.id)} className="btn-primary flex-1 text-sm py-1.5">⚔ Accept</button>
          </div>
        </div>
      ))}

      {sentFeedback.map((c) => (
        <div key={c.id} className={`card shadow-xl flex items-center gap-3 p-4 border ${c.status === "declined" ? "border-red-500/40 bg-[#1a1010]" : "border-white/10 bg-[#111]"}`}>
          <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-gray-400 shrink-0 text-sm">
            {c.challenged[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate">{c.challenged}</p>
            <p className="text-xs text-gray-500">
              {c.status === "declined" ? (
                <span className="text-red-400">declined your challenge</span>
              ) : (
                <span className="text-gray-500">challenge expired</span>
              )}
              {" · "}<span className="font-mono text-gray-600">{formatTime(c.time_control, c.increment)}</span>
            </p>
          </div>
          <button onClick={() => dismissSent(c.id)} className="text-gray-600 hover:text-gray-400 text-lg leading-none px-1">×</button>
        </div>
      ))}
    </div>
  );
}
