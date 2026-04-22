"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Tournament } from "@/types";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import TournamentBracket from "@/components/tournament/TournamentBracket";

export default function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [starting, setStarting] = useState(false);

  const load = () =>
    api
      .get(`/api/tournaments/${id}/`)
      .then(({ data }) => setTournament(data))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, [id]);

  const join = async () => {
    setJoining(true);
    try {
      await api.post(`/api/tournaments/${id}/join/`);
      load();
    } finally {
      setJoining(false);
    }
  };

  const start = async () => {
    setStarting(true);
    try {
      const { data } = await api.post(`/api/tournaments/${id}/start/`);
      setTournament(data);
    } finally {
      setStarting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20 text-gray-400">Loading…</div>;
  if (!tournament) return <div className="flex justify-center py-20 text-red-400">Not found.</div>;

  const isCreator = user?.username === tournament.created_by?.username;
  const isParticipant = tournament.rounds.some((r) =>
    r.matches.some(
      (m) => m.player1_username === user?.username || m.player2_username === user?.username
    )
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 flex flex-col gap-8">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">{tournament.name}</h1>
          {tournament.description && (
            <p className="text-gray-400 mt-1">{tournament.description}</p>
          )}
          <p className="text-sm text-gray-500 mt-2">
            {tournament.participant_count}/{tournament.max_players} players ·{" "}
            {tournament.time_control / 60}+{tournament.increment} min
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {tournament.status === "registration" && !isParticipant && (
            <button onClick={join} disabled={joining} className="btn-primary">
              {joining ? "Joining…" : "Join Tournament"}
            </button>
          )}
          {isCreator && tournament.status === "registration" && (
            <button onClick={start} disabled={starting} className="btn-secondary">
              {starting ? "Starting…" : "Start Tournament"}
            </button>
          )}
        </div>
      </div>

      {tournament.winner && (
        <div className="card border-amber-500 bg-amber-500/10 text-center py-4">
          <p className="text-2xl">🏆</p>
          <p className="font-bold text-amber-400 mt-1">{tournament.winner.username} wins!</p>
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold mb-4">Bracket</h2>
        <TournamentBracket rounds={tournament.rounds} />
      </div>
    </div>
  );
}
