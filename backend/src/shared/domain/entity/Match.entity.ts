import { MatchStatus } from '../types/game.types';

export interface MatchPlayer {
    userId: number;
    username: string | null;
    score: number;
    isWinner: boolean;
}

export class Match {
    private _id?: number;
    private _gameTypeId: number;
    private _status: MatchStatus;
    private _startedAt?: Date;
    private _endedAt?: Date;
    private _createdAt: Date;
    private _players: Map<number, MatchPlayer>;

    constructor(
        gameTypeId: number,
        playerIds: number[] = [],
        id?: number,
        status: MatchStatus = MatchStatus.PENDING,
        startedAt?: Date,
        endedAt?: Date,
        createdAt?: Date
    ) {
        this._id = id;
        this._gameTypeId = gameTypeId;
        this._status = status;
        this._startedAt = startedAt;
        this._endedAt = endedAt;
        this._createdAt = createdAt || new Date();
        this._players = new Map();

        playerIds.forEach((playerId) => {
            this._players.set(playerId, {
                userId: playerId,
                username: null,
                score: 0,
                isWinner: false,
            });
        });
    }

    public get id(): number | undefined {
        return this._id;
    }

    public get gameTypeId(): number {
        return this._gameTypeId;
    }

    public get status(): MatchStatus {
        return this._status;
    }

    public get startedAt(): Date | undefined {
        return this._startedAt;
    }

    public get endedAt(): Date | undefined {
        return this._endedAt;
    }

    public get createdAt(): Date {
        return this._createdAt;
    }

    public get players(): MatchPlayer[] {
        return Array.from(this._players.values());
    }

    public get playerIds(): number[] {
        return Array.from(this._players.keys());
    }

    public start(): boolean {
        if (this._status !== MatchStatus.PENDING) {
            return false;
        }

        if (this._players.size === 0) {
            return false;
        }

        this._status = MatchStatus.IN_PROGRESS;
        this._startedAt = new Date();
        return true;
    }

    public end(winnerIds: number[], finalScores: Record<number, number>): boolean {
        if (this._status !== MatchStatus.IN_PROGRESS) {
            return false;
        }

        this._status = MatchStatus.COMPLETED;
        this._endedAt = new Date();

        Object.entries(finalScores).forEach(([userId, score]) => {
            const playerId = Number(userId);
            const player = this._players.get(playerId);
            if (player) {
                player.score = score;
                player.isWinner = winnerIds.includes(playerId);
            }
        });

        return true;
    }

    public cancel(): boolean {
        if (this._status === MatchStatus.COMPLETED || this._status === MatchStatus.CANCELLED) {
            return false;
        }

        this._status = MatchStatus.CANCELLED;
        this._endedAt = new Date();
        return true;
    }

    public addPlayer(playerId: number): boolean {
        if (this._status !== MatchStatus.PENDING) {
            return false;
        }

        if (this._players.has(playerId)) {
            return false;
        }

        this._players.set(playerId, {
            userId: playerId,
            username: null,
            score: 0,
            isWinner: false,
        });

        return true;
    }

    public updatePlayerScore(playerId: number, newScore: number): boolean {
        const player = this._players.get(playerId);
        if (!player) {
            return false;
        }

        player.score = newScore;
        return true;
    }

    public hasPlayer(playerId: number): boolean {
        return this._players.has(playerId);
    }

    public getPlayer(playerId: number): MatchPlayer | undefined {
        return this._players.get(playerId);
    }

    public canStart(): boolean {
        return this._status === MatchStatus.PENDING && this._players.size > 0;
    }

    public isActive(): boolean {
        return this._status === MatchStatus.IN_PROGRESS;
    }

    public isCompleted(): boolean {
        return this._status === MatchStatus.COMPLETED;
    }

    public isCancelled(): boolean {
        return this._status === MatchStatus.CANCELLED;
    }

    public static fromDatabase(data: {
        id: number;
        game_type_id: number;
        status: MatchStatus;
        started_at?: string | Date;
        ended_at?: string | Date;
        created_at: string | Date;
        players?: {
            user_id: number;
            username: string | null;
            score: number;
            is_winner: boolean;
        }[];
    }): Match {
        const match = new Match(
            data.game_type_id,
            [],
            data.id,
            data.status,
            data.started_at ? new Date(data.started_at) : undefined,
            data.ended_at ? new Date(data.ended_at) : undefined,
            new Date(data.created_at)
        );

        if (data.players) {
            data.players.forEach((player) => {
                match._players.set(player.user_id, {
                    userId: player.user_id,
                    username: player.username,
                    score: player.score,
                    isWinner: Boolean(player.is_winner),
                });
            });
        }

        return match;
    }

    public toDatabase(): {
        id?: number;
        game_type_id: number;
        status: MatchStatus;
        started_at?: Date | null;
        ended_at?: Date | null;
        created_at: Date;
    } {
        return {
            id: this._id,
            game_type_id: this._gameTypeId,
            status: this._status,
            started_at: this._startedAt || null,
            ended_at: this._endedAt || null,
            created_at: this._createdAt,
        };
    }

    public setId(id: number): void {
        if (this._id === undefined) {
            this._id = id;
        }
    }

    public toJSON(): object {
        return {
            id: this._id,
            gameTypeId: this._gameTypeId,
            status: this._status,
            startedAt: this._startedAt,
            endedAt: this._endedAt,
            createdAt: this._createdAt,
            players: this.players,
        };
    }
}
