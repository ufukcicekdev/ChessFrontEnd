"use client";
import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export interface PendingChallenge {
  id: string;
  challenger: string;
  challenger_rating: number | null;
  time_control: number;
  increment: number;
  wager_amount: string | null;
  created_at: string;
}

export interface SentChallenge {
  id: string;
  challenged: string;
  challenged_rating: number | null;
  time_control: number;
  increment: number;
  status: "pending" | "accepted" | "declined" | "expired";
  room_id: string | null;
  wager_amount: string | null;
  created_at: string;
}

interface ChallengesCtx {
  received: PendingChallenge[];
  sent: SentChallenge[];
  accept: (id: string) => Promise<void>;
  decline: (id: string) => Promise<void>;
  dismissSent: (id: string) => void;
}

const Ctx = createContext<ChallengesCtx>({
  received: [], sent: [],
  accept: async () => {}, decline: async () => {}, dismissSent: () => {},
});

export function ChallengesProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  const [received, setReceived] = useState<PendingChallenge[]>([]);
  const [sent, setSent] = useState<SentChallenge[]>([]);
  const router = useRouter();
  const seenRef = useRef<Set<string>>(new Set());

  const poll = useCallback(async () => {
    if (!token) return;
    try {
      const [pendingRes, sentRes] = await Promise.all([
        api.get("/api/chess/challenges/pending/"),
        api.get("/api/chess/challenges/sent/"),
      ]);
      setReceived(pendingRes.data);
      const sentData: SentChallenge[] = sentRes.data;
      setSent((prev) => {
        sentData.forEach((c) => {
          if (c.status === "accepted" && c.room_id && !seenRef.current.has(c.id)) {
            seenRef.current.add(c.id);
            // Don't re-navigate if we're already in that room (e.g. an old
            // rematch flow could push us to the room we're already in, which
            // remounts the page and resets the board).
            const target = `/room/${c.room_id}`;
            if (typeof window === "undefined" || window.location.pathname !== target) {
              router.push(target);
            }
          }
        });
        return sentData;
      });
    } catch {
      // silently ignore
    }
  }, [token, router]);

  useEffect(() => {
    if (!token) { setReceived([]); setSent([]); return; }

    poll(); // initial load

    // Real-time: a per-user WebSocket pushes "something changed" events; we then
    // refetch. This replaces constant polling — no fixed-interval requests.
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let heartbeat: ReturnType<typeof setInterval> | undefined;
    let watchdog: ReturnType<typeof setInterval> | undefined;
    let lastMsgAt = Date.now();
    let closed = false;
    let attempts = 0;

    const stopHeartbeat = () => { clearInterval(heartbeat); clearInterval(watchdog); };

    const connect = async () => {
      const wsBase = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";
      // Prefer a short-lived one-time ticket (axios refreshes an expired JWT
      // for us) so a stale access token can't wedge the reconnect loop.
      let url = `${wsBase}/ws/notifications/`;
      try {
        const { data } = await api.post("/api/chess/ws-ticket/");
        url += `?ticket=${data.ticket}`;
      } catch {
        const access = (typeof window !== "undefined" && localStorage.getItem("access_token")) || token;
        url += `?token=${access}`;
      }
      if (closed) return;
      try {
        ws = new WebSocket(url);
      } catch {
        return;
      }
      ws.onopen = () => {
        attempts = 0;
        lastMsgAt = Date.now();
        poll();
        // Heartbeat: ping so a half-open connection is detected and reconnected
        // (otherwise missed real-time events silently stop arriving).
        stopHeartbeat();
        heartbeat = setInterval(() => {
          if (ws?.readyState === WebSocket.OPEN) {
            try { ws.send(JSON.stringify({ type: "ping" })); } catch { /* noop */ }
          }
        }, 25000);
        watchdog = setInterval(() => {
          if (Date.now() - lastMsgAt > 40000) {
            try { ws?.close(); } catch { /* noop */ }
          }
        }, 10000);
      };
      ws.onmessage = (e) => {
        lastMsgAt = Date.now();
        let type: string | undefined;
        try { type = JSON.parse(e.data)?.type; } catch { /* noop */ }
        if (type === "pong") return; // heartbeat ack — don't refetch
        poll();
      };
      ws.onclose = () => {
        stopHeartbeat();
        if (closed) return;
        attempts += 1;
        const delay = Math.min(30000, 1000 * 2 ** attempts);
        reconnectTimer = setTimeout(connect, delay);
      };
      ws.onerror = () => { try { ws?.close(); } catch { /* noop */ } };
    };
    connect();

    // Safety net for reconnect gaps / missed events — slow, and only when visible.
    const tick = () => { if (!document.hidden) poll(); };
    const t = setInterval(tick, 60000);
    const onVisible = () => { if (!document.hidden) poll(); };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      closed = true;
      clearInterval(t);
      stopHeartbeat();
      if (reconnectTimer) clearTimeout(reconnectTimer);
      document.removeEventListener("visibilitychange", onVisible);
      try { ws?.close(); } catch { /* noop */ }
    };
  }, [poll, token]);

  const accept = useCallback(async (id: string) => {
    const { data } = await api.post(`/api/chess/challenges/${id}/accept/`);
    setReceived((prev) => prev.filter((c) => c.id !== id));
    router.push(`/room/${data.room_id}`);
  }, [router]);

  const decline = useCallback(async (id: string) => {
    await api.post(`/api/chess/challenges/${id}/decline/`);
    setReceived((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const dismissSent = useCallback((id: string) => {
    setSent((prev) => prev.filter((c) => c.id !== id));
    seenRef.current.add(id);
  }, []);

  return (
    <Ctx.Provider value={{ received, sent, accept, decline, dismissSent }}>
      {children}
    </Ctx.Provider>
  );
}

export function useChallenges() {
  return useContext(Ctx);
}
