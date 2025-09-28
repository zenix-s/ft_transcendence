import { MatchStatus } from '@shared/domain/types/game.types';

export type DBParam = string | number | boolean | null | undefined;

export type DBRecord = Record<string, DBParam>;

export interface MatchPlayerRow {
    user_id: number;
    score: number;
    is_winner: boolean;
}

export interface MatchRow {
    id: number;
    game_type_id: number;
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
    created_at: string;
}

export interface GameTypeRow {
    id: number;
    name: string;
    min_players: number;
    max_players: number;
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
}

export interface QueryResult<T = DBRecord> {
    rows: T[];
    rowCount: number;
}

export interface ExecuteResult {
    affectedRows: number | bigint;
    insertId?: number;
}
