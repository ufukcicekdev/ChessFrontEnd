"use client";
import { useChallenges } from "@/hooks/useChallenges";

function formatTime(tc: number, inc: number) {
  return `${tc / 60}+${inc}`;
}

export default function ChallengeNotification() {
  const { challenges, accept, decline } = useChallenges();

  if (challenges.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4">
      {challenges.map((c) => (
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
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => decline(c.id)}
              className="btn-secondary flex-1 text-sm py-1.5"
            >
              Decline
            </button>
            <button
              onClick={() => accept(c.id)}
              className="btn-primary flex-1 text-sm py-1.5"
            >
              ⚔ Accept
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
