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

interface ChessGameProps {
  roomId: string;
  gameId?: string | null;
  token: string | null;
  playerColor: GameColor | "spectator";
  currentUsername: string | null;
}

export default function ChessGame({
  roomId,
  gameId,
  token,
  playerColor,
  currentUsername,
}: ChessGameProps) {
  // Always connect with token if available.
  // Room REST data can be stale (e.g. players not assigned yet), so we derive role from WS state.
  const ws = useChessWebSocket(roomId, token);

  const effectiveColor = useMemo<GameColor | "spectator">(() => {
    if (!currentUsername) return playerColor;
    if (ws.whitePlayer === currentUsername) return "white";
    if (ws.blackPlayer === currentUsername) return "black";
    return playerColor;
  }, [currentUsername, playerColor, ws.whitePlayer, ws.blackPlayer]);

  const isSpectator = effectiveColor === "spectator";

  const [localFen, setLocalFen] = useState(ws.fen);
  useEffect(() => {
    setLocalFen(ws.fen);
  }, [ws.fen]);

  // Determine whose turn it is from FEN
  const activeSide = useMemo<GameColor | null>(() => {
    if (ws.gameResult) return null;
    return localFen.split(" ")[1] === "w" ? "white" : "black";
  }, [localFen, ws.gameResult]);

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

  const [optionSquares, setOptionSquares] = useState<Record<string, object>>({});

  const isMyTurn =
    !isSpectator &&
    ((effectiveColor === "white" && activeSide === "white") ||
      (effectiveColor === "black" && activeSide === "black"));

  const onDrop = useCallback(
    (sourceSquare: Square, targetSquare: Square) => {
      if (!isMyTurn) return false;
      try {
        const game = new Chess(localFen);
        const move = game.move({ from: sourceSquare, to: targetSquare, promotion: "q" });
        if (!move) return false;
        ws.sendMove(move.from + move.to + (move.promotion ?? ""), move.san, game.fen());
        setLocalFen(game.fen()); // optimistic update; server will reconcile via ws.fen
        setOptionSquares({});
        return true;
      } catch {
        return false;
      }
    },
    [isMyTurn, localFen, ws]
  );

  const onSquareClick = useCallback(
    (square: Square) => {
      if (!isMyTurn) return;
      const game = new Chess(localFen);
      const moves = game.moves({ square, verbose: true });
      const highlights: Record<string, object> = {};
      moves.forEach((m) => {
        highlights[m.to] = {
          background:
            game.get(m.to)
              ? "radial-gradient(circle, rgba(255,0,0,0.4) 85%, transparent 85%)"
              : "radial-gradient(circle, rgba(0,0,0,0.15) 25%, transparent 25%)",
        };
      });
      setOptionSquares(highlights);
    },
    [isMyTurn, localFen]
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
      const game = new Chess(localFen);
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
  }, [activeSide, localFen, ws.isCheck]);

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
            position={localFen}
            onPieceDrop={onDrop}
            onSquareClick={onSquareClick}
            boardOrientation={boardOrientation}
            customSquareStyles={{ ...lastMoveHighlight, ...checkHighlight, ...optionSquares }}
            arePiecesDraggable={isMyTurn}
            customDarkSquareStyle={{ backgroundColor: "#b58863" }}
            customLightSquareStyle={{ backgroundColor: "#f0d9b5" }}
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
          <div className="flex gap-2">
            <button onClick={ws.sendResign} className="btn-danger flex-1 text-sm">
              Resign
            </button>
            <button onClick={ws.offerDraw} className="btn-secondary flex-1 text-sm">
              Draw
            </button>
          </div>
        )}

        <MoveHistory pgn={ws.pgn} />

        {isSpectator && <DonateButton roomId={roomId} />}
      </div>

      {ws.gameResult && ws.gameResult !== "ongoing" && (
        <GameOverModal
          result={ws.gameResult}
          currentUsername={currentUsername}
          whitePlayer={ws.whitePlayer}
          blackPlayer={ws.blackPlayer}
          roomId={roomId}
          gameId={gameId}
          isSpectator={isSpectator}
        />
      )}
    </div>
  );
}
