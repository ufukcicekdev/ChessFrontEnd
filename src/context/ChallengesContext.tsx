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
            router.push(`/room/${c.room_id}`);
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
    poll();
    const t = setInterval(poll, 4000);
    return () => clearInterval(t);
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
