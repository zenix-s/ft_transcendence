export interface GameType {
    id: number;
    name: string;
    min_players: number;
    max_players: number;
    created_at: Date;
}

export enum MatchStatus {
    PENDING = 'pending',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
}

export interface Match {
    id: number;
    game_type_id: number;
    status: MatchStatus;
    started_at?: Date;
    ended_at?: Date;
    created_at: Date;
}

export interface MatchPlayer {
    id: number;
    match_id: number;
    user_id: number;
    score: number;
    is_winner: boolean;
    joined_at: Date;
}

export interface CreateMatchDto {
    game_type_id: number;
    player_ids: number[];
}

export interface EndMatchDto {
    match_id: number;
    winner_ids: number[];
    final_scores: Record<number, number>; // user_id -> score
}

export interface MatchPlayerWithUser extends MatchPlayer {
    username: string;
}

export interface MatchWithDetails extends Match {
    game_type: GameType;
    players: MatchPlayerWithUser[];
}
