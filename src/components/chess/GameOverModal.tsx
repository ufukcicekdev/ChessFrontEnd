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
  whiteRatingBefore?: number | null;
  blackRatingBefore?: number | null;
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
  whiteRatingBefore,
  blackRatingBefore,
  roomId,
  gameId,
  isSpectator,
  timeControl,
  increment,
}: GameOverModalProps) {
  const router = useRouter();
  const [rematching, setRematching] = useState(false);
  const [rematchSent, setRematchSent] = useState(false);

  const rematch = async () => {
    if (!timeControl) return;
    setRematching(true);
    try {
      const opponent = currentUsername === whitePlayer ? blackPlayer : whitePlayer;
      const myColor = currentUsername === whitePlayer ? "white" : "black";
      // Alternate colors on a rematch: the initiator takes the opposite color
      // of the game that just ended (standard chess rematch behaviour).
      const challengerColor = myColor === "white" ? "black" : "white";
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
          challenger_color: challengerColor,
          room_id: data.id,
        });
        // Do NOT navigate yet. Wait for the opponent to accept — the backend
        // assigns colors and starts the game on accept, and the per-user
        // challenge socket then navigates both players into the room exactly
        // once. Navigating early made the initiator join first (grabbing a
        // color + starting the game), which the accept step then overwrote —
        // causing the board to reset and the colors to flip.
        setRematchSent(true);
      } else {
        // Opponent already left — just open the fresh room.
        router.push(`/room/${data.id}`);
      }
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
    : reason === "checkmate" ? "Checkmate"
    : result === "draw" ? "Draw"
    : null;

  const isWinner =
    !isSpectator &&
    ((result === "white" && currentUsername === whitePlayer) ||
      (result === "black" && currentUsername === blackPlayer));

  const isWhite = currentUsername === whitePlayer;
  const myRatingBefore = isWhite ? whiteRatingBefore : blackRatingBefore;

  const [newRating, setNewRating] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState<string | null>(null);

  useEffect(() => {
    if (isSpectator || !currentUsername) return;
    let cancelled = false;
    // Ratings update via Celery; poll a few times to catch it
    let attempts = 0;
    const poll = async () => {
      try {
        const { data } = await api.get("/api/users/profile/");
        if (cancelled) return;
        const rating = data.rating as number | undefined;
        const title = data.title as string | undefined;
        if (typeof rating === "number") {
          // Keep polling until rating changes or max attempts reached
          if (myRatingBefore && rating === myRatingBefore && attempts < 8) {
            attempts++;
            setTimeout(poll, 2500);
            return;
          }
          // After max attempts just show the rating as-is (change may be 0 or task pending)
          setNewRating(rating);
        }
        if (title) setNewTitle(title);
      } catch {
        // ignore
      }
    };
    setTimeout(poll, 1500);
    return () => { cancelled = true; };
  }, [currentUsername, isSpectator, result]); // eslint-disable-line react-hooks/exhaustive-deps

  const ratingChange = newRating != null && myRatingBefore != null ? newRating - myRatingBefore : null;
  const ratingChangeStr =
    ratingChange == null ? null
    : ratingChange > 0 ? `+${ratingChange}`
    : `${ratingChange}`;
  const ratingChangeColor =
    ratingChange == null ? ""
    : ratingChange > 0 ? "text-emerald-400"
    : ratingChange < 0 ? "text-red-400"
    : "text-gray-400";

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

        {!isSpectator && (
          <div className="flex items-center justify-center gap-2 text-sm">
            {newRating != null ? (
              <>
                <span className="font-mono font-bold text-amber-400">{newRating}</span>
                {ratingChangeStr && (
                  <span className={`font-mono text-xs font-semibold ${ratingChangeColor}`}>
                    ({ratingChangeStr})
                  </span>
                )}
                {newTitle && (
                  <span className="text-xs text-gray-400 bg-white/[0.06] border border-white/[0.08] px-2 py-0.5 rounded">
                    {newTitle}
                  </span>
                )}
              </>
            ) : (
              <span className="text-xs text-gray-600 animate-pulse">Updating rating…</span>
            )}
          </div>
        )}

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
                <button onClick={rematch} disabled={rematching || rematchSent} className="btn-primary w-full sm:w-auto">
                  {rematchSent ? "Waiting for opponent…" : rematching ? "Sending…" : "⚔ Rematch"}
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
