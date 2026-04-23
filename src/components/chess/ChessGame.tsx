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

interface ChessGameProps {
  roomId: string;
  gameId?: string | null;
  token: string | null;
  playerColor: GameColor | "spectator";
  currentUsername: string | null;
  timeControl?: number;
  increment?: number;
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
  // Always connect with token if available.
  // Room REST data can be stale (e.g. players not assigned yet), so we derive role from WS state.
  const ws = useChessWebSocket(roomId, token);
  const { play } = useChessSound();
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

  // Optimistic FEN: set immediately on our move, cleared when server confirms (ws.fen changes)
  const [optimisticFen, setOptimisticFen] = useState<string | null>(null);
  const displayFen = optimisticFen ?? ws.fen;

  const prevWsFenRef = useRef(ws.fen);
  if (prevWsFenRef.current !== ws.fen) {
    prevWsFenRef.current = ws.fen;
    // Server sent a new position (our move confirmed OR opponent moved) — clear everything
    if (optimisticFen !== null) setOptimisticFen(null);
    // Clear selection inline (safe during render since these are independent state)
  }

  // Determine whose turn it is from FEN
  const activeSide = useMemo<GameColor | null>(() => {
    if (ws.gameResult) return null;
    return displayFen.split(" ")[1] === "w" ? "white" : "black";
  }, [displayFen, ws.gameResult]);

  const { whiteTime, blackTime, formatTime } = useClock(
    ws.whiteTime,
    ws.blackTime,
    activeSide
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

  // Sound effects
  useEffect(() => {
    if (ws.pgn !== prevPgnRef.current && prevPgnRef.current !== "") {
      if (ws.isCheck) play("check");
      else {
        const lastToken = ws.pgn.trim().split(/\s+/).pop() ?? "";
        play(lastToken.includes("x") ? "capture" : "move");
      }
    }
    prevPgnRef.current = ws.pgn;
  }, [ws.pgn, ws.isCheck, play]);

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
  const isDragging = useRef(false);

  const isMyTurn =
    !isSpectator &&
    ((effectiveColor === "white" && activeSide === "white") ||
      (effectiveColor === "black" && activeSide === "black"));

  const onDrop = useCallback(
    (sourceSquare: Square, targetSquare: Square) => {
      if (!isMyTurn) return false;
      try {
        const game = new Chess(displayFen);
        const move = game.move({ from: sourceSquare, to: targetSquare, promotion: "q" });
        if (!move) return false;
        isDragging.current = true;
        setTimeout(() => { isDragging.current = false; }, 100);
        ws.sendMove(move.from + move.to + (move.promotion ?? ""), move.san, game.fen());
        setOptimisticFen(game.fen());
        setOptionSquares({});
        setSelectedSquare(null);
        return true;
      } catch {
        return false;
      }
    },
    [isMyTurn, displayFen, ws]
  );

  const onSquareClick = useCallback(
    (square: Square) => {
      if (!isMyTurn) return;
      if (isDragging.current) return;
      const game = new Chess(displayFen);

      if (selectedSquare) {
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
    [isMyTurn, displayFen, selectedSquare, ws]
  );

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

      return kingSquare
        ? { [kingSquare]: { background: "rgba(239,68,68,0.55)" } }
        : {};
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
            boardOrientation={boardOrientation}
            customSquareStyles={{ ...lastMoveHighlight, ...checkHighlight, ...optionSquares }}
            arePiecesDraggable={isMyTurn}
            customDarkSquareStyle={{ backgroundColor: theme.dark }}
            customLightSquareStyle={{ backgroundColor: theme.light }}
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
      </div>

      {/* Sidebar */}
      <div className="flex flex-col gap-3 w-full lg:w-64">
        {/* Connection status */}
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

        {/* Draw offer banner */}
        {ws.drawOffer && !isSpectator && ws.drawOffer.from !== effectiveColor && (
          <DrawOfferBanner
            onAccept={ws.acceptDraw}
            onDecline={ws.declineDraw}
          />
        )}

        {/* Controls */}
        {!isSpectator && !ws.gameResult && (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              {confirmResign ? (
                <>
                  <button
                    onClick={() => { ws.sendResign(); setConfirmResign(false); }}
                    className="btn-danger flex-1 text-sm"
                  >
                    Confirm
                  </button>
                  <button onClick={() => setConfirmResign(false)} className="btn-secondary flex-1 text-sm">
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setConfirmResign(true)} className="btn-danger flex-1 text-sm">
                    Resign
                  </button>
                  <button onClick={ws.offerDraw} className="btn-secondary flex-1 text-sm">
                    Draw
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        <MoveHistory pgn={ws.pgn} />

        {/* Board theme */}
        <button
          onClick={cycleTheme}
          className="btn-ghost text-xs w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] hover:border-white/[0.14] transition-colors"
        >
          <span
            className="inline-block w-3 h-3 rounded-sm border border-white/20 shrink-0"
            style={{ background: theme.dark }}
          />
          <span className="text-gray-400">Board: <span className="text-gray-300">{theme.name}</span></span>
        </button>

        {isSpectator && <DonateButton roomId={roomId} />}

        {/* Opponent disconnect banner */}
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
