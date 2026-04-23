"use client";
import { useEffect, useState, useCallback, useRef } from "react";
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
  status: "pending" | "accepted" | "declined";
  room_id: string | null;
  wager_amount: string | null;
  created_at: string;
}

export function useChallenges() {
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
        // Auto-redirect if accepted and not already redirected
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
    if (!token) return;
    poll();
    const t = setInterval(poll, 3000);
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

  return { received, sent, accept, decline, dismissSent };
}
