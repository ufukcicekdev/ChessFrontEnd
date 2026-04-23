export interface User {
  id: number;
  username: string;
  email?: string;
  rating: number;
  title?: string;
  next_title?: string | null;
  rating_to_next_title?: number | null;
  games_played: number;
  games_won: number;
  games_drawn: number;
  games_lost?: number;
  avatar?: string;
  wallet_balance?: string;
  iban?: string;
  masked_iban?: string;
  created_at?: string;
}

export interface WithdrawalRequest {
  id: string;
  amount: string;
  iban_snapshot: string;
  status: "pending" | "paid" | "rejected";
  created_at: string;
  processed_at: string | null;
}

export interface Move {
  move_number: number;
  san: string;
  uci: string;
  fen_after: string;
  timestamp: string;
}

export type GameResult = "white" | "black" | "draw" | "ongoing" | "aborted";
export type GameColor = "white" | "black";
export type RoomStatus = "waiting" | "active" | "finished" | "abandoned";

export interface Game {
  id: string;
  room_id?: string;
  white_player: User | null;
  black_player: User | null;
  fen: string;
  pgn: string;
  result: GameResult;
  white_time_remaining: number;
  black_time_remaining: number;
  time_control?: number;
  increment?: number;
  started_at: string | null;
  ended_at: string | null;
  moves: Move[];
}

export interface Room {
  id: string;
  name: string;
  is_public: boolean;
  time_control: number;
  increment: number;
  status: RoomStatus;
  created_by: User | null;
  created_at: string;
  game: Game | null;
  spectator_count: number;
}

// WebSocket message types
export type WSMessageType =
  | "game_state"
  | "player_joined"
  | "player_left"
  | "player_reconnected"
  | "game_over"
  | "draw_offer"
  | "draw_result"
  | "error";

export interface WSMessage {
  type: WSMessageType;
  [key: string]: unknown;
}

export interface GameStateMessage extends WSMessage {
  type: "game_state";
  fen: string;
  pgn: string;
  last_move?: { uci: string; san: string };
  move_number: number;
  white_time: number;
  black_time: number;
  white_rating?: number | null;
  black_rating?: number | null;
  white_title?: string | null;
  black_title?: string | null;
  is_check?: boolean;
  is_game_over: boolean;
  game_result?: GameResult;
  white_player?: string;
  black_player?: string;
}

export interface TournamentMatch {
  match_number: number;
  player1_username: string | null;
  player2_username: string | null;
  winner_username: string | null;
  is_bye: boolean;
}

export interface TournamentRound {
  round_number: number;
  matches: TournamentMatch[];
}

export type TournamentStatus = "registration" | "active" | "finished";

export interface Tournament {
  id: string;
  name: string;
  description: string;
  max_players: number;
  time_control: number;
  increment: number;
  status: TournamentStatus;
  created_by: User | null;
  winner: User | null;
  created_at: string;
  started_at: string | null;
  participant_count: number;
  rounds: TournamentRound[];
}
