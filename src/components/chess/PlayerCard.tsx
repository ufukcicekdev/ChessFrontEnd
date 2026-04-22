import { clsx } from "clsx";

interface PlayerCardProps {
  username: string;
  title?: string | null;
  rating?: number | null;
  time: string;
  isActive: boolean;
  isTop?: boolean;
}

export default function PlayerCard({ username, title, rating, time, isActive, isTop }: PlayerCardProps) {
  return (
    <div
      className={clsx(
        "flex items-center justify-between px-3 py-2 rounded-lg border transition-colors",
        isActive
          ? "border-amber-500 bg-amber-500/10"
          : "border-gray-700 bg-gray-900"
      )}
    >
      <div className="min-w-0 flex items-center gap-2">
        <span className="font-medium text-sm truncate">{username}</span>
        {title && (
          <span className="text-[10px] font-semibold text-gray-200 bg-white/[0.06] border border-white/[0.08] px-1.5 py-0.5 rounded shrink-0">
            {title}
          </span>
        )}
        {typeof rating === "number" && (
          <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded shrink-0">
            {rating}
          </span>
        )}
      </div>
      <span
        className={clsx(
          "font-mono font-bold tabular-nums text-sm px-2 py-0.5 rounded",
          isActive ? "bg-amber-500 text-gray-950" : "bg-gray-800 text-gray-300"
        )}
      >
        {time}
      </span>
    </div>
  );
}
