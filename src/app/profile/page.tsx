"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { User, WithdrawalRequest } from "@/types";
import api from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import ToastContainer from "@/components/ui/Toast";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  rejected: "Rejected",
};
const STATUS_COLOR: Record<string, string> = {
  pending: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  paid: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  rejected: "text-red-400 bg-red-500/10 border-red-500/30",
};

export default function ProfilePage() {
  const { user: storeUser, fetchProfile } = useAuthStore();
  const router = useRouter();
  const { toasts, add, remove } = useToast();

  // Taze profil verisi — store'a güvenmiyoruz, her zaman API'den çekiyoruz
  const [profile, setProfile] = useState<User | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [iban, setIban] = useState("");
  const [ibanSaving, setIbanSaving] = useState(false);

  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(true);

  useEffect(() => {
    // Auth kontrolü için store'u kullan
    if (storeUser === null && !localStorage.getItem("access_token")) {
      router.push("/auth/login");
      return;
    }
    // Her zaman taze veri çek
    api.get("/api/users/profile/")
      .then((r) => {
        setProfile(r.data);
        setIban(r.data.iban ?? "");
        fetchProfile(); // store'u da güncelle
      })
      .catch(() => router.push("/auth/login"))
      .finally(() => setProfileLoading(false));

    api.get("/api/users/withdrawals/")
      .then((r) => setWithdrawals(r.data))
      .finally(() => setWithdrawalsLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const user = profile;

  const saveIban = async () => {
    setIbanSaving(true);
    try {
      await api.patch("/api/users/profile/", { iban });
      await fetchProfile();
      add("IBAN saved.", "success");
    } catch {
      add("Failed to save IBAN.", "error");
    } finally {
      setIbanSaving(false);
    }
  };

  const requestWithdrawal = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) return;
    setWithdrawLoading(true);
    try {
      await api.post("/api/users/withdrawals/", { amount: withdrawAmount });
      await fetchProfile();
      const r = await api.get("/api/users/withdrawals/");
      setWithdrawals(r.data);
      setWithdrawAmount("");
      add("Withdrawal request created.", "success");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Failed to create withdrawal request.";
      add(msg, "error");
    } finally {
      setWithdrawLoading(false);
    }
  };

  if (profileLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-500 text-sm">Loading…</div>
    </div>
  );
  if (!user) return null;

  const balance = parseFloat(user.wallet_balance ?? "0");
  const gamesPlayed = user.games_played ?? 0;
  const gamesWon = user.games_won ?? 0;
  const gamesDrawn = user.games_drawn ?? 0;
  const gamesLost = gamesPlayed - gamesWon - gamesDrawn;
  const winRate = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;

  return (
    <>
      <ToastContainer toasts={toasts} remove={remove} />
      <div className="min-h-screen pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto flex flex-col gap-6">

          {/* Üst kart — kimlik */}
          <div className="card flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-3xl font-black text-amber-400 shrink-0">
              {user.username[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold">{user.username}</h1>
                {user.title && (
                  <span className="text-xs font-semibold bg-white/[0.06] border border-white/[0.08] px-2 py-0.5 rounded text-gray-300">
                    {user.title}
                  </span>
                )}
              </div>
              <p className="text-gray-400 text-sm mt-0.5">{user.email}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-black font-mono text-amber-400">{user.rating}</p>
              <p className="text-xs text-gray-500">Rating</p>
            </div>
          </div>

          {/* İstatistikler */}
          <div className="card flex flex-col gap-4">
            {/* W / D / L sayılar */}
            <div className="grid grid-cols-4 gap-3 text-center">
              <div>
                <p className="text-2xl font-black font-mono">{gamesPlayed}</p>
                <p className="text-xs text-gray-500 mt-0.5">Games</p>
              </div>
              <div>
                <p className="text-2xl font-black font-mono text-emerald-400">{gamesWon}</p>
                <p className="text-xs text-gray-500 mt-0.5">Wins</p>
              </div>
              <div>
                <p className="text-2xl font-black font-mono text-gray-400">{gamesDrawn}</p>
                <p className="text-xs text-gray-500 mt-0.5">Draws</p>
              </div>
              <div>
                <p className="text-2xl font-black font-mono text-red-400">{gamesLost}</p>
                <p className="text-xs text-gray-500 mt-0.5">Losses</p>
              </div>
            </div>

            {/* Win rate bar */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-14 shrink-0">Win rate</span>
              <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${winRate}%` }} />
              </div>
              <span className="text-xs font-mono text-amber-400 w-8 text-right">{winRate}%</span>
            </div>

            {/* Next title progress */}
            {user.next_title && typeof user.rating_to_next_title === "number" && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-14 shrink-0">Next title</span>
                <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                  {(() => {
                    const thresholds: [number, string][] = [
                      [2600,"Super Grandmaster"],[2500,"Grandmaster"],[2400,"International Master"],
                      [2300,"FIDE Master"],[2200,"Candidate Master"],[2000,"Expert"],
                      [1800,"Class A"],[1600,"Class B"],[1400,"Class C"],[1200,"Class D"],[1000,"Novice"],[0,"Beginner"],
                    ];
                    const nextIdx = thresholds.findIndex(([,n]) => n === user.next_title);
                    const nextMin = nextIdx >= 0 ? thresholds[nextIdx][0] : user.rating;
                    const prevMin = nextIdx + 1 < thresholds.length ? thresholds[nextIdx + 1][0] : 0;
                    const pct = Math.min(100, Math.round(((user.rating - prevMin) / (nextMin - prevMin)) * 100));
                    return <div className="h-full bg-violet-500 rounded-full" style={{ width: `${pct}%` }} />;
                  })()}
                </div>
                <span className="text-xs text-violet-400 text-right leading-tight">
                  {user.next_title}<br/>
                  <span className="text-gray-600">{user.rating_to_next_title} pts away</span>
                </span>
              </div>
            )}
          </div>

          {/* Wallet */}
          <div className="card flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-base">Wallet</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Available balance</span>
                <span className="text-lg font-black font-mono text-emerald-400">
                  ${balance.toFixed(2)}
                </span>
              </div>
            </div>

            {/* IBAN */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-400 font-medium">IBAN (for withdrawals)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={iban}
                  onChange={(e) => setIban(e.target.value.toUpperCase().replace(/\s/g, ""))}
                  placeholder="TR000000000000000000000000"
                  maxLength={34}
                  className="input flex-1 text-sm font-mono py-2"
                />
                <button
                  onClick={saveIban}
                  disabled={ibanSaving}
                  className="btn-secondary text-sm px-4"
                >
                  {ibanSaving ? "…" : "Save"}
                </button>
              </div>
              {!user.iban && (
                <p className="text-xs text-amber-400/80">Add your IBAN to enable withdrawals.</p>
              )}
            </div>

            {/* Withdrawal request */}
            <div className="border-t border-white/[0.06] pt-4 flex flex-col gap-2">
              <label className="text-xs text-gray-400 font-medium">Request a withdrawal</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    min="1"
                    max={balance}
                    placeholder="0.00"
                    className="input w-full text-sm py-2 pl-7"
                  />
                </div>
                <button
                  onClick={requestWithdrawal}
                  disabled={withdrawLoading || !user.iban || balance <= 0}
                  className="btn-primary text-sm px-4"
                >
                  {withdrawLoading ? "…" : "Withdraw"}
                </button>
              </div>
              {balance <= 0 && (
                <p className="text-xs text-gray-500">No balance available to withdraw.</p>
              )}
            </div>
          </div>

          {/* Withdrawal history */}
          <div className="card flex flex-col gap-3">
            <h2 className="font-semibold text-base">Withdrawal History</h2>
            {withdrawalsLoading ? (
              <p className="text-sm text-gray-500">Loading…</p>
            ) : withdrawals.length === 0 ? (
              <p className="text-sm text-gray-500">No withdrawal requests yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {withdrawals.map((w) => (
                  <div key={w.id} className="flex items-center justify-between bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3">
                    <div>
                      <p className="text-sm font-mono font-semibold">${parseFloat(w.amount).toFixed(2)}</p>
                      <p className="text-xs text-gray-500 font-mono">{w.iban_snapshot}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-semibold border px-2 py-0.5 rounded ${STATUS_COLOR[w.status]}`}>
                        {STATUS_LABEL[w.status]}
                      </span>
                      <p className="text-[10px] text-gray-600 mt-1">
                        {new Date(w.created_at).toLocaleDateString("tr-TR")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
