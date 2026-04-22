import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/types";
import api from "@/lib/api";

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,

      login: async (username, password) => {
        const { data } = await api.post("/api/token/", { username, password });
        localStorage.setItem("access_token", data.access);
        localStorage.setItem("refresh_token", data.refresh);
        set({ token: data.access, refreshToken: data.refresh });

        const profile = await api.get("/api/users/profile/");
        set({ user: profile.data });
      },

      logout: () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        set({ user: null, token: null, refreshToken: null });
      },

      fetchProfile: async () => {
        try {
          const { data } = await api.get("/api/users/profile/");
          set({ user: data });
        } catch {
          // not authenticated
        }
      },
    }),
    { name: "auth-storage", partialize: (s) => ({ token: s.token, refreshToken: s.refreshToken }) }
  )
);
