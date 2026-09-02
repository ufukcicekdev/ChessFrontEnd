import { Chess, Move } from "chess.js";

export type Difficulty = "easy" | "medium" | "hard";

// Centipawn material values.
const VAL: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };

// Piece-square tables (middlegame), from White's point of view.
// Index 0 = a8 … 63 = h1 (matches chess.js board(), whose row 0 is rank 8).
const PST: Record<string, number[]> = {
  p: [
    0, 0, 0, 0, 0, 0, 0, 0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
    5, 5, 10, 25, 25, 10, 5, 5,
    0, 0, 0, 20, 20, 0, 0, 0,
    5, -5, -10, 0, 0, -10, -5, 5,
    5, 10, 10, -20, -20, 10, 10, 5,
    0, 0, 0, 0, 0, 0, 0, 0,
  ],
  n: [
    -50, -40, -30, -30, -30, -30, -40, -50,
    -40, -20, 0, 0, 0, 0, -20, -40,
    -30, 0, 10, 15, 15, 10, 0, -30,
    -30, 5, 15, 20, 20, 15, 5, -30,
    -30, 0, 15, 20, 20, 15, 0, -30,
    -30, 5, 10, 15, 15, 10, 5, -30,
    -40, -20, 0, 5, 5, 0, -20, -40,
    -50, -40, -30, -30, -30, -30, -40, -50,
  ],
  b: [
    -20, -10, -10, -10, -10, -10, -10, -20,
    -10, 0, 0, 0, 0, 0, 0, -10,
    -10, 0, 5, 10, 10, 5, 0, -10,
    -10, 5, 5, 10, 10, 5, 5, -10,
    -10, 0, 10, 10, 10, 10, 0, -10,
    -10, 10, 10, 10, 10, 10, 10, -10,
    -10, 5, 0, 0, 0, 0, 5, -10,
    -20, -10, -10, -10, -10, -10, -10, -20,
  ],
  r: [
    0, 0, 0, 0, 0, 0, 0, 0,
    5, 10, 10, 10, 10, 10, 10, 5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    0, 0, 0, 5, 5, 0, 0, 0,
  ],
  q: [
    -20, -10, -10, -5, -5, -10, -10, -20,
    -10, 0, 0, 0, 0, 0, 0, -10,
    -10, 0, 5, 5, 5, 5, 0, -10,
    -5, 0, 5, 5, 5, 5, 0, -5,
    0, 0, 5, 5, 5, 5, 0, -5,
    -10, 5, 5, 5, 5, 5, 0, -10,
    -10, 0, 5, 0, 0, 0, 0, -10,
    -20, -10, -10, -5, -5, -10, -10, -20,
  ],
  k: [
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -20, -30, -30, -40, -40, -30, -30, -20,
    -10, -20, -20, -20, -20, -20, -20, -10,
    20, 20, 0, 0, 0, 0, 20, 20,
    20, 30, 10, 0, 0, 10, 30, 20,
  ],
};

const MATE = 100000;

// Thrown to unwind the search when the per-move time budget is exceeded.
const ABORT = Symbol("abort");

interface Ctx {
  deadline: number;
  nodes: number;
}

function checkTime(ctx: Ctx): void {
  // Only hit the clock occasionally — Date.now() per node would dominate cost.
  if ((ctx.nodes & 1023) === 0 && Date.now() > ctx.deadline) throw ABORT;
}

// Cap how deep the capture-only quiescence search may go, so it can't explode
// in sharp positions with long capture sequences.
const MAX_QDEPTH = 6;

// Static evaluation from the perspective of the side to move (negamax convention).
function evaluate(game: Chess): number {
  const board = game.board();
  let score = 0;
  for (let r = 0; r < 8; r++) {
    const row = board[r];
    for (let c = 0; c < 8; c++) {
      const pc = row[c];
      if (!pc) continue;
      const table = PST[pc.type];
      // White reads the table directly; Black mirrors vertically.
      const psq = pc.color === "w" ? table[r * 8 + c] : table[(7 - r) * 8 + c];
      const base = VAL[pc.type] + psq;
      score += pc.color === "w" ? base : -base;
    }
  }
  return game.turn() === "w" ? score : -score;
}

// Move ordering: winning captures first (MVV-LVA), then checks, then quiet moves.
function orderScore(m: Move): number {
  if (m.captured) return 1000 + VAL[m.captured] * 10 - VAL[m.piece];
  if (m.san.includes("+")) return 50;
  return 0;
}

