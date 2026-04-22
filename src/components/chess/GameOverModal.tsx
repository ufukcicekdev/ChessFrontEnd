"use client";
import Link from "next/link";
import { GameResult } from "@/types";

interface GameOverModalProps {
  result: GameResult;
  currentUsername: string | null;
  whitePlayer: string | null;
  blackPlayer: string | null;
  roomId: string;
  isSpectator: boolean;
}

export default function GameOverModal({
  result,
  currentUsername,
  whitePlayer,
  blackPlayer,
  roomId,
  isSpectator,
}: GameOverModalProps) {
  const headline =
    result === "draw" ? "Draw!"
    : result === "white" ? `${whitePlayer ?? "White"} wins!`
    : `${blackPlayer ?? "Black"} wins!`;

  const isWinner =
    !isSpectator &&
    ((result === "white" && currentUsername === whitePlayer) ||
      (result === "black" && currentUsername === blackPlayer));

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="card max-w-sm w-full text-center flex flex-col gap-4 p-8 border-white/10">
        <div className="text-5xl">
          {result === "draw" ? "🤝" : isSpectator ? "👁" : isWinner ? "🏆" : "😔"}
        </div>
        <h2 className="text-2xl font-bold">{headline}</h2>
        <p className="text-gray-400 text-sm capitalize">
          {result === "draw" ? "Game drawn by agreement" : `${result} wins`}
        </p>
        <div className="flex gap-3 justify-center">
          {isSpectator ? (
            <Link href="/watch" className="btn-primary w-full">
              Back to Live Games
            </Link>
          ) : (
            <>
              <Link href="/play" className="btn-primary">
                New Game
              </Link>
              <Link href={`/room/${roomId}`} className="btn-secondary">
                Review
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
