"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chessboard } from "react-chessboard";
import { Chess, Square } from "chess.js";
import { clsx } from "clsx";
import { useChessSound } from "@/hooks/useChessSound";
import { useSoundSetting } from "@/hooks/useSoundSetting";
import { pickEngineMove, type Difficulty } from "@/lib/trainingEngine";

export default function TrainPage() {
  const { enabled: soundEnabled, toggle: toggleSound } = useSoundSetting();
  const { play } = useChessSound(soundEnabled);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [playerColor, setPlayerColor] = useState<"white" | "black">("white");
  const [game, setGame] = useState(() => new Chess());
  const [orientation, setOrientation] = useState<"white" | "black">("white");
  const [status, setStatus] = useState<string>("You are White. Make a move.");
  const [busy, setBusy] = useState(false);
  const [promotionTo, setPromotionTo] = useState<Square | null>(null);
  const pendingPromoRef = useRef<{ from: Square; to: Square } | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [optionSquares, setOptionSquares] = useState<Record<string, object>>({});
  const prevPgnRef = useRef("");

  const fen = game.fen();

  const engineColor = playerColor === "white" ? "b" : "w";

  const runEngine = useCallback(
    (g: Chess, diff: Difficulty) => {
      setBusy(true);
      setStatus("Engine is thinking…");
      window.setTimeout(() => {
        try {
          const eg = new Chess(g.fen());
          const move = pickEngineMove(eg, diff);
          eg.move(move);
          const pgn = eg.pgn();
          const last = pgn.trim().split(/\s+/).pop() ?? "";
          if (last.includes("+") || last.includes("#")) play("check");
          else if (last.includes("x")) play("capture");
          else play("move");
          setGame(eg);
          setStatus(eg.isGameOver() ? "Game over" : "Your move");
        } catch { setStatus("Engine failed to move"); }
        finally { setBusy(false); }
        // Delay kept longer than the 200ms board animation so the player's
        // capture finishes rendering before the engine's reply updates the board.
      }, 300);
    },
    [play],
  );

  const reset = useCallback((color: "white" | "black" = playerColor) => {
    const g = new Chess();
    setGame(g);
    setBusy(false);
    prevPgnRef.current = "";
    setSelectedSquare(null);
    setOptionSquares({});
    setStatus(`You are ${color === "white" ? "White" : "Black"}. Make a move.`);
    if (color === "black") {
      // engine plays first as white
      window.setTimeout(() => runEngine(g, difficulty), 300);
    }
  }, [difficulty, playerColor, runEngine]);

  const headline = useMemo(() => {
    if (game.isCheckmate()) {
      return game.turn() === "w" ? "You lost (checkmate)" : "You won (checkmate)";
    }
    if (game.isDraw()) return "Draw";
    if (game.isStalemate()) return "Stalemate";
    if (game.isThreefoldRepetition()) return "Draw (threefold repetition)";
    if (game.isInsufficientMaterial()) return "Draw (insufficient material)";
    return null;
  }, [game]);

  const isPromo = useCallback(
    (from: Square, to: Square) => {
      const piece = game.get(from);
      if (!piece || piece.type !== "p") return false;
      return (piece.color === "w" && to[1] === "8") || (piece.color === "b" && to[1] === "1");
    },
    [game],
  );

  // Highlight the last move's from/to squares so it's clear what just happened
  // (especially the engine's reply).
  const lastMoveHighlight = useMemo(() => {
    const history = game.history({ verbose: true });
    const last = history[history.length - 1];
    if (!last) return {} as Record<string, object>;
    return {
      [last.from]: { background: "rgba(205,210,106,0.5)" },
      [last.to]: { background: "rgba(205,210,106,0.5)" },
    };
  }, [game]);

  // Highlight the king in red whenever the side to move is in check.
  const checkHighlight = useMemo(() => {
    if (!game.inCheck()) return {} as Record<string, object>;
    const turn = game.turn();
    const kingSquare = game
      .board()
      .flatMap((row, r) => row.map((piece, f) => ({ piece, square: `${"abcdefgh"[f]}${8 - r}` })))
      .find(({ piece }) => piece?.type === "k" && piece?.color === turn)?.square;
    return kingSquare ? { [kingSquare]: { background: "rgba(239,68,68,0.55)" } } : {};
  }, [game]);

  const commitTrainMove = useCallback(
    (from: Square, to: Square, promo: "q" | "r" | "b" | "n" = "q") => {
      if (headline || busy || game.turn() !== playerColor[0]) return false;
      try {
        const next = new Chess(game.fen());
        const move = next.move({ from, to, promotion: promo });
        if (!move) return false;
        // play sound for player move
        const san = move.san;
        if (san.includes("+") || san.includes("#")) play("check");
        else if (san.includes("x")) play("capture");
        else play("move");
        setGame(next);
        setSelectedSquare(null);
        setOptionSquares({});
        if (next.isGameOver()) { setStatus("Game over"); return true; }
        runEngine(next, difficulty);
        return true;
      } catch { return false; }
    },
    [busy, difficulty, game, headline, play, playerColor, runEngine],
  );

  const onDrop = useCallback(
    (sourceSquare: Square, targetSquare: Square) => {
      if (headline) return false;
      if (busy) return false;
      if (game.turn() !== playerColor[0]) return false;

      if (isPromo(sourceSquare, targetSquare)) {
        pendingPromoRef.current = { from: sourceSquare, to: targetSquare };
        setPromotionTo(targetSquare);
        return true;
      }
      return commitTrainMove(sourceSquare, targetSquare);
    },
    [busy, commitTrainMove, game, headline, isPromo, playerColor],
  );

  const canMove = !headline && !busy && game.turn() === playerColor[0];

  const onSquareClick = useCallback(
    (square: Square) => {
      if (!canMove) return;

      if (selectedSquare) {
        // Try to move to clicked square
        if (isPromo(selectedSquare, square)) {
          pendingPromoRef.current = { from: selectedSquare, to: square };
          setPromotionTo(square);
          setOptionSquares({});
          setSelectedSquare(null);
          return;
        }
        const moved = commitTrainMove(selectedSquare, square);
        if (moved) {
          setOptionSquares({});
          setSelectedSquare(null);
          return;
        }
      }

      // Select piece and show move hints
      const moves = game.moves({ square, verbose: true });
      if (moves.length === 0) {
        setOptionSquares({});
        setSelectedSquare(null);
        return;
      }
      const highlights: Record<string, object> = {
        [square]: { background: "rgba(255,255,0,0.4)" },
      };
      moves.forEach((m) => {
        highlights[m.to] = {
          background: game.get(m.to)
            ? "radial-gradient(circle, rgba(255,0,0,0.4) 85%, transparent 85%)"
            : "radial-gradient(circle, rgba(0,0,0,0.15) 25%, transparent 25%)",
        };
      });
      setOptionSquares(highlights);
      setSelectedSquare(square);
    },
    [canMove, commitTrainMove, game, isPromo, selectedSquare],
  );

  return (
    <div className="min-h-screen bg-hero pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-4xl font-black mb-2">
            Train vs <span className="gradient-text">Computer</span>
          </h1>
          <p className="text-gray-500 text-sm">Offline practice (no account required)</p>
        </div>

        <div className="card flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Difficulty</p>
              <div className="flex flex-wrap gap-2">
                {([{ id: "easy" as const, label: "Easy" }, { id: "medium" as const, label: "Medium" }, { id: "hard" as const, label: "Hard" }]).map((d) => (
                  <button key={d.id}
                    onClick={() => { setDifficulty(d.id); reset(playerColor); }}
                    className={clsx("px-4 py-2 rounded-xl text-sm font-semibold border transition-colors",
                      difficulty === d.id ? "bg-amber-500/15 border-amber-500/40 text-amber-400" : "border-white/[0.08] text-gray-300 hover:bg-white/[0.04]"
                    )}>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Play as</p>
              <div className="flex gap-2">
                {([{ color: "white" as const, label: "♔ White" }, { color: "black" as const, label: "♚ Black" }]).map((opt) => (
                  <button key={opt.color}
                    onClick={() => {
                      setPlayerColor(opt.color);
                      setOrientation(opt.color);
                      reset(opt.color);
                    }}
                    className={clsx("px-4 py-2 rounded-xl text-sm font-semibold border transition-colors",
                      playerColor === opt.color ? "bg-amber-500/15 border-amber-500/40 text-amber-400" : "border-white/[0.08] text-gray-300 hover:bg-white/[0.04]"
                    )}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end items-center">
            <button
              onClick={toggleSound}
              title={soundEnabled ? "Mute" : "Unmute"}
              className="btn-secondary text-sm px-3"
            >
              {soundEnabled ? "🔊" : "🔇"}
            </button>
            <button onClick={() => setOrientation((o) => (o === "white" ? "black" : "white"))} className="btn-secondary text-sm">
              Flip board
            </button>
            <button onClick={() => reset(playerColor)} className="btn-primary text-sm" type="button">
              New Game
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          <div className="lg:col-span-2">
            {/* backdrop-blur olmayan wrapper — blur CSS filter drag koordinatlarını bozuyor */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-3">
              <Chessboard
                id="train-board"
                position={fen}
                onPieceDrop={onDrop}
                onSquareClick={onSquareClick}
                boardOrientation={orientation}
                arePiecesDraggable={canMove}
                animationDuration={200}
                customSquareStyles={{ ...lastMoveHighlight, ...checkHighlight, ...optionSquares }}
                customDarkSquareStyle={{ backgroundColor: "#b58863" }}
                customLightSquareStyle={{ backgroundColor: "#f0d9b5" }}
                showPromotionDialog={!!promotionTo}
                promotionToSquare={promotionTo}
                onPromotionPieceSelect={(piece) => {
                  const pending = pendingPromoRef.current;
                  setPromotionTo(null);
                  pendingPromoRef.current = null;
                  if (!pending || !piece) return false;
                  const promo = piece.slice(1).toLowerCase() as "q" | "r" | "b" | "n";
                  return commitTrainMove(pending.from, pending.to, promo);
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">{status}</p>
          </div>

          <div className="card flex flex-col gap-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Notes</p>
            <ul className="text-sm text-gray-400 leading-relaxed list-disc pl-5 space-y-2">
              <li>Built-in engine with alpha-beta search (no external servers).</li>
              <li>Choose White or Black; engine plays the other side.</li>
              <li>Easy blunders often; Medium plays soundly; Hard searches deeper.</li>
            </ul>
          </div>
        </div>

        {headline && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="card max-w-sm w-full text-center flex flex-col gap-4 p-8 border-white/10">
              <div className="text-5xl">♟</div>
              <h2 className="text-2xl font-bold">{headline}</h2>
              <p className="text-gray-400 text-sm">{status}</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => reset(playerColor)} className="btn-primary w-full">
                  Play again
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
