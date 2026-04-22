import { TournamentRound } from "@/types";
import { clsx } from "clsx";

interface TournamentBracketProps {
  rounds: TournamentRound[];
}

export default function TournamentBracket({ rounds }: TournamentBracketProps) {
  if (rounds.length === 0)
    return <p className="text-gray-500 text-sm italic">Bracket not generated yet.</p>;

  return (
    <div className="flex gap-6 overflow-x-auto pb-4">
      {rounds.map((round) => (
        <div key={round.round_number} className="flex flex-col gap-4 min-w-[160px]">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">
            Round {round.round_number}
          </p>
          {round.matches.map((match) => (
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
            </div>
          ))}
        </div>
      ))}
    </div>
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
