import Link from "next/link";
import LivePlatformStats from "@/components/LivePlatformStats";

const FEATURES = [
  { icon: "⚡", title: "Real-time Play",       desc: "Instant move sync via WebSockets. Your opponent's move appears in milliseconds.",        color: "from-amber-500/20 to-orange-500/5",  border: "border-amber-500/20" },
  { icon: "👁", title: "Live Spectating",      desc: "Watch any public game in real-time. Follow moves as they happen, never miss a match.",  color: "from-violet-500/20 to-purple-500/5", border: "border-violet-500/20" },
  { icon: "🏆", title: "Tournaments",          desc: "Join single-elimination bracket tournaments. The bracket is auto-generated, compete for the title.", color: "from-emerald-500/20 to-green-500/5", border: "border-emerald-500/20" },
  { icon: "📈", title: "Elo Rating",           desc: "Your Elo updates after every game. Climb the leaderboard and surpass your rivals.",     color: "from-blue-500/20 to-cyan-500/5",     border: "border-blue-500/20" },
  { icon: "🎮", title: "All Time Controls",    desc: "Play Bullet, Blitz, Rapid or Classical. Or create a custom time control.",              color: "from-rose-500/20 to-pink-500/5",     border: "border-rose-500/20" },
  { icon: "📜", title: "Game History",         desc: "Every game is stored in PGN format. Review any game, analyze your mistakes.",           color: "from-orange-500/20 to-amber-500/5",  border: "border-orange-500/20" },
];

// Rank 1 after white kingside castle: ♜♞♝♛ · · ♖♔  (king on g1, rook on f1)
const BACK_RANK  = ["♜","♞","♝","♛","·","·","♖","♔"];
const PAWN_RANK  = ["♟","♟","♟","♟","♟","♟","♟","♟"];

export default function HomePage() {
  return (
    <div className="bg-hero min-h-screen">
      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 chess-pattern opacity-40" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-500/[0.04] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-32 left-[8%]  text-5xl opacity-10 animate-float delay-100 select-none">♛</div>
        <div className="absolute top-48 right-[10%] text-4xl opacity-10 animate-float delay-200 select-none">♞</div>
        <div className="absolute bottom-20 left-[15%] text-3xl opacity-10 animate-float delay-300 select-none">♜</div>
        <div className="absolute bottom-32 right-[8%] text-5xl opacity-10 animate-float select-none">♝</div>

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 text-sm text-amber-400 font-medium mb-6">
            <span className="font-mono font-bold tracking-widest">O-O</span>
            <span className="w-px h-3.5 bg-amber-500/40" />
            Kingside castle. Real-time chess.
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-none mb-6">
            Castle your{" "}<span className="gradient-text">way to the top.</span>
          </h1>
          <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            <span className="text-amber-400 font-mono font-bold">chess O-O</span> — named after the kingside castle, the boldest move in chess.
            Real-time games, live spectating and competitive tournaments, all in one platform.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/play" className="btn-primary text-base px-8 py-3.5">Play Now →</Link>
            <Link href="/watch" className="btn-secondary text-base px-8 py-3.5">Watch Live</Link>
          </div>

          {/* Mini board — castling position (O-O) */}
          <div className="mt-16 flex flex-col items-center gap-3">
            <div className="inline-grid grid-cols-8 rounded-2xl overflow-hidden shadow-2xl shadow-black/60 border border-white/10 select-none">
              {BACK_RANK.map((p, i) => {
                const isLight = i % 2 === 0;
                // highlight king (g1=idx 6) and rook (f1=idx 5) after castling
                const isCastled = i === 5 || i === 6;
                return (
                  <div key={i} className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-xl sm:text-2xl transition-all"
                    style={{
                      background: isCastled ? "rgba(245,158,11,0.45)" : isLight ? "#f0d9b5" : "#b58863",
                      color: "#1a1a1a",
                    }}>
                    {p === "·" ? "" : p}
                  </div>
                );
              })}
              {PAWN_RANK.map((p, i) => (
                <div key={`pw${i}`} className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-xl sm:text-2xl"
                  style={{ background: i % 2 !== 0 ? "#f0d9b5" : "#b58863", color: "#1a1a1a" }}>
                  {p}
                </div>
              ))}
            </div>
            <p className="text-xs text-amber-400/70 font-mono tracking-widest">O-O · Kingside Castle</p>
          </div>
        </div>
      </section>

      {/* Live stats from API */}
      <section className="px-4 py-12">
        <LivePlatformStats variant="hero" />
      </section>

      {/* Features */}
      <section className="px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              Everything in <span className="gradient-text">one platform</span>
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Every feature you need to play chess, delivered in one seamless experience.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} className={`rounded-2xl border ${f.border} p-6 bg-gradient-to-br ${f.color} hover:scale-[1.02] transition-transform duration-200`}>
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-base mb-2">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <div className="card-glow p-10">
            <div className="text-4xl mb-4 font-mono font-black tracking-widest text-amber-400">O-O</div>
            <h2 className="text-3xl font-bold mb-3">Ready to castle?</h2>
            <p className="text-gray-400 mb-8">
              Create a free account, find an opponent and start playing. Your first game is one castle away.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/auth/register" className="btn-primary px-8">Register Free</Link>
              <Link href="/tournaments"   className="btn-secondary px-8">Browse Tournaments</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
