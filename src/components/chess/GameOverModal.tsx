"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  timeControl?: number;
  increment?: number;
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
  timeControl,
  increment,
}: GameOverModalProps) {
  const router = useRouter();
  const [rematching, setRematching] = useState(false);

  const rematch = async () => {
    if (!timeControl) return;
    setRematching(true);
    try {
      const opponent = currentUsername === whitePlayer ? blackPlayer : whitePlayer;
      const { data } = await api.post("/api/chess/rooms/", {
        name: `Rematch`,
        is_public: false,
        time_control: timeControl,
        increment: increment ?? 0,
      });
      if (opponent) {
        await api.post("/api/chess/challenges/", {
          username: opponent,
          time_control: timeControl,
          increment: increment ?? 0,
        }).catch(() => {});
      }
      router.push(`/room/${data.id}`);
    } catch {
      setRematching(false);
    }
  };

  const headline =
    result === "draw" ? "Draw!"
    : result === "white" ? `${whitePlayer ?? "White"} wins!`
    : `${blackPlayer ?? "Black"} wins!`;

  const reasonLabel =
    reason === "abandonment" ? "Opponent abandoned the game"
    : reason === "resignation" ? "Opponent resigned"
    : reason === "timeout" ? "Time out"
    : result === "draw" ? "Draw by agreement"
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
            <div className="flex flex-col sm:flex-row gap-2 justify-center flex-wrap">
              {timeControl && (
                <button onClick={rematch} disabled={rematching} className="btn-primary w-full sm:w-auto">
                  {rematching ? "Creating…" : "⚔ Rematch"}
                </button>
              )}
              <Link href="/play" className="btn-secondary w-full sm:w-auto text-center">
                New Game
              </Link>
              {gameId && (
                <Link href={`/games/${gameId}/review`} className="btn-secondary w-full sm:w-auto text-center">
                  Replay
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
