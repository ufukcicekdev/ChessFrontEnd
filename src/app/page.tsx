import Link from "next/link";
import Image from "next/image";
import { Swords, Trophy, Eye, BarChart3, BookOpen, Users, Globe, Headphones } from "lucide-react";
import LiveGamesPreview from "@/components/LiveGamesPreview";
import MobileShowcase from "@/components/MobileShowcase";

const FEATURES = [
  { Icon: Swords,    title: "Play Online",  desc: "Bullet, Blitz, Rapid or Classical. Play anytime.", href: "/play" },
  { Icon: Trophy,    title: "Tournaments",  desc: "Join tournaments and win amazing rewards.",         href: "/tournaments" },
  { Icon: Eye,       title: "Live Games",   desc: "Watch live games and top players in action.",       href: "/watch" },
  { Icon: BarChart3, title: "Leaderboard",  desc: "Climb the ranks and become the best.",              href: "/leaderboard" },
  { Icon: BookOpen,  title: "Training",     desc: "Improve your game with puzzles and lessons.",       href: "/train" },
];

const STATS = [
  { Icon: Swords,     value: "5M+",   label: "Games Played" },
  { Icon: Users,      value: "150K+", label: "Active Players" },
  { Icon: Globe,      value: "200+",  label: "Countries" },
  { Icon: Headphones, value: "24/7",  label: "Live Support" },
  { Icon: Trophy,     value: "100+",  label: "Tournaments Daily" },
];

export default function HomePage() {
  return (
    <div className="bg-hero min-h-screen">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-16 px-4 overflow-hidden">
        <div className="absolute inset-0 chess-pattern opacity-40" />
        <div className="absolute top-10 right-[10%] w-[560px] h-[560px] bg-amber-500/[0.05] rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: copy */}
          <div>
            <h1
              className="font-serif-display text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-7"
            >
              Castle your <br /> way to the top.
            </h1>
            <p className="text-gray-400 text-lg max-w-sm mb-9 leading-relaxed">
              Real-time chess. Global players. Tournaments. Live spectating.
              Everything you need in one place.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/play" className="btn-contrast text-sm tracking-wide px-8 py-3.5">PLAY NOW</Link>
              <Link href="/watch" className="btn-outline text-sm tracking-wide px-8 py-3.5">WATCH LIVE</Link>
            </div>
          </div>

          {/* Right: hero image */}
          <div className="relative">
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10">
              <Image
                src="/hero-chess.jpeg"
                alt="Luxury chess set — the black king stands over a fallen white queen"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature strip ────────────────────────────────────────────────── */}
      <section className="px-4 pb-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {FEATURES.map((f) => (
            <Link
              key={f.title}
              href={f.href}
              className="card-hover group flex flex-col gap-2 p-5"
            >
              <f.Icon className="w-6 h-6 mb-1 opacity-80 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
              <h3 className="font-bold text-sm uppercase tracking-wide">{f.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Live games ───────────────────────────────────────────────────── */}
      <section className="px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Live Games
            </h2>
            <Link href="/watch" className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors">
              View All →
            </Link>
          </div>
          <LiveGamesPreview />
        </div>
      </section>

      {/* ── Mobile app showcase ──────────────────────────────────────────── */}
      <MobileShowcase />

      {/* ── Stats bar ────────────────────────────────────────────────────── */}
      <section className="px-4 pb-20">
        <div className="max-w-7xl mx-auto card grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 py-8">
          {STATS.map((s) => (
            <div key={s.label} className="flex items-center gap-3 justify-center">
              <s.Icon className="w-6 h-6 opacity-60 shrink-0" strokeWidth={1.5} />
              <div>
                <div className="text-xl font-black leading-none">{s.value}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
