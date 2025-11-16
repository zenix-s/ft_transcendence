export type TournamentStatus = (typeof Tournament.STATUS)[keyof typeof Tournament.STATUS];

export class Tournament {
    private _id?: number;
    private _name: string;
    private _matchTypeId: number;
    private _status: TournamentStatus;

    private _createdAt: Date;

    public static STATUS = {
        UPCOMING: 'upcoming' as const,
        ONGOING: 'ongoing' as const,
        COMPLETED: 'completed' as const,
        CANCELLED: 'cancelled' as const,
    };

    private constructor({
        name,
        matchTypeId,
        id,
        status = Tournament.STATUS.UPCOMING,
        createdAt,
    }: {
        name: string;
        matchTypeId: number;
        id?: number;
        status?: TournamentStatus;
        createdAt?: Date;
    }) {
        this._id = id;
        this._name = name;
        this._matchTypeId = matchTypeId;
        this._status = status;
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

    public get createdAt(): Date {
        return this._createdAt;
    }

    public static create({
        name,
        matchTypeId,
        id,
        status,
        createdAt,
    }: {
        name: string;
        matchTypeId: number;
        id?: number;
        status?: TournamentStatus;
        createdAt?: Date;
    }): Tournament {
        return new Tournament({
            name,
            matchTypeId,
            id,
            status,
            createdAt,
        });
    }
}
