"use client";
import { TournamentRound } from "@/types";
import { clsx } from "clsx";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

interface TournamentBracketProps {
  rounds: TournamentRound[];
  currentUsername?: string | null;
  tournamentId: string;
}

export default function TournamentBracket({ rounds, currentUsername, tournamentId }: TournamentBracketProps) {
  if (rounds.length === 0)
    return <p className="text-gray-500 text-sm italic">Bracket not generated yet.</p>;

  return (
    <div className="flex gap-6 overflow-x-auto pb-4">
      {rounds.map((round) => (
        <div key={round.round_number} className="flex flex-col gap-4 min-w-[200px]">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">
            Round {round.round_number}
          </p>
          {round.matches.map((match) => {
            const isMyMatch =
              currentUsername &&
              !match.winner_username &&
              !match.is_bye &&
              (match.player1_username === currentUsername || match.player2_username === currentUsername);

            return (
              <div key={match.match_number} className="card text-sm flex flex-col gap-1">
                <MatchSlot
                  username={match.player1_username}
                  isWinner={match.winner_username === match.player1_username && !!match.winner_username}
                  isBye={match.is_bye && !match.player1_username}
                />
                <div className="border-t border-gray-700" />
                <MatchSlot
                  username={match.player2_username}
                  isWinner={match.winner_username === match.player2_username && !!match.winner_username}
                  isBye={match.is_bye}
                />
                {/* Existing room → go directly */}
                {match.room_id && !match.winner_username && (
                  <Link
                    href={`/room/${match.room_id}`}
                    className="mt-1 text-center text-xs bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded px-2 py-1 transition-colors"
                  >
                    ▶ Join Room
                  </Link>
                )}
                {/* No room yet + my match → create room */}
                {isMyMatch && !match.room_id && (
                  <PlayMatchButton
                    tournamentId={tournamentId}
                    matchNumber={match.match_number}
                  />
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function PlayMatchButton({ tournamentId, matchNumber }: { tournamentId: string; matchNumber: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handlePlay = async () => {
    setLoading(true);
    try {
      const { data } = await api.post(`/api/tournaments/${tournamentId}/matches/${matchNumber}/room/`);
      router.push(`/room/${data.room_id}`);
    } catch {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePlay}
      disabled={loading}
      className="mt-1 text-center text-xs bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded px-2 py-1 transition-colors disabled:opacity-50"
    >
      {loading ? "Creating…" : "⚔ Play Match"}
    </button>
  );
}

function MatchSlot({
  username,
  isWinner,
  isBye,
}: {
  username: string | null;
  isWinner: boolean;
  isBye: boolean;
}) {
  return (
    <div
      className={clsx("px-2 py-1 rounded text-xs", {
        "text-amber-400 font-semibold": isWinner,
        "text-gray-500 italic": !username || isBye,
        "text-gray-300": username && !isWinner && !isBye,
      })}
    >
      {isBye ? "BYE" : username ?? "TBD"}
      {isWinner && " ✓"}
    </div>
  );
}
