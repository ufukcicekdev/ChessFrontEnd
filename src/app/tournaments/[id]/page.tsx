"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Tournament } from "@/types";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import TournamentBracket from "@/components/tournament/TournamentBracket";
import Link from "next/link";

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

  if (loading) return <div className="flex justify-center pt-24 text-gray-400">Loading…</div>;
  if (!tournament) return <div className="flex justify-center pt-24 text-red-400">Not found.</div>;

  const isCreator = user?.username === tournament.created_by?.username;
  const isParticipant =
    tournament.participants.some((p) => p.username === user?.username) ||
    tournament.rounds.some((r) =>
      r.matches.some((m) => m.player1_username === user?.username || m.player2_username === user?.username)
    );

  return (
    <div className="max-w-5xl mx-auto px-4 pt-24 pb-16 flex flex-col gap-8">
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

      {/* Katılımcı listesi */}
      {tournament.participants.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Players
            <span className="text-sm font-normal text-gray-500 ml-2">
              {tournament.participant_count}/{tournament.max_players}
            </span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {tournament.participants.map((p) => (
              <Link
                key={p.username}
                href={`/profile/${p.username}`}
                className="card-hover flex items-center gap-2 px-3 py-2"
              >
                <div className="w-7 h-7 rounded-full bg-amber-500/15 border border-amber-500/20 flex items-center justify-center text-xs font-bold text-amber-400 shrink-0">
                  {p.username[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{p.username}</p>
                  <p className="text-xs text-gray-500 font-mono">{p.rating}</p>
                </div>
                {p.title && (
                  <span className="text-[10px] text-gray-400 bg-white/[0.05] border border-white/[0.08] px-1 py-0.5 rounded shrink-0">
                    {p.title}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Bracket */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Bracket</h2>
        <TournamentBracket
          rounds={tournament.rounds}
          currentUsername={user?.username}
          timeControl={tournament.time_control}
          increment={tournament.increment}
        />
      </div>
    </div>
  );
}
