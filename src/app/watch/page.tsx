"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Room } from "@/types";
import api from "@/lib/api";

export default function WatchPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const load = () =>
    api.get("/api/chess/rooms/?status=active")
      .then(({ data }) => { setRooms(data.results ?? data); setLastUpdated(new Date()); })
      .finally(() => setLoading(false));

  useEffect(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t); }, []);

  return (
    <div className="min-h-screen bg-hero pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-black mb-1">Live <span className="gradient-text">Games</span></h1>
            <p className="text-gray-500 text-sm">{rooms.length} active games · refreshes every 10s</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            {lastUpdated.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </div>
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="card h-36 animate-pulse bg-white/[0.02]" />)}
          </div>
        )}

        {!loading && rooms.length === 0 && (
          <div className="text-center py-24">
            <div className="text-6xl mb-4 opacity-30">♟</div>
            <p className="text-gray-500 text-lg font-medium mb-2">No live games right now</p>
            <p className="text-gray-600 text-sm mb-6">Be the first to start one!</p>
            <Link href="/play" className="btn-primary">Create a Game →</Link>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <Link key={room.id} href={`/room/${room.id}`} className="card-hover group flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="badge-green flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />Live
                </span>
                <span className="font-mono text-xs text-gray-500 bg-white/[0.04] px-2 py-0.5 rounded">
                  {room.time_control / 60}+{room.increment}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-white border-2 border-white/30 shrink-0" />
                  <span className="text-sm font-semibold truncate">{room.game?.white_player?.username ?? "Waiting…"}</span>
                  {room.game?.white_player && <span className="text-xs text-gray-500 ml-auto font-mono">{room.game.white_player.rating}</span>}
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <div className="w-5 h-5 rounded-full bg-gray-800 border-2 border-white/10 shrink-0" />
                  <span className="text-sm font-semibold truncate">{room.game?.black_player?.username ?? "Waiting…"}</span>
                  {room.game?.black_player && <span className="text-xs text-gray-500 ml-auto font-mono">{room.game.black_player.rating}</span>}
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-600 border-t border-white/[0.06] pt-3">
                <span>{room.game?.moves?.length ?? 0} moves</span>
                <span className="group-hover:text-amber-400 transition-colors font-medium">Watch →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
