"use client";
import { useEffect, useRef, useCallback, useState } from "react";
import { WSMessage, GameStateMessage, GameResult } from "@/types";
import api from "@/lib/api";

const ABANDON_GRACE = 60;

const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

export interface ChessWSState {
  fen: string;
  pgn: string;
  lastMove: { from: string; to: string } | null;
  whiteTime: number;
  blackTime: number;
  isCheck: boolean;
  gameResult: GameResult | null;
  gameOverReason: string | null;
  whitePlayer: string | null;
  blackPlayer: string | null;
  whiteRating: number | null;
  blackRating: number | null;
  whiteTitle: string | null;
  blackTitle: string | null;
  connectionStatus: ConnectionStatus;
  drawOffer: { from: string } | null;
  opponentDisconnected: boolean;
  abandonCountdown: number | null;
}

export interface ChessWSActions {
  sendMove: (uci: string, san: string, fenAfter: string) => void;
  sendJoin: () => void;
  sendTimeLoss: (loser: "white" | "black") => void;
  sendResign: () => void;
  offerDraw: () => void;
  acceptDraw: () => void;
  declineDraw: () => void;
}

export function useChessWebSocket(
  roomId: string,
  token: string | null
): ChessWSState & ChessWSActions {
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const reconnectAttempts = useRef(0);

  const countdownTimer = useRef<ReturnType<typeof setInterval>>();

  const [state, setState] = useState<ChessWSState>({
    fen: STARTING_FEN,
    pgn: "",
    lastMove: null,
    whiteTime: 600,
    blackTime: 600,
    isCheck: false,
    gameResult: null,
    gameOverReason: null,
    whitePlayer: null,
    blackPlayer: null,
    whiteRating: null,
    blackRating: null,
    whiteTitle: null,
    blackTitle: null,
    connectionStatus: "connecting",
    drawOffer: null,
    opponentDisconnected: false,
    abandonCountdown: null,
  });

  const connect = useCallback(async () => {
    const wsBase = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    let wsUrl = `${wsBase}/ws/chess/${roomId}/`;
    if (token) {
      try {
        // Use axios so the 401 interceptor auto-refreshes the token if expired
        const { data } = await api.post("/api/chess/ws-ticket/");
        wsUrl = `${wsBase}/ws/chess/${roomId}/?ticket=${data.ticket}`;
      } catch {
        // Fallback: use token directly (middleware accepts ?token= as well)
        const freshToken = localStorage.getItem("access_token") || token;
        wsUrl = `${wsBase}/ws/chess/${roomId}/?token=${freshToken}`;
      }
    }

    const socket = new WebSocket(wsUrl);
    ws.current = socket;

    socket.onopen = () => {
      reconnectAttempts.current = 0;
      setState((s) => ({ ...s, connectionStatus: "connected" }));
      if (token) {
        socket.send(JSON.stringify({ type: "join" }));
      }
    };

    socket.onmessage = (event) => {
      const msg: WSMessage = JSON.parse(event.data);
      handleMessage(msg);
    };

    socket.onerror = () => {
      setState((s) => ({ ...s, connectionStatus: "error" }));
    };

    socket.onclose = () => {
      setState((s) => ({ ...s, connectionStatus: "disconnected" }));
      setState((prev) => {
        if (!prev.gameResult && reconnectAttempts.current < 10) {
          // Exponential backoff: 1s, 2s, 4s … max 30s, up to 10 attempts
          const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 30000);
          reconnectAttempts.current += 1;
          reconnectTimer.current = setTimeout(connect, delay);
        } else if (reconnectAttempts.current >= 10) {
          setState((s) => ({ ...s, connectionStatus: "error" }));
        }
        return prev;
      });
    };
  }, [roomId, token]);

  const handleMessage = (msg: WSMessage) => {
    switch (msg.type) {
      case "game_state": {
        const m = msg as GameStateMessage;
        const uci = m.last_move?.uci;
        const lastMove = uci ? { from: uci.slice(0, 2), to: uci.slice(2, 4) } : null;

        // Correct for time elapsed since server wrote last_move_at.
        // server_time is "now" on the server, last_move_at is when the clock last stopped.
        // The difference = how long the active side's clock has been running since that snapshot.
        let whiteTime = m.white_time;
        let blackTime = m.black_time;
        if (!m.is_game_over && m.last_move_at && m.server_time) {
          const elapsed = (new Date(m.server_time).getTime() - new Date(m.last_move_at).getTime()) / 1000;
          const activeSide = m.fen?.split(" ")[1] === "w" ? "white" : "black";
          if (activeSide === "white") whiteTime = Math.max(0, whiteTime - elapsed);
          else blackTime = Math.max(0, blackTime - elapsed);
        }

        setState((s) => ({
          ...s,
          fen: m.fen,
          pgn: m.pgn,
          lastMove,
          whiteTime,
          blackTime,
          isCheck: Boolean(m.is_check),
          gameResult: m.is_game_over ? (m.game_result ?? null) : null,
          whitePlayer: m.white_player ?? s.whitePlayer,
          blackPlayer: m.black_player ?? s.blackPlayer,
          whiteRating: m.white_rating ?? s.whiteRating,
          blackRating: m.black_rating ?? s.blackRating,
          whiteTitle: m.white_title ?? s.whiteTitle,
          blackTitle: m.black_title ?? s.blackTitle,
        }));
        break;
      }
      case "player_joined":
        setState((s) => ({
          ...s,
          whitePlayer: (msg as any).player === "white" ? (msg as any).username : s.whitePlayer,
          blackPlayer: (msg as any).player === "black" ? (msg as any).username : s.blackPlayer,
        }));
        break;
      case "player_left":
        setState((s) => ({ ...s, opponentDisconnected: true, abandonCountdown: ABANDON_GRACE }));
        clearInterval(countdownTimer.current);
        countdownTimer.current = setInterval(() => {
          setState((s) => {
            if (s.abandonCountdown === null || s.abandonCountdown <= 1) {
              clearInterval(countdownTimer.current);
              return { ...s, abandonCountdown: null };
            }
            return { ...s, abandonCountdown: s.abandonCountdown - 1 };
          });
        }, 1000);
        break;
      case "player_reconnected":
        clearInterval(countdownTimer.current);
        setState((s) => ({ ...s, opponentDisconnected: false, abandonCountdown: null }));
        break;
      case "game_over":
        clearInterval(countdownTimer.current);
        setState((s) => ({
          ...s,
          gameResult: (msg as any).result,
          gameOverReason: (msg as any).reason ?? null,
          opponentDisconnected: false,
          abandonCountdown: null,
        }));
        break;
      case "draw_offer":
        setState((s) => ({ ...s, drawOffer: { from: (msg as any).offered_by } }));
        break;
      case "draw_result":
        setState((s) => ({ ...s, drawOffer: null }));
        break;
    }
  };

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      clearInterval(countdownTimer.current);
      ws.current?.close();
    };
  }, [connect]);

  const send = (data: object) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
    }
  };

  return {
    ...state,
    sendMove: (uci, san, fen) => send({ type: "move", uci, san, fen }),
    sendJoin: () => send({ type: "join" }),
    sendTimeLoss: (loser) => send({ type: "time_loss", loser }),
    sendResign: () => send({ type: "resign" }),
    offerDraw: () => send({ type: "draw_offer" }),
    acceptDraw: () => send({ type: "draw_accept" }),
    declineDraw: () => send({ type: "draw_decline" }),
  };
}
