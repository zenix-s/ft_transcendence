export type TournamentStatus = (typeof Tournament.STATUS)[keyof typeof Tournament.STATUS];

export class Tournament {
    private _id?: number;
    private _name: string;
    private _matchTypeId: number;
    private _status: TournamentStatus;
    private _startDate: Date;
    private _endDate?: Date;
    private _createdAt: Date;

    public static STATUS: {
        UPCOMING: 'upcoming';
        ONGOING: 'ongoing';
        COMPLETED: 'completed';
        CANCELLED: 'cancelled';
    };

    private constructor(
        name: string,
        matchTypeId: number,
        startDate: Date,
        id?: number,
        status: TournamentStatus = Tournament.STATUS.UPCOMING,
        endDate?: Date,
        createdAt?: Date
    ) {
        this._id = id;
        this._name = name;
        this._matchTypeId = matchTypeId;
        this._status = status;
        this._startDate = startDate;
        this._endDate = endDate;
        this._createdAt = createdAt || new Date();
    }

    public get id(): number | undefined {
        return this._id;
    }

    public get name(): string {
        return this._name;
    }

    public get matchTypeId(): number {
        return this._matchTypeId;
    }

    public get status(): TournamentStatus {
        return this._status;
    }

    public get startDate(): Date {
        return this._startDate;
    }

    public get endDate(): Date | undefined {
        return this._endDate;
    }

    public get createdAt(): Date {
        return this._createdAt;
    }

    public static create({
        name,
        matchTypeId,
        startDate,
        id,
        status,
        endDate,
        createdAt,
    }: {
        name: string;
        matchTypeId: number;
        startDate: Date;
        id?: number;
        status?: TournamentStatus;
        endDate?: Date;
        createdAt?: Date;
    }): Tournament {
        return new Tournament(name, matchTypeId, startDate, id, status, endDate, createdAt);
    }
}
