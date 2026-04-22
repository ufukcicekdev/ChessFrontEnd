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
  const winRate = user.games_played > 0 ? Math.round((user.games_won / user.games_played) * 100) : 0;

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
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Games", value: user.games_played },
              { label: "Win Rate", value: `${winRate}%` },
              { label: "Draws", value: user.games_drawn },
            ].map((s) => (
              <div key={s.label} className="card text-center">
                <p className="text-2xl font-black font-mono text-white">{s.value}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
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