// Quiescence search: only explore captures so the evaluation is not taken in the
// middle of a trade (this is what stops the bot from hanging or grabbing defended pieces).
function quiesce(game: Chess, alpha: number, beta: number, ctx: Ctx, qdepth: number): number {
  ctx.nodes++;
  checkTime(ctx);

  const standPat = evaluate(game);
  if (standPat >= beta) return beta;
  if (standPat > alpha) alpha = standPat;
  if (qdepth <= 0) return alpha;

  const caps = game
    .moves({ verbose: true })
    .filter((m) => m.captured)
    .sort((a, b) => orderScore(b) - orderScore(a));

  for (const m of caps) {
    game.move(m);
    const score = -quiesce(game, -beta, -alpha, ctx, qdepth - 1);
    game.undo();
    if (score >= beta) return beta;
    if (score > alpha) alpha = score;
  }
  return alpha;
}

function negamax(game: Chess, depth: number, alpha: number, beta: number, ply: number, ctx: Ctx): number {
  ctx.nodes++;
  checkTime(ctx);

  const moves = game.moves({ verbose: true });
  if (moves.length === 0) {
    // No legal moves: checkmate (bad for side to move) or stalemate (draw).
    return game.inCheck() ? -MATE + ply : 0;
  }
  if (depth === 0) return quiesce(game, alpha, beta, ctx, MAX_QDEPTH);

  moves.sort((a, b) => orderScore(b) - orderScore(a));

  let best = -Infinity;
  for (const m of moves) {
    game.move(m);
    const score = -negamax(game, depth - 1, -beta, -alpha, ply + 1, ctx);
    game.undo();
    if (score > best) best = score;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break; // beta cutoff
  }
  return best;
}

// Per-move time budget (ms) and search ceiling for each difficulty. Iterative
// deepening stops at whichever comes first, so latency stays bounded even in
// wild tactical positions while strong positions get searched deeper.
const TIME_BUDGET: Record<Difficulty, number> = { easy: 100, medium: 400, hard: 1000 };
const MAX_DEPTH: Record<Difficulty, number> = { easy: 1, medium: 3, hard: 4 };
// How far below the best move a candidate may be and still be played (adds variety).
const MARGIN: Record<Difficulty, number> = { easy: 120, medium: 45, hard: 12 };

/**
 * Pick the engine's move with a real alpha-beta search wrapped in iterative
 * deepening under a time budget. Difficulty controls the budget/depth and how
 * far from the best move the bot may stray. Easy also blunders on purpose so it
 * stays beatable; Hard plays the best move it finds.
 */
export function pickEngineMove(game: Chess, difficulty: Difficulty): Move {
  const root = new Chess(game.fen());
  let rootMoves = root.moves({ verbose: true });
  if (rootMoves.length === 0) throw new Error("No legal moves");

  // Easy: half the time just play a random legal move so beginners can win.
  if (difficulty === "easy" && Math.random() < 0.5) {
    return rootMoves[Math.floor(Math.random() * rootMoves.length)]!;
  }

  const ctx: Ctx = { deadline: Infinity, nodes: 0 };
  rootMoves.sort((a, b) => orderScore(b) - orderScore(a));

  // Search all root moves at one depth with a full window (exact scores).
  const searchDepth = (depth: number): { m: Move; s: number }[] => {
    const scored = rootMoves.map((m) => {
      // Don't start another expensive subtree once the budget is spent.
      if (Date.now() > ctx.deadline) throw ABORT;
      root.move(m);
      const s = -negamax(root, depth - 1, -Infinity, Infinity, 1, ctx);
      root.undo();
      return { m, s };
    });
    scored.sort((a, b) => b.s - a.s);
    // Search the current best first next iteration — big pruning win.
    rootMoves = scored.map((x) => x.m);
    return scored;
  };

  // Depth 1 always runs to completion (deadline is Infinity here) so we never
  // fall back to a raw, unevaluated move — that was letting the bot grab
  // defended pieces. Only deeper iterations are bounded by the time budget.
  let completed = searchDepth(1);
  ctx.deadline = Date.now() + TIME_BUDGET[difficulty];
  for (let depth = 2; depth <= MAX_DEPTH[difficulty]; depth++) {
    try {
      completed = searchDepth(depth);
    } catch (e) {
      if (e === ABORT) break;
      throw e;
    }
    if (Date.now() > ctx.deadline) break;
  }

  const bestScore = completed[0]!.s;
  const pool = completed.filter((x) => bestScore - x.s <= MARGIN[difficulty]);
  return pool[Math.floor(Math.random() * pool.length)]!.m;
}
