"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Tournament } from "@/types";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import TournamentBracket from "@/components/tournament/TournamentBracket";
import Link from "next/link";

export default function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const router = useRouter();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [starting, setStarting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    api.get(`/api/tournaments/${id}/`)
      .then(({ data }) => setTournament(data))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const join = async () => {
    setJoining(true); setError(null);
    try { await api.post(`/api/tournaments/${id}/join/`); load(); }
    catch (e: unknown) { setError((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Failed to join."); }
    finally { setJoining(false); }
  };

  const leave = async () => {
    setLeaving(true); setError(null);
    try { await api.post(`/api/tournaments/${id}/leave/`); load(); }
    catch (e: unknown) { setError((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Failed to leave."); }
    finally { setLeaving(false); }
  };

  const start = async () => {
    setStarting(true); setError(null);
    try { const { data } = await api.post(`/api/tournaments/${id}/start/`); setTournament(data); }
    catch (e: unknown) { setError((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Failed to start."); }
    finally { setStarting(false); }
  };

  const cancel = async () => {
    if (!confirm("Cancel this tournament?")) return;
    setCancelling(true); setError(null);
    try { await api.post(`/api/tournaments/${id}/cancel/`); router.push("/tournaments"); }
    catch (e: unknown) { setError((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Failed to cancel."); }
    finally { setCancelling(false); }
  };

  if (loading) return <div className="flex justify-center pt-24 text-gray-400">Loading…</div>;
  if (!tournament) return <div className="flex justify-center pt-24 text-red-400">Not found.</div>;

  const isCreator = user?.username === tournament.created_by?.username;
  const isParticipant = tournament.participants.some((p) => p.username === user?.username);
  const isRegistration = tournament.status === "registration";
  const isActive = tournament.status === "active";

  return (
    <div className="max-w-5xl mx-auto px-4 pt-24 pb-16 flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">{tournament.name}</h1>
          {tournament.description && <p className="text-gray-400 mt-1">{tournament.description}</p>}
          <p className="text-sm text-gray-500 mt-2">
            {tournament.participant_count}/{tournament.max_players} players ·{" "}
            {tournament.time_control / 60}+{tournament.increment} min ·{" "}
            <span className={isRegistration ? "text-blue-400" : isActive ? "text-emerald-400" : "text-gray-500"}>
              {isRegistration ? "Registration open" : isActive ? "In progress" : "Finished"}
            </span>
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {isRegistration && !isParticipant && user && (
            <button onClick={join} disabled={joining} className="btn-primary">
              {joining ? "Joining…" : "Join"}
            </button>
          )}
          {isRegistration && isParticipant && !isCreator && (
            <button onClick={leave} disabled={leaving} className="btn-secondary">
              {leaving ? "Leaving…" : "Leave"}
            </button>
          )}
          {isCreator && isRegistration && (
            <>
              <button onClick={start} disabled={starting || tournament.participant_count < 2} className="btn-primary">
                {starting ? "Starting…" : "Start Tournament"}
              </button>
              <button onClick={cancel} disabled={cancelling} className="btn-danger text-sm">
                {cancelling ? "…" : "Cancel"}
              </button>
            </>
          )}
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {/* Winner banner */}
      {tournament.winner && (
        <div className="card border-amber-500/40 bg-amber-500/10 text-center py-4">
          <p className="text-2xl">🏆</p>
          <p className="font-bold text-amber-400 mt-1">{tournament.winner.username} wins the tournament!</p>
        </div>
      )}

      {/* Participants */}
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
      {(isActive || tournament.status === "finished") && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Bracket</h2>
          <TournamentBracket
            rounds={tournament.rounds}
            currentUsername={user?.username}
            tournamentId={id}
          />
        </div>
      )}

      {isRegistration && tournament.participant_count < 2 && isCreator && (
        <p className="text-xs text-gray-600 text-center">Need at least 2 players to start.</p>
      )}
    </div>
  );
}
