"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import { clsx } from "clsx";
import { useToast } from "@/hooks/useToast";
import ToastContainer from "@/components/ui/Toast";
import LivePlatformStats from "@/components/LivePlatformStats";

const TIME_PRESETS = [
  { label: "1+0",  sublabel: "Bullet",    time: 60,   inc: 0,  color: "text-red-400" },
  { label: "2+1",  sublabel: "Bullet",    time: 120,  inc: 1,  color: "text-red-400" },
  { label: "3+0",  sublabel: "Blitz",     time: 180,  inc: 0,  color: "text-amber-400" },
  { label: "5+0",  sublabel: "Blitz",     time: 300,  inc: 0,  color: "text-amber-400" },
  { label: "5+3",  sublabel: "Blitz",     time: 300,  inc: 3,  color: "text-amber-400" },
  { label: "10+0", sublabel: "Rapid",     time: 600,  inc: 0,  color: "text-green-400" },
  { label: "15+10",sublabel: "Rapid",     time: 900,  inc: 10, color: "text-green-400" },
  { label: "30+0", sublabel: "Classical", time: 1800, inc: 0,  color: "text-blue-400" },
];

export default function PlayPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { toasts, add, remove } = useToast();
  const [selected, setSelected] = useState(3);
  const [isPublic, setIsPublic] = useState(true);
  const [roomName, setRoomName] = useState("");
  const [loading, setLoading] = useState(false);
  const [joinId, setJoinId] = useState("");
  const [searching, setSearching] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!user) return;
    api.get("/api/chess/rooms/?status=active")
      .then(({ data }) => {
        const rooms: { id: string; game?: { white_player?: { username: string }; black_player?: { username: string } } }[] = data.results ?? data;
        const mine = rooms.find((r) =>
          r.game?.white_player?.username === user.username ||
          r.game?.black_player?.username === user.username
        );
        setActiveRoomId(mine?.id ?? null);
      })
      .catch(() => {});
  }, [user]);

  const createRoom = async () => {
    if (!user) { router.push("/auth/login"); return; }
    setLoading(true);
    try {
      const preset = TIME_PRESETS[selected];
      const { data } = await api.post("/api/chess/rooms/", {
        name: roomName || `${user.username}'s game`,
        is_public: isPublic,
        time_control: preset.time,
        increment: preset.inc,
      });
      router.push(`/room/${data.id}`);
    } catch {
      add("Failed to create room. Make sure you're logged in.", "error");
    } finally {
      setLoading(false);
    }
  };

  const stopPolling = () => {
    if (pollTimer.current) clearInterval(pollTimer.current);
    pollTimer.current = null;
  };

  const startMatchmaking = async () => {
    if (!user) { router.push("/auth/login"); return; }
    const preset = TIME_PRESETS[selected];
    setSearching(true);
    try {
      const { data } = await api.post("/api/chess/matchmaking/join/", {
        time_control: preset.time,
        increment: preset.inc,
      });
      if (data.status === "matched" && data.room_id) {
        stopPolling();
        router.push(`/room/${data.room_id}`);
        return;
      }
      stopPolling();
      pollTimer.current = setInterval(async () => {
        try {
          const res = await api.get("/api/chess/matchmaking/status/", {
            params: { time_control: preset.time, increment: preset.inc },
          });
          if (res.data.status === "matched" && res.data.room_id) {
            stopPolling();
            router.push(`/room/${res.data.room_id}`);
          }
        } catch {
          // keep polling
        }
      }, 1500);
    } catch {
      add("Matchmaking failed. Check backend Redis config.", "error");
      setSearching(false);
    }
  };

  const cancelMatchmaking = async () => {
    const preset = TIME_PRESETS[selected];
    stopPolling();
    setSearching(false);
    try {
      await api.post("/api/chess/matchmaking/leave/", {
        time_control: preset.time,
        increment: preset.inc,
      });
    } catch {
      // ignore
    }
  };

  const joinRoom = () => {
    if (!joinId.trim()) { add("Please enter a room ID.", "error"); return; }
    router.push(`/room/${joinId.trim()}`);
  };

  useEffect(() => {
    return () => stopPolling();
  }, []);

  return (
    <div className="min-h-screen bg-hero pt-24 pb-16 px-4">
      <ToastContainer toasts={toasts} remove={remove} />
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        <div className="text-center mb-2">
          <h1 className="text-4xl font-black mb-2">Create a <span className="gradient-text">Game</span></h1>
          <p className="text-gray-500 text-sm">Choose your time control and start playing</p>
        </div>

        {activeRoomId && (
          <div className="card border border-amber-500/40 bg-amber-500/5 flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse shrink-0" />
              <p className="text-sm text-amber-300 font-medium">You have an active game in progress.</p>
            </div>
            <button
              onClick={() => router.push(`/room/${activeRoomId}`)}
              className="btn-primary text-xs px-4 py-2 shrink-0"
            >
              Rejoin →
            </button>
          </div>
        )}

        <div className="flex justify-center -mt-1 mb-1">
          <LivePlatformStats variant="compact" />
        </div>

        <div className="card">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Time Control</p>
          <div className="grid grid-cols-4 gap-2">
            {TIME_PRESETS.map((p, i) => (
              <button
                key={i}
                onClick={() => setSelected(i)}
                className={clsx(
                  "rounded-xl py-3 px-2 text-center transition-all duration-200 border",
                  selected === i
                    ? "bg-amber-500/15 border-amber-500/40 scale-[1.03]"
                    : "border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04]"
                )}
              >
                <div className={clsx("font-bold text-base", selected === i ? "text-amber-400" : p.color)}>
                  {p.label}
                </div>
                <div className="text-xs text-gray-600 mt-0.5">{p.sublabel}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="card flex flex-col gap-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Room Settings</p>
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Room name (optional)"
            className="input"
          />
          <label className="flex items-center gap-3 cursor-pointer group">
            <div
              onClick={() => setIsPublic(!isPublic)}
              className={clsx("w-11 h-6 rounded-full transition-colors relative", isPublic ? "bg-amber-500" : "bg-white/10")}
            >
              <div className={clsx("absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform", isPublic ? "translate-x-5" : "translate-x-0.5")} />
            </div>
            <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Public room</span>
          </label>
        </div>

        {!searching ? (
          <div className="flex flex-col gap-3">
            <button onClick={startMatchmaking} className="btn-primary w-full py-4 text-base">
              Find Match →
            </button>
            <button onClick={createRoom} disabled={loading} className="btn-secondary w-full py-3 text-sm">
              {loading ? "Creating room…" : "Create Room (link) →"}
            </button>
          </div>
        ) : (
          <div className="card flex items-center justify-between">
            <div className="text-sm text-gray-300">
              Searching for an opponent… <span className="text-gray-500">(same time control)</span>
            </div>
            <button onClick={cancelMatchmaking} className="btn-danger px-4 py-2 text-sm">
              Cancel
            </button>
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className="flex-1 border-t border-white/[0.06]" />
          <span className="text-xs text-gray-600">or</span>
          <div className="flex-1 border-t border-white/[0.06]" />
        </div>

        <div className="card flex flex-col gap-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Join by Room ID</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={joinId}
              onChange={(e) => setJoinId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && joinRoom()}
              placeholder="Paste room UUID…"
              className="input"
            />
            <button onClick={joinRoom} disabled={!joinId.trim()} className="btn-primary px-5 shrink-0">→</button>
          </div>
        </div>
      </div>
    </div>
  );
}
