"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

interface PublicUser {
  id: number;
  username: string;
  rating: number;
  title?: string;
  next_title?: string | null;
  games_played: number;
  games_won: number;
  games_drawn: number;
  rank: number;
  total: number;
}

export default function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user: me } = useAuthStore();
  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api.get(`/api/users/profile/${username}/`)
      .then(({ data }) => setProfile(data))
      .catch((e) => { if (e?.response?.status === 404) setNotFound(true); })
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) return <div className="flex justify-center pt-32 text-gray-500">Loading…</div>;
  if (notFound) return (
    <div className="flex flex-col items-center justify-center pt-32 gap-4">
      <div className="text-5xl opacity-20">♟</div>
      <p className="text-gray-400">User <span className="text-white font-semibold">{username}</span> not found.</p>
      <Link href="/leaderboard" className="btn-secondary text-sm">Back to Leaderboard</Link>
    </div>
  );
  if (!profile) return null;

  const gamesLost = profile.games_played - profile.games_won - profile.games_drawn;
  const winRate = profile.games_played > 0 ? Math.round((profile.games_won / profile.games_played) * 100) : 0;
  const isMe = me?.username === profile.username;

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">

        {/* Kimlik kartı */}
        <div className="card flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-3xl font-black text-amber-400 shrink-0">
            {profile.username[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold">{profile.username}</h1>
              {profile.title && (
                <span className="text-xs font-semibold bg-white/[0.06] border border-white/[0.08] px-2 py-0.5 rounded text-gray-300">
                  {profile.title}
                </span>
              )}
              {isMe && <span className="text-xs text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">you</span>}
            </div>
            {profile.next_title && (
              <p className="text-xs text-gray-500 mt-0.5">Working towards: {profile.next_title}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <p className="text-2xl font-black font-mono text-amber-400">{profile.rating}</p>
            <p className="text-xs text-gray-500">Elo rating</p>
            <p className="text-sm font-mono text-gray-400">#{profile.rank} <span className="text-gray-600 text-xs">/ {profile.total}</span></p>
          </div>
        </div>

        {/* İstatistikler */}
        <div className="card flex flex-col gap-4">
          <div className="grid grid-cols-4 gap-3 text-center">
            <div>
              <p className="text-2xl font-black font-mono">{profile.games_played}</p>
              <p className="text-xs text-gray-500 mt-0.5">Games</p>
            </div>
            <div>
              <p className="text-2xl font-black font-mono text-emerald-400">{profile.games_won}</p>
              <p className="text-xs text-gray-500 mt-0.5">Wins</p>
            </div>
            <div>
              <p className="text-2xl font-black font-mono text-gray-400">{profile.games_drawn}</p>
              <p className="text-xs text-gray-500 mt-0.5">Draws</p>
            </div>
            <div>
              <p className="text-2xl font-black font-mono text-red-400">{gamesLost}</p>
              <p className="text-xs text-gray-500 mt-0.5">Losses</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 w-14 shrink-0">Win rate</span>
            <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${winRate}%` }} />
            </div>
            <span className="text-xs font-mono text-amber-400 w-8 text-right">{winRate}%</span>
          </div>
        </div>

        {/* Aksiyonlar */}
        <div className="flex gap-3 flex-wrap">
          {!isMe && me && (
            <Link href={`/leaderboard?challenge=${profile.username}`} className="btn-primary flex-1 text-center text-sm">
              ⚔ Challenge
            </Link>
          )}
          <Link href={`/history`} className="btn-secondary flex-1 text-center text-sm">
            Game History
          </Link>
          <Link href="/leaderboard" className="btn-secondary flex-1 text-center text-sm">
            Leaderboard
          </Link>
        </div>

      </div>
    </div>
  );
}
