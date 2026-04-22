"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/hooks/useToast";
import ToastContainer from "@/components/ui/Toast";

export default function LoginPage() {
  const { login } = useAuthStore();
  const router = useRouter();
  const { toasts, add, remove } = useToast();
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.username, form.password);
      router.push("/play");
    } catch {
      add("Invalid username or password.", "error");
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
          <h1 className="text-2xl font-black">Welcome back</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your account and continue playing</p>
        </div>

        <form onSubmit={submit} className="card flex flex-col gap-4 p-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Username</label>
            <input required value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              placeholder="your_username" className="input" autoComplete="username" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Password</label>
            <input required type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="••••••••" className="input" autoComplete="current-password" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-1">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Signing in…
              </span>
            ) : "Sign In →"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          No account?{" "}
          <Link href="/auth/register" className="text-amber-400 hover:text-amber-300 font-semibold transition-colors">
            Register for free
          </Link>
        </p>
      </div>
    </div>
  );
}
