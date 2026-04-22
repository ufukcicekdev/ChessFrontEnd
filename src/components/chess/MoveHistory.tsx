"use client";
import { useMemo, useRef, useEffect } from "react";

interface MoveHistoryProps {
  pgn: string;
}

interface MovePair {
  number: number;
  white: string;
  black: string;
}

export default function MoveHistory({ pgn }: MoveHistoryProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const pairs = useMemo<MovePair[]>(() => {
    if (!pgn) return [];
    const tokens = pgn.split(" ");
    const result: MovePair[] = [];
    let current: Partial<MovePair> = {};

    for (const token of tokens) {
      if (/^\d+\.$/.test(token)) {
        current = { number: parseInt(token), white: "", black: "" };
      } else if (current.white === "") {
        current.white = token;
      } else if (current.white) {
        current.black = token;
        result.push(current as MovePair);
        current = {};
      }
    }
    if (current.white) {
      result.push({ ...current, black: "" } as MovePair);
    }
    return result;
  }, [pgn]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // Keep scroll inside the moves panel; avoid scrolling the whole page on mobile.
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [pgn]);

  return (
    <div ref={containerRef} className="card flex flex-col gap-1 max-h-64 overflow-y-auto overscroll-contain">
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Moves</p>
      {pairs.length === 0 && <p className="text-xs text-gray-600 italic">No moves yet</p>}
      {pairs.map((p) => (
        <div key={p.number} className="flex items-center gap-1 text-sm">
          <span className="text-gray-500 w-6 text-right shrink-0">{p.number}.</span>
          <span className="w-14 font-mono">{p.white}</span>
          <span className="w-14 font-mono text-gray-400">{p.black}</span>
        </div>
      ))}
    </div>
  );
}
