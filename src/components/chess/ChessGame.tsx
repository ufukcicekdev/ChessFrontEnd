"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chessboard } from "react-chessboard";
import { Chess, Square } from "chess.js";


import { GameColor } from "@/types";
import { useChessWebSocket } from "@/hooks/useChessWebSocket";
import { useClock } from "@/hooks/useClock";
import MoveHistory from "./MoveHistory";
import PlayerCard from "./PlayerCard";
import GameOverModal from "./GameOverModal";
import DrawOfferBanner from "./DrawOfferBanner";
import DonateButton from "./DonateButton";
import { useChessSound } from "@/hooks/useChessSound";
import { useSoundSetting } from "@/hooks/useSoundSetting";
import ConfirmModal from "@/components/ui/ConfirmModal";

interface ChessGameProps {
  roomId: string;
  gameId?: string | null;
  token: string | null;
  playerColor: GameColor | "spectator";
  currentUsername: string | null;
  timeControl?: number;
  increment?: number;
}

// Returns all squares a piece can physically reach for premove highlighting
// (ignores legality — premove executes regardless of check/pin)
function getPremoveSquares(fen: string, from: Square): Square[] {
  const game = new Chess(fen);
  const piece = game.get(from);
  if (!piece) return [];

  const fileIdx = from.charCodeAt(0) - 97; // a=0 … h=7
  const rankIdx = parseInt(from[1]) - 1;   // 1=0 … 8=7

  const toSquare = (f: number, r: number): Square | null => {
    if (f < 0 || f > 7 || r < 0 || r > 7) return null;
    return (String.fromCharCode(97 + f) + (r + 1)) as Square;
  };

  const squares: Square[] = [];

  const addSliding = (dirs: [number, number][]) => {
    for (const [df, dr] of dirs) {
      let f = fileIdx + df, r = rankIdx + dr;
      while (f >= 0 && f <= 7 && r >= 0 && r <= 7) {
        squares.push((String.fromCharCode(97 + f) + (r + 1)) as Square);
        if (game.get((String.fromCharCode(97 + f) + (r + 1)) as Square)) break; // blocked
        f += df; r += dr;
      }
    }
  };

  switch (piece.type) {
    case "p": {
      const dir = piece.color === "w" ? 1 : -1;
      const startRank = piece.color === "w" ? 1 : 6;
      [[-1, dir], [1, dir]].forEach(([df, dr]) => { const s = toSquare(fileIdx + df, rankIdx + dr); if (s) squares.push(s); });
      const fwd1 = toSquare(fileIdx, rankIdx + dir);
      if (fwd1) { squares.push(fwd1); if (rankIdx === startRank) { const fwd2 = toSquare(fileIdx, rankIdx + dir * 2); if (fwd2) squares.push(fwd2); } }
      break;
    }
    case "n":
      [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([df,dr]) => { const s = toSquare(fileIdx+df, rankIdx+dr); if (s) squares.push(s); });
      break;
    case "b": addSliding([[-1,-1],[-1,1],[1,-1],[1,1]]); break;
    case "r": addSliding([[-1,0],[1,0],[0,-1],[0,1]]); break;
    case "q": addSliding([[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]); break;
    case "k":
      [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(([df,dr]) => { const s = toSquare(fileIdx+df, rankIdx+dr); if (s) squares.push(s); });
      break;
  }

  // Filter out own pieces
  return squares.filter((sq) => { const p = game.get(sq); return !p || p.color !== piece.color; });
}

const BOARD_THEMES = [
  { name: "Classic",  dark: "#b58863", light: "#f0d9b5" },
  { name: "Ocean",    dark: "#4a7fa5", light: "#d6e8f5" },
  { name: "Forest",   dark: "#5a7a4a", light: "#d4e8c2" },
  { name: "Slate",    dark: "#6b7280", light: "#e5e7eb" },
  { name: "Purple",   dark: "#7c3aed", light: "#ede9fe" },
] as const;

const THEME_KEY = "chess_board_theme";

export default function ChessGame({
  roomId,
  gameId,
  token,
  playerColor,
  currentUsername,
  timeControl,
  increment,
}: ChessGameProps) {
  const ws = useChessWebSocket(roomId, token);
  const { enabled: soundEnabled, toggle: toggleSound } = useSoundSetting();
  const { play } = useChessSound(soundEnabled);
  const [confirmResign, setConfirmResign] = useState(false);
  const [themeIdx, setThemeIdx] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    const saved = localStorage.getItem(THEME_KEY);
    const idx = saved ? parseInt(saved, 10) : 0;
    return isNaN(idx) ? 0 : Math.min(idx, BOARD_THEMES.length - 1);
  });
  const theme = BOARD_THEMES[themeIdx];

  const prevPgnRef = useRef<string>("");
  const prevResultRef = useRef<string | null>(null);

  const cycleTheme = () => {
    const next = (themeIdx + 1) % BOARD_THEMES.length;
    setThemeIdx(next);
    localStorage.setItem(THEME_KEY, String(next));
  };

  const effectiveColor = useMemo<GameColor | "spectator">(() => {
    if (!currentUsername) return playerColor;
    if (ws.whitePlayer === currentUsername) return "white";
    if (ws.blackPlayer === currentUsername) return "black";
    return playerColor;
  }, [currentUsername, playerColor, ws.whitePlayer, ws.blackPlayer]);

  const isSpectator = effectiveColor === "spectator";

  // Optimistic FEN: set immediately on our move, cleared when server confirms
  const [optimisticFen, setOptimisticFen] = useState<string | null>(null);

  // ── Pre-move state (declared here so premoveFen can reference it) ───────────
  const [premove, setPremove] = useState<{ from: Square; to: Square } | null>(null);
  const [premoveFrom, setPremoveFrom] = useState<Square | null>(null);
  // Ref tracks the premove to execute — separate from visual state to avoid stale render
  const pendingPremoveRef = useRef<{ from: Square; to: Square } | null>(null);

  const clearPremove = useCallback(() => {
    setPremove(null);
    setPremoveFrom(null);
    pendingPremoveRef.current = null;
  }, []);

  // Keep ref in sync with state
  useEffect(() => {
    pendingPremoveRef.current = premove;
  }, [premove]);

  // Premove visual FEN: piece moved to destination, only shown during opponent's turn
  // wsFenRef tracks last confirmed server FEN so we don't show stale premove on new position
  const prevWsFenRef = useRef(ws.fen);
  const wsFenChanged = prevWsFenRef.current !== ws.fen;
  if (wsFenChanged) prevWsFenRef.current = ws.fen;

  const premoveFen = useMemo(() => {
    if (!premove || wsFenChanged) return null; // hide during the frame ws.fen just updated
    try {
      const g = new Chess(ws.fen);
      const piece = g.get(premove.from);
      if (!piece) return null;
      g.remove(premove.from);
      g.remove(premove.to);
      g.put(piece, premove.to);
      return g.fen();
    } catch { return null; }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [premove, ws.fen]);

  const displayFen = optimisticFen ?? premoveFen ?? ws.fen;

  if (wsFenChanged && optimisticFen !== null) setOptimisticFen(null);

  const activeSide = useMemo<GameColor | null>(() => {
    if (ws.gameResult) return null;
    return displayFen.split(" ")[1] === "w" ? "white" : "black";
  }, [displayFen, ws.gameResult]);

  const { whiteTime, blackTime, formatTime } = useClock(
    ws.whiteTime,
    ws.blackTime,
    activeSide,
  );

  const timeLossSentRef = useRef(false);
  useEffect(() => {
    timeLossSentRef.current = false;
  }, [roomId, ws.gameResult]);

  useEffect(() => {
    if (isSpectator) return;
    if (ws.gameResult) return;
    if (!activeSide) return;
    if (timeLossSentRef.current) return;

    if (activeSide === "white" && whiteTime <= 0) {
      timeLossSentRef.current = true;
      ws.sendTimeLoss("white");
    } else if (activeSide === "black" && blackTime <= 0) {
      timeLossSentRef.current = true;
      ws.sendTimeLoss("black");
    }
  }, [activeSide, blackTime, isSpectator, whiteTime, ws]);

  // Sound effects — only for opponent's moves (our moves play sound in commitMove immediately)
  useEffect(() => {
    if (ws.pgn === prevPgnRef.current) return;
    const isFirst = prevPgnRef.current === "";
    prevPgnRef.current = ws.pgn;
    if (isFirst) return;
    if (!isMyTurn) return; // isMyTurn is NOW true → means opponent just moved
    const lastToken = ws.pgn.trim().split(/\s+/).pop() ?? "";
    if (lastToken.includes("+") || lastToken.includes("#")) play("check");
    else if (lastToken.includes("x")) play("capture");
    else play("move");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ws.pgn]);

  useEffect(() => {
    if (ws.gameResult && ws.gameResult !== "ongoing" && ws.gameResult !== prevResultRef.current) {
      prevResultRef.current = ws.gameResult;
      if (isSpectator) return;
      if (ws.gameResult === "draw") { play("draw"); return; }
      const iWin =
        (ws.gameResult === "white" && ws.whitePlayer === currentUsername) ||
        (ws.gameResult === "black" && ws.blackPlayer === currentUsername);
      play(iWin ? "win" : "loss");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ws.gameResult]);

  const [optionSquares, setOptionSquares] = useState<Record<string, object>>({});
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [promotionTo, setPromotionTo] = useState<Square | null>(null);
  const pendingPromoRef = useRef<{ from: Square; to: Square } | null>(null);
  const isDragging = useRef(false);

  const isMyTurn =
    !isSpectator &&
    ((effectiveColor === "white" && activeSide === "white") ||
      (effectiveColor === "black" && activeSide === "black"));

  const isPromotionMove = useCallback(
    (from: Square, to: Square, fen = displayFen): boolean => {
      try {
        const game = new Chess(fen);
        const piece = game.get(from);
        if (!piece || piece.type !== "p") return false;
        return (piece.color === "w" && to[1] === "8") || (piece.color === "b" && to[1] === "1");
      } catch {
        return false;
      }
    },
    [displayFen],
  );

  const commitMove = useCallback(
    (from: Square, to: Square, promotion: "q" | "r" | "b" | "n", fen = displayFen) => {
      try {
        const game = new Chess(fen);
        const move = game.move({ from, to, promotion });
        if (!move) return false;
        ws.sendMove(move.from + move.to + (move.promotion ?? ""), move.san, game.fen());
        setOptimisticFen(game.fen());
        setOptionSquares({});
        setSelectedSquare(null);
        // Play sound immediately — don't wait for server confirmation
        const san = move.san;
        if (san.includes("+") || san.includes("#")) play("check");
        else if (san.includes("x")) play("capture");
        else play("move");
        return true;
      } catch {
        return false;
      }
    },
    [displayFen, ws],
  );

  // Execute pre-move when it becomes our turn (read from ref to avoid stale closure)
  const prevIsMyTurnRef = useRef(isMyTurn);
  useEffect(() => {
    const wasMyTurn = prevIsMyTurnRef.current;
    prevIsMyTurnRef.current = isMyTurn;

    if (isMyTurn && !wasMyTurn) {
      const pending = pendingPremoveRef.current;
      setPremove(null);
      setPremoveFrom(null);
      pendingPremoveRef.current = null;
      if (pending) {
        const ok = commitMove(pending.from, pending.to, "q", ws.fen);
        if (!ok) play("move");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMyTurn]);

  const onDrop = useCallback(
    (sourceSquare: Square, targetSquare: Square) => {
      isDragging.current = true;
      setTimeout(() => { isDragging.current = false; }, 100);

      if (!isMyTurn) {
        // Queue as pre-move (validate piece belongs to us)
        if (isSpectator) return false;
        const game = new Chess(ws.fen);
        const piece = game.get(sourceSquare);
        const myColor = effectiveColor === "white" ? "w" : "b";
        if (!piece || piece.color !== myColor) return false;
        setPremove({ from: sourceSquare, to: targetSquare });
        setPremoveFrom(null);
        setOptionSquares({});
        return true;
      }

      if (isPromotionMove(sourceSquare, targetSquare)) {
        pendingPromoRef.current = { from: sourceSquare, to: targetSquare };
        setPromotionTo(targetSquare);
        return true;
      }
      return commitMove(sourceSquare, targetSquare, "q");
    },
    [isMyTurn, isSpectator, isPromotionMove, commitMove, effectiveColor, ws.fen],
  );

  const onPromotionPieceSelect = useCallback(
    (piece?: string) => {
      const pending = pendingPromoRef.current;
      setPromotionTo(null);
      pendingPromoRef.current = null;
      if (!pending || !piece) return false;
      const promo = piece.slice(1).toLowerCase() as "q" | "r" | "b" | "n";
      return commitMove(pending.from, pending.to, promo);
    },
    [commitMove],
  );

  const onSquareClick = useCallback(
    (square: Square) => {
      if (isDragging.current) return;

      if (!isMyTurn) {
        if (isSpectator) return;
        // Premove click — always use ws.fen (real board)
        const game = new Chess(ws.fen);
        const myColor = effectiveColor === "white" ? "w" : "b";
        const piece = game.get(square);

        // Build premove highlights: same style as normal move hints
        const buildPremoveHighlights = (from: Square) => {
          const dests = getPremoveSquares(ws.fen, from);
          const hl: Record<string, object> = {
            [from]: { background: "rgba(255,255,0,0.4)" },
          };
          dests.forEach((sq) => {
            hl[sq] = {
              background: game.get(sq as Square)
                ? "radial-gradient(circle, rgba(255,0,0,0.4) 85%, transparent 85%)"
                : "radial-gradient(circle, rgba(0,0,0,0.15) 25%, transparent 25%)",
            };
          });
          return hl;
        };

        if (premoveFrom) {
          if (piece && piece.color === myColor) {
            // Re-select origin
            setPremoveFrom(square);
            setPremove(null);
            pendingPremoveRef.current = null;
            setOptionSquares(buildPremoveHighlights(square));
          } else {
            // Confirm destination
            setPremove({ from: premoveFrom, to: square });
            setPremoveFrom(null);
            setOptionSquares({});
          }
        } else {
          if (piece && piece.color === myColor) {
            setPremoveFrom(square);
            setPremove(null);
            pendingPremoveRef.current = null;
            setOptionSquares(buildPremoveHighlights(square));
          } else {
            clearPremove();
            setOptionSquares({});
          }
        }
        return;
      }

      // Normal turn logic
      const game = new Chess(displayFen);

      if (selectedSquare) {
        if (isPromotionMove(selectedSquare, square)) {
          pendingPromoRef.current = { from: selectedSquare, to: square };
          setPromotionTo(square);
          setOptionSquares({});
          setSelectedSquare(null);
          return;
        }
        const move = game.move({ from: selectedSquare, to: square, promotion: "q" });
        if (move) {
          ws.sendMove(move.from + move.to + (move.promotion ?? ""), move.san, game.fen());
          setOptimisticFen(game.fen());
          setOptionSquares({});
          setSelectedSquare(null);
          return;
        }
      }

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
    [isMyTurn, isSpectator, displayFen, selectedSquare, ws, isPromotionMove, premoveFrom, effectiveColor],
  );

  // Right-click = cancel everything
  const onSquareRightClick = useCallback(() => {
    clearPremove();
    setOptionSquares({});
    setSelectedSquare(null);
  }, [clearPremove]);


  const lastMoveHighlight = useMemo(() => {
    if (!ws.lastMove) return {};
    return {
      [ws.lastMove.from]: { background: "rgba(205,210,106,0.5)" },
      [ws.lastMove.to]: { background: "rgba(205,210,106,0.5)" },
    };
  }, [ws.lastMove]);

  const checkHighlight = useMemo(() => {
    if (!ws.isCheck) return {};
    if (!activeSide) return {};
    try {
      const game = new Chess(displayFen);
      const kingSquare = game
        .board()
        .flatMap((row, r) =>
          row.map((piece, f) => ({ piece, square: `${"abcdefgh"[f]}${8 - r}` }))
        )
        .find(
          ({ piece }) =>
            piece?.type === "k" &&
            piece?.color === (activeSide === "white" ? "w" : "b")
        )?.square;
      return kingSquare ? { [kingSquare]: { background: "rgba(239,68,68,0.55)" } } : {};
    } catch {
      return {};
    }
  }, [activeSide, displayFen, ws.isCheck]);


  const boardOrientation = effectiveColor === "black" ? "black" : "white";

  return (
    <div className="flex flex-col lg:flex-row gap-4 w-full max-w-5xl mx-auto p-4">
      {/* Board column */}
      <div className="flex flex-col gap-2 flex-1">
        <PlayerCard
          username={ws.blackPlayer ?? "Waiting…"}
          title={ws.blackTitle}
          rating={ws.blackRating}
          time={formatTime(blackTime)}
          isActive={activeSide === "black"}
          isTop
        />

        <div className="relative">
          <Chessboard
            id={`board-${roomId}`}
            position={displayFen}
            onPieceDrop={onDrop}
            onSquareClick={onSquareClick}
            onSquareRightClick={onSquareRightClick}
            boardOrientation={boardOrientation}
            customSquareStyles={{ ...lastMoveHighlight, ...checkHighlight, ...optionSquares }}
            arePiecesDraggable={!isSpectator}
            customDarkSquareStyle={{ backgroundColor: theme.dark }}
            customLightSquareStyle={{ backgroundColor: theme.light }}
            showPromotionDialog={!!promotionTo}
            promotionToSquare={promotionTo}
            onPromotionPieceSelect={onPromotionPieceSelect}
            promotionDialogVariant="default"
          />

          {isSpectator && (
            <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
              👁 Spectating
            </div>
          )}

        </div>

        <PlayerCard
          username={ws.whitePlayer ?? "Waiting…"}
          title={ws.whiteTitle}
          rating={ws.whiteRating}
          time={formatTime(whiteTime)}
          isActive={activeSide === "white"}
        />

        {/* Resign / Draw — mobile only (below board) */}
        {!isSpectator && !ws.gameResult && (
          <div className="flex gap-2 lg:hidden">
            <button onClick={() => setConfirmResign(true)} className="btn-danger flex-1 text-sm">
              Resign
            </button>
            <button onClick={ws.offerDraw} className="btn-secondary flex-1 text-sm">
              Draw
            </button>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="flex flex-col gap-3 w-full lg:w-64">
        <div className="card text-xs text-center">
          <span
            className={
              ws.connectionStatus === "connected"
                ? "text-green-400"
                : ws.connectionStatus === "connecting"
                ? "text-yellow-400"
                : "text-red-400"
            }
          >
            ● {ws.connectionStatus}
          </span>
        </div>

        {ws.drawOffer && !isSpectator && ws.drawOffer.from !== effectiveColor && (
          <DrawOfferBanner
            onAccept={ws.acceptDraw}
            onDecline={ws.declineDraw}
          />
        )}

        {confirmResign && (
          <ConfirmModal
            title="Resign"
            message="Are you sure you want to resign?"
            confirmLabel="Resign"
            cancelLabel="Cancel"
            danger
            onConfirm={() => { ws.sendResign(); setConfirmResign(false); }}
            onCancel={() => setConfirmResign(false)}
          />
        )}

        {/* Resign / Draw — desktop only (sidebar) */}
        {!isSpectator && !ws.gameResult && (
          <div className="hidden lg:flex gap-2">
            <button onClick={() => setConfirmResign(true)} className="btn-danger flex-1 text-sm">
              Resign
            </button>
            <button onClick={ws.offerDraw} className="btn-secondary flex-1 text-sm">
              Draw
            </button>
          </div>
        )}

        <MoveHistory pgn={ws.pgn} />

        <div className="flex gap-2">
          <button
            onClick={cycleTheme}
            className="btn-ghost text-xs flex-1 text-left flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] hover:border-white/[0.14] transition-colors"
          >
            <span className="inline-block w-3 h-3 rounded-sm border border-white/20 shrink-0" style={{ background: theme.dark }} />
            <span className="text-gray-400 truncate">Board: <span className="text-gray-300">{theme.name}</span></span>
          </button>
          <button
            onClick={toggleSound}
            title={soundEnabled ? "Mute sounds" : "Unmute sounds"}
            className="btn-ghost text-sm px-3 py-2 rounded-lg border border-white/[0.06] hover:border-white/[0.14] transition-colors shrink-0"
          >
            {soundEnabled ? "🔊" : "🔇"}
          </button>
        </div>

        {isSpectator && <DonateButton roomId={roomId} />}

        {ws.opponentDisconnected && !ws.gameResult && (
          <div className="card border-amber-500/40 bg-amber-500/10 text-center flex flex-col gap-1">
            <p className="text-amber-400 text-xs font-semibold">Opponent disconnected</p>
            {ws.abandonCountdown !== null && (
              <p className="text-amber-300 text-lg font-black font-mono">{ws.abandonCountdown}s</p>
            )}
            <p className="text-gray-400 text-[10px]">You win if they don't return</p>
          </div>
        )}
      </div>

      {ws.gameResult && ws.gameResult !== "ongoing" && (
        <GameOverModal
          result={ws.gameResult}
          reason={ws.gameOverReason}
          currentUsername={currentUsername}
          whitePlayer={ws.whitePlayer}
          blackPlayer={ws.blackPlayer}
          whiteRatingBefore={ws.whiteRating}
          blackRatingBefore={ws.blackRating}
          roomId={roomId}
          gameId={gameId}
          isSpectator={isSpectator}
          timeControl={timeControl}
          increment={increment}
        />
      )}
    </div>
  );
}
