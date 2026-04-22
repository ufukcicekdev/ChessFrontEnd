"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { GameResult } from "@/types";
import api from "@/lib/api";

interface GameOverModalProps {
  result: GameResult;
  reason?: string | null;
  currentUsername: string | null;
  whitePlayer: string | null;
  blackPlayer: string | null;
  roomId: string;
  gameId?: string | null;
  isSpectator: boolean;
}

export default function GameOverModal({
  result,
  reason,
  currentUsername,
  whitePlayer,
  blackPlayer,
  roomId,
  gameId,
  isSpectator,
}: GameOverModalProps) {
  const headline =
    result === "draw" ? "Draw!"
    : result === "white" ? `${whitePlayer ?? "White"} wins!`
    : `${blackPlayer ?? "Black"} wins!`;

  const reasonLabel =
    reason === "abandonment" ? "Rakip oyunu terk etti"
    : reason === "resignation" ? "Rakip istifa etti"
    : reason === "timeout" ? "Süre doldu"
    : result === "draw" ? "Beraberlik anlaşması"
    : null;

  const isWinner =
    !isSpectator &&
    ((result === "white" && currentUsername === whitePlayer) ||
      (result === "black" && currentUsername === blackPlayer));

  const [profileLine, setProfileLine] = useState<string | null>(null);

  useEffect(() => {
    if (isSpectator) return;
    if (!currentUsername) return;

    let cancelled = false;
    (async () => {
      try {
        // Ratings are updated server-side at game end; refresh profile to reflect new Elo + title.
        const { data } = await api.get("/api/users/profile/");
        if (cancelled) return;
        const title = data.title as string | undefined;
        const rating = data.rating as number | undefined;
        if (title && typeof rating === "number") {
          setProfileLine(`Your rating: ${rating} · ${title}`);
        } else if (typeof rating === "number") {
          setProfileLine(`Your rating: ${rating}`);
        }
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentUsername, isSpectator, result]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="card max-w-sm w-full text-center flex flex-col gap-4 p-8 border-white/10">
        <div className="text-5xl">
          {result === "draw" ? "🤝" : isSpectator ? "👁" : isWinner ? "🏆" : "😔"}
        </div>
        <h2 className="text-2xl font-bold">{headline}</h2>
        <p className="text-gray-400 text-sm">
          {reasonLabel ?? (result === "draw" ? "Game drawn by agreement" : `${result} wins`)}
        </p>
        {profileLine && <p className="text-xs text-gray-500">{profileLine}</p>}
        <div className="flex flex-col gap-2">
          {isSpectator ? (
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Link href="/watch" className="btn-primary w-full sm:w-auto text-center">
                Back to Live Games
              </Link>
              {gameId && (
                <Link href={`/games/${gameId}/review`} className="btn-secondary w-full sm:w-auto text-center">
                  Replay
                </Link>
              )}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Link href="/play" className="btn-primary w-full sm:w-auto text-center">
                New Game
              </Link>
              {gameId ? (
                <Link href={`/games/${gameId}/review`} className="btn-secondary w-full sm:w-auto text-center">
                  Review / Replay
                </Link>
              ) : (
                <Link href={`/room/${roomId}`} className="btn-secondary w-full sm:w-auto text-center">
                  Review
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
