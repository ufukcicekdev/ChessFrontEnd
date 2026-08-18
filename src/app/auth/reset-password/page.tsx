"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import ToastContainer from "@/components/ui/Toast";

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const { toasts, add, remove } = useToast();
  const uid = params.get("uid") ?? "";
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const invalidLink = !uid || !token;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { add("Password must be at least 6 characters.", "error"); return; }
    if (password !== confirm) { add("Passwords do not match.", "error"); return; }
    setLoading(true);
    try {
      await api.post("/api/users/password-reset/confirm/", { uid, token, new_password: password });
      setDone(true);
      setTimeout(() => router.push("/auth/login"), 1800);
    } catch (err: unknown) {
      add((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Could not reset password.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hero flex items-center justify-center px-4 pt-16">
      <ToastContainer toasts={toasts} remove={remove} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/[0.05] rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center text-3xl text-gray-950 font-black mx-auto mb-4 shadow-xl shadow-amber-500/30">♟</div>
          <h1 className="text-2xl font-black">Set a new password</h1>
          <p className="text-gray-500 text-sm mt-1">Choose a strong password you&apos;ll remember</p>
        </div>

        {invalidLink ? (
          <div className="card p-6 text-center flex flex-col gap-3">
            <div className="text-4xl">⚠️</div>
            <p className="font-semibold">Invalid or missing reset link</p>
            <p className="text-sm text-gray-500">Request a new password reset link to continue.</p>
            <Link href="/auth/forgot-password" className="btn-primary w-full py-3 mt-2">Request a new link</Link>
          </div>
        ) : done ? (
          <div className="card p-6 text-center flex flex-col gap-3">
            <div className="text-4xl">✅</div>
            <p className="font-semibold">Password updated</p>
            <p className="text-sm text-gray-500">Redirecting you to sign in…</p>
          </div>
        ) : (
          <form onSubmit={submit} className="card flex flex-col gap-4 p-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">New password</label>
              <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" className="input" autoComplete="new-password" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Confirm password</label>
              <input required type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••" className="input" autoComplete="new-password" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-1">
              {loading ? "Updating…" : "Update password →"}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-500 mt-5">
          <Link href="/auth/login" className="text-amber-400 hover:text-amber-300 font-semibold transition-colors">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-hero flex items-center justify-center text-gray-500">Loading…</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
