"use client";
import { useEffect, useState, useCallback } from "react";
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

export function useChallenges() {
  const { token } = useAuthStore();
  const [challenges, setChallenges] = useState<PendingChallenge[]>([]);
  const router = useRouter();

  const poll = useCallback(async () => {
    if (!token) return;
    try {
      const { data } = await api.get("/api/chess/challenges/pending/");
      setChallenges(data);
    } catch {
      // silently ignore (e.g. not logged in)
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    poll();
    const t = setInterval(poll, 5000);
    return () => clearInterval(t);
  }, [poll, token]);

  const accept = useCallback(async (id: string) => {
    const { data } = await api.post(`/api/chess/challenges/${id}/accept/`);
    setChallenges((prev) => prev.filter((c) => c.id !== id));
    router.push(`/room/${data.room_id}`);
  }, [router]);

  const decline = useCallback(async (id: string) => {
    await api.post(`/api/chess/challenges/${id}/decline/`);
    setChallenges((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return { challenges, accept, decline };
}
