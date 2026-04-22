"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Room } from "@/types";
import api from "@/lib/api";
import ChessGame from "@/components/chess/ChessGame";

export default function RoomPage() {
  const { id } = useParams<{ id: string }>();
  const { user, token } = useAuthStore();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/api/chess/rooms/${id}/`)
      .then(({ data }) => setRoom(data))
      .catch(() => setRoom(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-20 text-gray-400">Loading…</div>;
  if (!room) return <div className="flex justify-center py-20 text-red-400">Room not found.</div>;

  // Determine this user's color
  const playerColor =
    user?.username === room.game?.white_player?.username
      ? "white"
      : user?.username === room.game?.black_player?.username
      ? "black"
      : "spectator";

  return (
    <div className="py-6">
      <div className="text-center mb-4">
        <h1 className="text-xl font-semibold">{room.name || `Room ${room.id.slice(0, 8)}`}</h1>
        <p className="text-xs text-gray-500 mt-1 font-mono">{room.id}</p>
        <p className="text-xs text-gray-400 mt-1">
          {room.time_control / 60}+{room.increment} min ·{" "}
          {playerColor === "spectator" ? "👁 Spectating" : `Playing as ${playerColor}`}
        </p>
      </div>

      <ChessGame
        roomId={id}
        gameId={room.game?.id}
        token={token}
        playerColor={playerColor}
        currentUsername={user?.username ?? null}
      />
    </div>
  );
}
