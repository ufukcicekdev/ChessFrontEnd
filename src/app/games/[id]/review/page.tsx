"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Chessboard } from "react-chessboard";
import { Chess, Square } from "chess.js";
import { clsx } from "clsx";
import { useCallback, useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import type { Game, Move } from "@/types";

function parseUci(uci: string): { from: Square; to: Square; promotion?: "q" | "r" | "b" | "n" } | null {
  if (!uci || uci.length < 4) return null;
  const from = uci.slice(0, 2) as Square;
  const to = uci.slice(2, 4) as Square;
  const p = uci.length >= 5 ? uci.slice(4, 5).toLowerCase() : undefined;
  const promotion =
    p === "q" || p === "r" || p === "b" || p === "n" ? (p as "q" | "r" | "b" | "n") : undefined;
  return { from, to, promotion };
}

function resultHeadline(g: Game): string {
  const w = g.white_player?.username ?? "White";
  const b = g.black_player?.username ?? "Black";
  if (g.result === "draw") return `${w} vs ${b} — Draw`;
  if (g.result === "white") return `${w} wins`;
  if (g.result === "black") return `${b} wins`;
  return `${w} vs ${b}`;
}

export default function GameReviewPage() {
  const { id } = useParams<{ id: string }>();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [plyIndex, setPlyIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [delayMs, setDelayMs] = useState(650);
  const [orientation, setOrientation] = useState<"white" | "black">("white");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get<Game>(`/api/chess/games/${id}/`);
        if (!cancelled) {
          setGame(data);
          setPlyIndex(0);
          setPlaying(false);
        }
      } catch {
        if (!cancelled) setError("Game not found.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const moves = useMemo(() => {
    if (!game?.moves) return [];
    return [...game.moves].sort((a, b) => a.move_number - b.move_number);
  }, [game]);

  const maxPly = moves.length;

  const fenAtPly = useMemo(() => {
    const g = new Chess();
    for (let i = 0; i < plyIndex; i++) {
      const m = moves[i];
      if (!m) break;
      const parsed = parseUci(m.uci);
      if (!parsed) break;
      const played = g.move({ from: parsed.from, to: parsed.to, promotion: parsed.promotion });
      if (!played) break;
    }
    return g.fen();
  }, [moves, plyIndex]);

  const lastMoveStyle = useMemo(() => {
    if (plyIndex <= 0) return {};
    const m = moves[plyIndex - 1];
    if (!m) return {};
    const parsed = parseUci(m.uci);
    if (!parsed) return {};
    return {
      [parsed.from]: { background: "rgba(250, 204, 21, 0.35)" },
      [parsed.to]: { background: "rgba(250, 204, 21, 0.45)" },
    };
  }, [moves, plyIndex]);

  const goStart = useCallback(() => setPlyIndex(0), []);
  const goEnd = useCallback(() => setPlyIndex(maxPly), [maxPly]);
  const stepBack = useCallback(() => setPlyIndex((p) => Math.max(0, p - 1)), []);
  const stepFwd = useCallback(() => setPlyIndex((p) => Math.min(maxPly, p + 1)), [maxPly]);

  useEffect(() => {
    if (!playing) return;
    if (maxPly === 0) {
      setPlaying(false);
      return;
    }
    if (plyIndex >= maxPly) {
      setPlaying(false);
      return;
    }
    const t = window.setTimeout(() => {
      setPlyIndex((p) => Math.min(maxPly, p + 1));
    }, delayMs);
    return () => window.clearTimeout(t);
  }, [playing, delayMs, maxPly, plyIndex]);

  const moveRows = useMemo(() => {
    const rows: { white?: Move; black?: Move; pairIndex: number }[] = [];
    let pairIndex = 0;
    for (let i = 0; i < moves.length; i++) {
      const m = moves[i]!;
      if (m.move_number % 2 === 1) {
        rows.push({ white: m, pairIndex });
        pairIndex++;
      } else {
        const row = rows[rows.length - 1];
        if (row) row.black = m;
        else rows.push({ black: m, pairIndex });
      }
    }
    return rows;
  }, [moves]);

  const selectMove = useCallback(
    (m: Move) => {
      const idx = moves.findIndex((x) => x.move_number === m.move_number);
      if (idx >= 0) setPlyIndex(idx + 1);
    },
    [moves]
  );

  const plyAfterMove = useCallback(
    (m: Move) => {
      const idx = moves.findIndex((x) => x.move_number === m.move_number);
      return idx >= 0 ? idx + 1 : 0;
    },
    [moves]
  );

  if (loading) {
    return <div className="flex justify-center py-24 text-gray-400">Loading game…</div>;
  }

  if (error || !game) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <p className="text-red-400 mb-4">{error ?? "Missing game."}</p>
        <Link href="/history" className="btn-secondary text-sm">
          Back to history
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-6">
      <div className="flex-1 flex flex-col gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/history" className="text-amber-400 hover:underline">
              History
            </Link>
            <span>/</span>
            <span className="font-mono text-xs">{game.id}</span>
          </div>
          <h1 className="text-xl font-semibold">{resultHeadline(game)}</h1>
          {game.ended_at && (
            <p className="text-xs text-gray-500 mt-1">{new Date(game.ended_at).toLocaleString()}</p>
          )}
        </div>

        <div className="relative">
          <Chessboard
            id={`replay-${game.id}`}
            position={fenAtPly}
            boardOrientation={orientation}
            arePiecesDraggable={false}
            customSquareStyles={lastMoveStyle}
            customDarkSquareStyle={{ backgroundColor: "#b58863" }}
            customLightSquareStyle={{ backgroundColor: "#f0d9b5" }}
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <button type="button" className="btn-secondary text-sm" onClick={goStart} disabled={plyIndex === 0}>
            ⏮
          </button>
          <button type="button" className="btn-secondary text-sm" onClick={stepBack} disabled={plyIndex === 0}>
            ◀
          </button>
          <button
            type="button"
            className={clsx("text-sm px-4 py-2 rounded-lg font-medium border transition-colors", playing ? "btn-danger" : "btn-primary")}
            onClick={() => setPlaying((p) => !p)}
            disabled={maxPly === 0}
          >
            {playing ? "Pause" : "Play"}
          </button>
          <button type="button" className="btn-secondary text-sm" onClick={stepFwd} disabled={plyIndex >= maxPly}>
            ▶
          </button>
          <button type="button" className="btn-secondary text-sm" onClick={goEnd} disabled={plyIndex >= maxPly}>
            ⏭
          </button>

          <label className="ml-auto flex items-center gap-2 text-xs text-gray-400">
            Speed
            <input
              type="range"
              min={250}
              max={2000}
              step={50}
              value={delayMs}
              onChange={(e) => setDelayMs(Number(e.target.value))}
            />
            <span className="font-mono w-12 text-right text-gray-300">{(delayMs / 1000).toFixed(1)}s</span>
          </label>

          <button type="button" className="btn-ghost text-xs" onClick={() => setOrientation((o) => (o === "white" ? "black" : "white"))}>
            Flip board
          </button>
        </div>

        <p className="text-xs text-gray-500">
          Position {plyIndex} / {maxPly} ply
          {game.room_id && (
            <>
              {" "}
              ·{" "}
              <Link className="text-amber-400 hover:underline" href={`/room/${game.room_id}`}>
                Open original room
              </Link>
            </>
          )}
        </p>
      </div>

      <div className="w-full lg:w-72 flex flex-col gap-3">
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-300 mb-2">Moves</h2>
          <div className="max-h-[420px] overflow-y-auto text-sm font-mono border border-white/[0.06] rounded-lg">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-[#12121a] text-gray-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-2 py-1.5 w-10">#</th>
                  <th className="px-2 py-1.5">White</th>
                  <th className="px-2 py-1.5">Black</th>
                </tr>
              </thead>
              <tbody>
                {moveRows.map((row) => (
                  <tr key={row.pairIndex} className="border-t border-white/[0.04]">
                    <td className="px-2 py-1 text-gray-500">{row.pairIndex + 1}</td>
                    <td className="px-2 py-1">
                      {row.white ? (
                        <button
                          type="button"
                          className={clsx(
                            "w-full text-left rounded px-1",
                            plyIndex === plyAfterMove(row.white) ? "bg-amber-500/20 text-amber-200" : "hover:bg-white/[0.04]"
                          )}
                          onClick={() => selectMove(row.white!)}
                        >
                          {row.white.san}
                        </button>
                      ) : (
                        <span className="text-gray-600">…</span>
                      )}
                    </td>
                    <td className="px-2 py-1">
                      {row.black ? (
                        <button
                          type="button"
                          className={clsx(
                            "w-full text-left rounded px-1",
                            plyIndex === plyAfterMove(row.black) ? "bg-amber-500/20 text-amber-200" : "hover:bg-white/[0.04]"
                          )}
                          onClick={() => selectMove(row.black!)}
                        >
                          {row.black.san}
                        </button>
                      ) : (
                        <span className="text-gray-600">…</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card text-xs text-gray-500">
          Engine analysis can plug in here later (opening book, eval bar, best lines). For now this view is PGN-accurate replay using stored UCI moves.
        </div>
      </div>
    </div>
  );
}
