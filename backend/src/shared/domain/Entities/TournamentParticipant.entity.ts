export type TournamentParticipantStatus = 'registered' | 'active' | 'eliminated' | 'winner';

export class TournamentParticipant {
    private _id?: number;
    private _tournamentId: number;
    private _userId: number;
    private _username?: string;
    private _status: TournamentParticipantStatus;
    private _score: number;

    public static STATUS = {
        REGISTERED: 'registered' as const,
        ACTIVE: 'active' as const,
        ELIMINATED: 'eliminated' as const,
        WINNER: 'winner' as const,
    };

    constructor({
        id,
        tournamentId,
        userId,
        username,
        status = TournamentParticipant.STATUS.REGISTERED,
        score = 0,
    }: {
        id?: number;
        tournamentId: number;
        userId: number;
        username?: string;
        status?: TournamentParticipantStatus;
        score?: number;
    }) {
        this._id = id;
        this._tournamentId = tournamentId;
        this._userId = userId;
        this._username = username;
        this._status = status;
        this._score = score;
    }

    public get id(): number | undefined {
        return this._id;
    }

    public get tournamentId(): number {
        return this._tournamentId;
    }

    public get userId(): number {
        return this._userId;
    }

    public get username(): string | undefined {
        return this._username;
    }

    public get status(): TournamentParticipantStatus {
        return this._status;
    }

    public get score(): number {
        return this._score;
    }

    public static create({
        id,
        tournamentId,
        userId,
        username,
        status,
        score,
    }: {
        id?: number;
        tournamentId: number;
        userId: number;
        username?: string;
        status?: TournamentParticipantStatus;
        score?: number;
    }): TournamentParticipant {
        return new TournamentParticipant({
            id,
            tournamentId,
            userId,
            username,
            status,
            score,
        });
    }

    public activate(): boolean {
        if (this._status !== TournamentParticipant.STATUS.REGISTERED) {
            return false;
        }
        this._status = TournamentParticipant.STATUS.ACTIVE;
        return true;
    }

    public eliminate(): boolean {
        if (this._status !== TournamentParticipant.STATUS.ACTIVE) {
            return false;
        }
        this._status = TournamentParticipant.STATUS.ELIMINATED;
        return true;
    }

    public setAsWinner(): boolean {
        if (this._status !== TournamentParticipant.STATUS.ACTIVE) {
            return false;
        }
        this._status = TournamentParticipant.STATUS.WINNER;
        return true;
    }

    public updateScore(newScore: number): boolean {
        if (newScore < 0) {
            return false;
        }
        this._score = newScore;
        return true;
    }

    public addScore(points: number): boolean {
        if (this._score + points < 0) {
            return false;
        }
        this._score += points;
        return true;
    }

    public isRegistered(): boolean {
        return this._status === TournamentParticipant.STATUS.REGISTERED;
    }

    public isActive(): boolean {
        return this._status === TournamentParticipant.STATUS.ACTIVE;
    }

    public isEliminated(): boolean {
        return this._status === TournamentParticipant.STATUS.ELIMINATED;
    }

    public isWinner(): boolean {
        return this._status === TournamentParticipant.STATUS.WINNER;
    }

    public static fromDatabase(data: {
        id: number;
        tournament_id: number;
        user_id: number;
        username?: string;
        status: TournamentParticipantStatus;
        score: number;
    }): TournamentParticipant {
        return TournamentParticipant.create({
            id: data.id,
            tournamentId: data.tournament_id,
            userId: data.user_id,
            username: data.username,
            status: data.status,
            score: data.score,
        });
    }

    public toDatabase(): {
        id?: number;
        tournament_id: number;
        user_id: number;
        status: TournamentParticipantStatus;
        score: number;
    } {
        return {
            id: this._id,
            tournament_id: this._tournamentId,
            user_id: this._userId,
            status: this._status,
            score: this._score,
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
            tournamentId: this._tournamentId,
            userId: this._userId,
            username: this._username,
            status: this._status,
            score: this._score,
        };
    }
}
