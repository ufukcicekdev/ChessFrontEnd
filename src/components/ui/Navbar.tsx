"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useEffect, useState } from "react";
import { clsx } from "clsx";

const NAV_LINKS = [
  { href: "/play",        label: "Play" },
  { href: "/train",       label: "Train" },
  { href: "/watch",       label: "Watch" },
  { href: "/history",     label: "History" },
  { href: "/tournaments", label: "Tournaments" },
  { href: "/leaderboard", label: "Leaderboard" },
];

export default function Navbar() {
  const { user, logout, fetchProfile } = useAuthStore();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={clsx(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      scrolled ? "bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-white/[0.06] shadow-2xl shadow-black/50" : "bg-transparent"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-gray-950 font-black text-lg shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform">♟</div>
          <span className="font-bold text-lg tracking-tight">Chess</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href}
              className={clsx("px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                pathname === link.href ? "bg-amber-500/15 text-amber-400" : "text-gray-400 hover:text-gray-100 hover:bg-white/[0.06]"
              )}>
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <Link href="/profile" className="flex items-center gap-2 bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-1.5 hover:bg-white/[0.09] transition-colors">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xs font-bold text-amber-400">
                  {user.username[0].toUpperCase()}
                </div>
                <span className="text-sm font-medium">{user.username}</span>
                {user.title && (
                  <span className="text-[10px] font-semibold text-gray-200 bg-white/[0.06] border border-white/[0.08] px-1.5 py-0.5 rounded">
                    {user.title}
                  </span>
                )}
                <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">{user.rating}</span>
                {parseFloat(user.wallet_balance ?? "0") > 0 && (
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    ${parseFloat(user.wallet_balance!).toFixed(2)}
                  </span>
                )}
              </Link>
              <button onClick={logout} className="btn-ghost text-sm">Sign Out</button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login"    className="btn-ghost text-sm">Sign In</Link>
              <Link href="/auth/register" className="btn-primary text-sm py-2 px-4">Register</Link>
            </div>
          )}
        </div>

        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-lg hover:bg-white/[0.06] transition-colors">
          <div className="w-5 flex flex-col gap-1.5">
            <span className={clsx("block h-0.5 bg-gray-400 transition-all", mobileOpen && "rotate-45 translate-y-2")} />
            <span className={clsx("block h-0.5 bg-gray-400 transition-all", mobileOpen && "opacity-0")} />
            <span className={clsx("block h-0.5 bg-gray-400 transition-all", mobileOpen && "-rotate-45 -translate-y-2")} />
          </div>
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden glass border-t border-white/[0.06] px-4 py-4 flex flex-col gap-2">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
              className={clsx("px-4 py-2.5 rounded-xl text-sm font-medium transition-colors",
                pathname === link.href ? "bg-amber-500/15 text-amber-400" : "text-gray-400 hover:bg-white/[0.06] hover:text-gray-100"
              )}>
              {link.label}
            </Link>
          ))}
          <div className="border-t border-white/[0.06] pt-2 mt-1 flex flex-col gap-2">
            {user ? (
              <>
                <Link href="/profile" onClick={() => setMobileOpen(false)} className="btn-secondary w-full text-sm text-center">
                  Profilim {parseFloat(user.wallet_balance ?? "0") > 0 && `· $${parseFloat(user.wallet_balance!).toFixed(2)}`}
                </Link>
                <button onClick={logout} className="btn-ghost w-full text-sm">Sign Out</button>
              </>
            ) : (
              <>
                <Link href="/auth/login"    onClick={() => setMobileOpen(false)} className="btn-secondary w-full text-sm text-center">Sign In</Link>
                <Link href="/auth/register" onClick={() => setMobileOpen(false)} className="btn-primary w-full text-sm text-center">Register</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
