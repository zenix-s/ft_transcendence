import { TournamentParticipant } from './TournamentParticipant.entity';

export type TournamentStatus = (typeof Tournament.STATUS)[keyof typeof Tournament.STATUS];

export class Tournament {
    private _id?: number;
    private _name: string;
    private _matchTypeId: number;
    private _status: TournamentStatus;
    private _participants: Map<number, TournamentParticipant>;
    private _participantCountOverride?: number;

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
        participantCountOverride,
    }: {
        name: string;
        matchTypeId: number;
        id?: number;
        status?: TournamentStatus;
        createdAt?: Date;
        participantCountOverride?: number;
    }) {
        this._id = id;
        this._name = name;
        this._matchTypeId = matchTypeId;
        this._status = status;
        this._createdAt = createdAt || new Date();
        this._participants = new Map();
        this._participantCountOverride = participantCountOverride;
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

    public get participants(): TournamentParticipant[] {
        return Array.from(this._participants.values());
    }

    public get participantIds(): number[] {
        return Array.from(this._participants.keys());
    }

    public get participantCount(): number {
        return this._participantCountOverride !== undefined
            ? this._participantCountOverride
            : this._participants.size;
    }

    public static create({
        name,
        matchTypeId,
        id,
        status,
        createdAt,
        participantCountOverride,
    }: {
        name: string;
        matchTypeId: number;
        id?: number;
        status?: TournamentStatus;
        createdAt?: Date;
        participantCountOverride?: number;
    }): Tournament {
        return new Tournament({
            name,
            matchTypeId,
            id,
            status,
            createdAt,
            participantCountOverride,
        });
    }

    public addParticipant(participant: TournamentParticipant): boolean {
        if (this._status !== Tournament.STATUS.UPCOMING) {
            return false;
        }

        if (this._participants.has(participant.userId)) {
            return false;
        }

        this._participants.set(participant.userId, participant);
        return true;
    }

    public removeParticipant(userId: number): boolean {
        if (this._status !== Tournament.STATUS.UPCOMING) {
            return false;
        }

        return this._participants.delete(userId);
    }

    public getParticipant(userId: number): TournamentParticipant | undefined {
        return this._participants.get(userId);
    }

    public start(): boolean {
        if (this._status !== Tournament.STATUS.UPCOMING) {
            return false;
        }

        if (this._participants.size < 2) {
            return false;
        }

        this._status = Tournament.STATUS.ONGOING;

        // Activar todos los participantes
        this._participants.forEach((participant) => {
            participant.activate();
        });

        return true;
    }

    public complete(): boolean {
        if (this._status !== Tournament.STATUS.ONGOING) {
            return false;
        }

        this._status = Tournament.STATUS.COMPLETED;
        return true;
    }

    public cancel(): boolean {
        if (this._status === Tournament.STATUS.COMPLETED || this._status === Tournament.STATUS.CANCELLED) {
            return false;
        }

        this._status = Tournament.STATUS.CANCELLED;
        return true;
    }

    public getActiveParticipants(): TournamentParticipant[] {
        return this.participants.filter((p) => p.isActive());
    }

    public getEliminatedParticipants(): TournamentParticipant[] {
        return this.participants.filter((p) => p.isEliminated());
    }

    public getWinners(): TournamentParticipant[] {
        return this.participants.filter((p) => p.isWinner());
    }

    public isUpcoming(): boolean {
        return this._status === Tournament.STATUS.UPCOMING;
    }

    public isOngoing(): boolean {
        return this._status === Tournament.STATUS.ONGOING;
    }

    public isCompleted(): boolean {
        return this._status === Tournament.STATUS.COMPLETED;
    }

    public isCancelled(): boolean {
        return this._status === Tournament.STATUS.CANCELLED;
    }

    public static fromDatabase(data: {
        id: number;
        name: string;
        match_type_id: number;
        status: TournamentStatus;
        created_at: string | Date;
        participants?: TournamentParticipant[];
        participantCountOverride?: number;
    }): Tournament {
        const tournament = new Tournament({
            id: data.id,
            name: data.name,
            matchTypeId: data.match_type_id,
            status: data.status,
            createdAt: new Date(data.created_at),
            participantCountOverride: data.participantCountOverride,
        });

        // Añadir participantes si existen
        if (data.participants) {
            data.participants.forEach((participant) => {
                tournament._participants.set(participant.userId, participant);
            });
        }

        return tournament;
    }

    public toDatabase(): {
        id?: number;
        name: string;
        match_type_id: number;
        status: TournamentStatus;
        created_at: Date;
    } {
        return {
            id: this._id,
            name: this._name,
            match_type_id: this._matchTypeId,
            status: this._status,
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
            name: this._name,
            matchTypeId: this._matchTypeId,
            status: this._status,
            createdAt: this._createdAt,
            participants: this.participants.map((p) => p.toJSON()),
            participantCount: this.participantCount,
        };
    }
}
