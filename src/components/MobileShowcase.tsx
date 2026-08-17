import Image from "next/image";
import {
  Home,
  Swords,
  Trophy,
  Eye,
  User,
  Zap,
  Timer,
  Clock,
  Hourglass,
  Signal,
  Wifi,
  BatteryFull,
  ChevronLeft,
  BadgeCheck,
} from "lucide-react";

/* ── Phone chrome ──────────────────────────────────────────────────────── */
function StatusBar() {
  return (
    <div className="flex items-center justify-between px-4 pt-2.5 pb-1 text-[9px] font-semibold text-gray-300">
      <span>9:41</span>
      <div className="flex items-center gap-1">
        <Signal size={10} />
        <Wifi size={10} />
        <BatteryFull size={12} />
      </div>
    </div>
  );
}

const NAV = [
  { Icon: Home, label: "Home" },
  { Icon: Swords, label: "Play" },
  { Icon: Trophy, label: "Tournaments" },
  { Icon: Eye, label: "Watch" },
  { Icon: User, label: "Profile" },
];

function TabBar({ active = "Play" }: { active?: string }) {
  return (
    <div className="mt-auto flex items-center justify-between px-3 py-2.5 border-t border-white/10">
      {NAV.map(({ Icon, label }) => (
        <div
          key={label}
          className={`flex flex-col items-center gap-0.5 ${active === label ? "text-white" : "text-gray-600"}`}
        >
          <Icon size={13} strokeWidth={active === label ? 2.4 : 1.8} />
          <span className="text-[6px] font-medium">{label}</span>
        </div>
      ))}
    </div>
  );
}

function Phone({ children }: { children: React.ReactNode }) {
  return (
    <div className="shrink-0 w-[188px] rounded-[2rem] border border-white/12 bg-[#0c0c11] p-1.5 shadow-2xl shadow-black/60">
      <div className="flex flex-col h-[392px] rounded-[1.6rem] overflow-hidden bg-[#0a0a0f]">
        <StatusBar />
        {children}
      </div>
    </div>
  );
}

/* ── Screen 1: Login ───────────────────────────────────────────────────── */
function LoginScreen() {
  return (
    <div className="flex flex-col items-center h-full px-6 pt-16">
      <div className="w-16 h-16 rounded-full overflow-hidden border border-white/15 bg-black mb-3">
        <Image src="/fianchess-emblem.jpg" alt="fianchess" width={64} height={64} className="w-full h-full object-cover scale-[1.18]" />
      </div>
      <div className="flex items-baseline gap-0.5 mb-14">
        <span className="font-bold text-lg text-white">fian</span>
        <span className="font-black text-lg text-amber-400">chess</span>
      </div>
      <button className="w-full bg-white text-black text-xs font-bold py-3 rounded-xl mb-3">LOG IN</button>
      <button className="w-full border border-white/20 text-white text-xs font-bold py-3 rounded-xl">SIGN UP</button>
      <p className="text-[9px] text-gray-500 mt-6">Play. Compete. Win.</p>
    </div>
  );
}

/* ── Screen 2: Play ────────────────────────────────────────────────────── */
const TIME_CONTROLS = [
  { Icon: Zap, name: "Bullet", tc: "1+0" },
  { Icon: Timer, name: "Blitz", tc: "3+0" },
  { Icon: Clock, name: "Rapid", tc: "10+0" },
  { Icon: Hourglass, name: "Classical", tc: "30+0" },
];

function PlayScreen() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-center relative px-4 py-2">
        <ChevronLeft size={14} className="absolute left-4 text-gray-400" />
        <span className="text-sm font-bold">Play</span>
      </div>
      <div className="flex flex-col gap-2.5 px-3 py-2">
        {TIME_CONTROLS.map(({ Icon, name, tc }) => (
          <div key={name} className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2.5">
            <Icon size={18} className="text-amber-400" strokeWidth={1.8} />
            <div>
              <div className="text-xs font-bold text-white">{name}</div>
              <div className="text-[9px] text-gray-500 font-mono">{tc}</div>
            </div>
          </div>
        ))}
      </div>
      <TabBar active="Play" />
    </div>
  );
}

