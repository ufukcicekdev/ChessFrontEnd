"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Tournament } from "@/types";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/hooks/useToast";
import ToastContainer from "@/components/ui/Toast";
import api from "@/lib/api";
import { clsx } from "clsx";

const TIME_CONTROLS = [
  { label: "1+0",  tc: 60,   inc: 0 },
  { label: "2+1",  tc: 120,  inc: 1 },
  { label: "3+0",  tc: 180,  inc: 0 },
  { label: "3+2",  tc: 180,  inc: 2 },
  { label: "5+0",  tc: 300,  inc: 0 },
  { label: "5+3",  tc: 300,  inc: 3 },
  { label: "10+0", tc: 600,  inc: 0 },
  { label: "10+5", tc: 600,  inc: 5 },
  { label: "15+10",tc: 900,  inc: 10 },
  { label: "30+0", tc: 1800, inc: 0 },
];

const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  registration: { label: "Registration Open", badge: "badge-blue" },
  active:       { label: "In Progress",        badge: "badge-green" },
  finished:     { label: "Finished",           badge: "badge-gray" },
};

export default function TournamentsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { toasts, add, remove } = useToast();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", max_players: 8, time_control: 300, increment: 0 });

  const load = () =>
    api.get("/api/tournaments/").then(({ data }) => setTournaments(data.results ?? data)).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { router.push("/auth/login"); return; }
    setCreating(true);
    try {
      const { data } = await api.post("/api/tournaments/", form);
      router.push(`/tournaments/${data.id}`);
    } catch {
      add("Failed to create tournament.", "error");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-hero pt-24 pb-16 px-4">
      <ToastContainer toasts={toasts} remove={remove} />
      <div className="max-w-5xl mx-auto">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-black mb-1"><span className="gradient-text">Tournaments</span></h1>
            <p className="text-gray-500 text-sm">Single-elimination bracket format</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            {showForm ? "Cancel" : "+ Create Tournament"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={create} className="card mb-6 flex flex-col gap-4 animate-slide-up">
            <p className="font-bold text-base">New Tournament</p>
            <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Tournament name" className="input" />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-500 uppercase tracking-wider">Players</label>
              <select value={form.max_players} onChange={(e) => setForm((f) => ({ ...f, max_players: +e.target.value }))} className="input py-2">
                {[4,8,16,32].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-500 uppercase tracking-wider">Time Control</label>
              <div className="flex flex-wrap gap-2">
                {TIME_CONTROLS.map((opt) => {
                  const active = form.time_control === opt.tc && form.increment === opt.inc;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, time_control: opt.tc, increment: opt.inc }))}
                      className={`px-3 py-1.5 rounded-lg text-sm font-mono font-semibold border transition-all ${
                        active
                          ? "bg-amber-500/20 border-amber-500/60 text-amber-400"
                          : "bg-white/[0.04] border-white/[0.08] text-gray-400 hover:border-white/20 hover:text-gray-200"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <button type="submit" disabled={creating} className="btn-primary w-full">
              {creating ? "Creating…" : "Create Tournament →"}
            </button>
          </form>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="card h-32 animate-pulse bg-white/[0.02]" />)}
          </div>
        ) : tournaments.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4 opacity-30">🏆</div>
            <p className="text-gray-500 mb-4">No tournaments yet</p>
            <button onClick={() => setShowForm(true)} className="btn-primary">Create the first one</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tournaments.map((t) => {
              const cfg = STATUS_CONFIG[t.status];
              return (
                <Link key={t.id} href={`/tournaments/${t.id}`} className="card-hover flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-base leading-tight">{t.name}</p>
                    <span className={clsx("shrink-0", cfg.badge)}>{cfg.label}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>👥 {t.participant_count}/{t.max_players}</span>
                    <span>⏱ {t.time_control / 60}+{t.increment}</span>
                    {t.winner && <span className="text-amber-400">🏆 {t.winner.username}</span>}
                  </div>
                  <div className="w-full bg-white/[0.05] rounded-full h-1 overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full transition-all"
                      style={{ width: `${(t.participant_count / t.max_players) * 100}%` }} />
                  </div>
                  <p className="text-xs text-gray-600 text-right">{t.max_players - t.participant_count} spots left →</p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
