import { MatchStatus } from '@shared/domain/Entities/Match.entity';

export interface MatchPlayerRow {
    user_id: number;
    score: number;
    is_winner: boolean;
    username: string | null;
}

export interface MatchRow {
    id: number;
    match_type_id: number;
    status: MatchStatus;
    started_at?: string | null;
    ended_at?: string | null;
    created_at: string;
}

export interface UserRow {
    id: number;
    username: string;
    email: string;
    password: string;
    avatar?: string;
    created_at: string;
    is_connected?: boolean;
}

export interface GameTypeRow {
    id: number;
    name: string;
    min_players: number;
    max_players: number;
    supports_invitations: number;
}

export interface UserStatsRow {
    totalMatches: number;
    wins: number;
    totalScore: number;
}

export interface AuthenticationUserRow {
    id: number;
    username: string;
    email: string;
    password: string;
    avatar?: string;
    is_connected?: boolean;
}