/* ── Screen 3: Live Games ──────────────────────────────────────────────── */
const LIVE = [
  { w: "GM Hikaru", wr: "2804", b: "GM Magnus", br: "2887" },
  { w: "GM Alireza", wr: "2761", b: "GM Nepo", br: "2790" },
  { w: "GM Duda", wr: "2738", b: "GM Giri", br: "2745" },
];

function MiniStrip() {
  // decorative 8-cell rank
  return (
    <div className="grid grid-cols-8 rounded overflow-hidden mt-1.5">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="h-3 flex items-center justify-center text-[8px]"
          style={{ background: i % 2 === 0 ? "#c9b28c" : "#7a5a3a", color: "#1a1a1a" }}
        >
          {["♜", "♞", "♝", "♛", "♚", "♝", "♞", "♜"][i]}
        </div>
      ))}
    </div>
  );
}

function LiveGamesScreen() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-center px-4 py-2">
        <span className="text-sm font-bold">Live Games</span>
      </div>
      <div className="flex flex-col gap-2.5 px-3 py-1 overflow-hidden">
        {LIVE.map((g) => (
          <div key={g.w} className="bg-white/[0.04] border border-white/[0.06] rounded-lg px-2.5 py-2">
            <div className="flex items-center justify-between text-[9px]">
              <span className="badge-green px-1 py-0 text-[7px]">LIVE</span>
              <span className="badge-green px-1 py-0 text-[7px]">LIVE</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <div className="text-[9px]">
                <div className="font-bold text-white leading-tight">{g.w}</div>
                <div className="text-gray-500 font-mono">{g.wr}</div>
              </div>
              <div className="text-[9px] text-right">
                <div className="font-bold text-white leading-tight">{g.b}</div>
                <div className="text-gray-500 font-mono">{g.br}</div>
              </div>
            </div>
            <MiniStrip />
          </div>
        ))}
      </div>
      <TabBar active="Watch" />
    </div>
  );
}

/* ── Screen 4: Profile ─────────────────────────────────────────────────── */
const PROFILE_STATS = [
  ["Games Played", "1268"],
  ["Win Rate", "62%"],
  ["Rating", "1964"],
  ["Tournaments Won", "23"],
];

function ProfileScreen() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-center relative px-4 py-2">
        <ChevronLeft size={14} className="absolute left-4 text-gray-400" />
        <span className="text-sm font-bold">Profile</span>
      </div>
      <div className="flex flex-col items-center px-4 pt-3">
        <div className="w-14 h-14 rounded-full bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center text-xl font-bold text-amber-400 mb-2">
          C
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs font-bold text-white">ChessPlayer</span>
          <BadgeCheck size={12} className="text-amber-400" />
        </div>
        <span className="text-[9px] text-gray-500 mb-3">Member since 2024</span>
        <div className="w-full flex flex-col gap-2">
          {PROFILE_STATS.map(([label, val]) => (
            <div key={label} className="flex items-center justify-between text-[10px] border-b border-white/[0.06] pb-1.5">
              <span className="text-gray-400">{label}</span>
              <span className="font-bold text-white font-mono">{val}</span>
            </div>
          ))}
        </div>
        <button className="w-full border border-white/20 text-white text-[10px] font-bold py-2 rounded-lg mt-3">
          VIEW STATS
        </button>
      </div>
      <TabBar active="Profile" />
    </div>
  );
}

/* ── Section ───────────────────────────────────────────────────────────── */
export default function MobileShowcase() {
  return (
    <section className="px-4 py-12">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="font-serif-display text-3xl sm:text-4xl font-bold mb-2">Take the game anywhere.</h2>
          <p className="text-gray-500 text-sm">Play, spectate and climb the ranks — right from your pocket.</p>
        </div>
        <div className="flex justify-start lg:justify-center gap-5 overflow-x-auto pb-4 -mx-4 px-4 lg:mx-0 lg:px-0">
          <Phone><LoginScreen /></Phone>
          <Phone><PlayScreen /></Phone>
          <Phone><LiveGamesScreen /></Phone>
          <Phone><ProfileScreen /></Phone>
        </div>
      </div>
    </section>
  );
}
