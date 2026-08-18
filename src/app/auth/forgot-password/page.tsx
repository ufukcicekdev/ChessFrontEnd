"use client";
import { useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/api/users/password-reset/", { email: email.trim() });
    } catch {
      /* Always show success — never reveal whether the email exists. */
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-hero flex items-center justify-center px-4 pt-16">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/[0.05] rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center text-3xl text-gray-950 font-black mx-auto mb-4 shadow-xl shadow-amber-500/30">♟</div>
          <h1 className="text-2xl font-black">Forgot your password?</h1>
          <p className="text-gray-500 text-sm mt-1">Enter your email and we&apos;ll send you a reset link</p>
        </div>

        {sent ? (
          <div className="card p-6 text-center flex flex-col gap-3">
            <div className="text-4xl">📧</div>
            <p className="font-semibold">Check your email</p>
            <p className="text-sm text-gray-500">
              If an account exists for <span className="text-gray-300">{email}</span>, a password reset link is on its way.
              The link expires soon.
            </p>
            <Link href="/auth/login" className="btn-primary w-full py-3 mt-2">Back to sign in</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="card flex flex-col gap-4 p-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</label>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" className="input" autoComplete="email" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-1">
              {loading ? "Sending…" : "Send reset link →"}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-500 mt-5">
          Remembered it?{" "}
          <Link href="/auth/login" className="text-amber-400 hover:text-amber-300 font-semibold transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
