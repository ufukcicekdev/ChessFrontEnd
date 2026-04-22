import { clsx } from "clsx";

interface PlayerCardProps {
  username: string;
  time: string;
  isActive: boolean;
  isTop?: boolean;
}

export default function PlayerCard({ username, time, isActive, isTop }: PlayerCardProps) {
  return (
    <div
      className={clsx(
        "flex items-center justify-between px-3 py-2 rounded-lg border transition-colors",
        isActive
          ? "border-amber-500 bg-amber-500/10"
          : "border-gray-700 bg-gray-900"
      )}
    >
      <span className="font-medium text-sm truncate">{username}</span>
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
