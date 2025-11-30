export type TournamentMatchupStatus = 'pending' | 'in_progress' | 'completed';

export interface ITournamentMatchup {
    player1Id: number;
    player2Id?: number; // undefined si juega contra AI
    winnerId?: number;
    matchId?: number;
    status: TournamentMatchupStatus;
}

export class TournamentRound {
    private _roundNumber: number;
    private _matchups: ITournamentMatchup[];
    private _isComplete: boolean;

    constructor({ roundNumber, matchups }: { roundNumber: number; matchups: ITournamentMatchup[] }) {
        this._roundNumber = roundNumber;
        this._matchups = matchups;
        this._isComplete = false;
    }

    public get roundNumber(): number {
        return this._roundNumber;
    }

    public get matchups(): ITournamentMatchup[] {
        return this._matchups;
    }

    public get isComplete(): boolean {
        return this._isComplete;
    }

    public static create({
        roundNumber,
        playerIds,
    }: {
        roundNumber: number;
        playerIds: number[];
    }): TournamentRound {
        const matchups: ITournamentMatchup[] = [];

        // Dividir jugadores en pares
        for (let i = 0; i < playerIds.length; i += 2) {
            const player1Id = playerIds[i];
            const player2Id = i + 1 < playerIds.length ? playerIds[i + 1] : undefined;

            matchups.push({
                player1Id,
                player2Id,
                status: 'pending',
            });
        }

        return new TournamentRound({ roundNumber, matchups });
    }

    public updateMatchupStatus(
        player1Id: number,
        status: TournamentMatchupStatus,
        matchId?: number
    ): boolean {
        const matchup = this._matchups.find((m) => m.player1Id === player1Id);
        if (!matchup) {
            return false;
        }

        matchup.status = status;
        if (matchId !== undefined) {
            matchup.matchId = matchId;
        }

        return true;
    }

    public setMatchupWinner(matchId: number, winnerId: number): boolean {
        const match = this._matchups.find((m) => m.matchId === matchId);
        if (!match) {
            return false;
        }

        match.winnerId = winnerId;
        match.status = 'completed';

        // Verificar si todos los matchups están completados
        this._isComplete = this._matchups.every((m) => m.status === 'completed');

        return true;
    }
    
    public setBothLosers(matchId: number): boolean {
        const match = this._matchups.find((m) => m.matchId === matchId);
        if (!match) {
            return false;
        }

        match.winnerId = undefined;
        match.status = 'completed';

        // Verificar si todos los matchups están completados
        this._isComplete = this._matchups.every((m) => m.status === 'completed');

        return true;
    }

    public getWinners(): number[] {
        return this._matchups.filter((m) => m.winnerId !== undefined).map((m) => m.winnerId as number);
    }

    public getPendingMatchups(): ITournamentMatchup[] {
        return this._matchups.filter((m) => m.status === 'pending');
    }

    public getInProgressMatchups(): ITournamentMatchup[] {
        return this._matchups.filter((m) => m.status === 'in_progress');
    }

    public hasMatchup(player1Id: number): boolean {
        return this._matchups.some((m) => m.player1Id === player1Id);
    }

    public getMatchup(player1Id: number): ITournamentMatchup | undefined {
        return this._matchups.find((m) => m.player1Id === player1Id);
    }

    public toJSON(): object {
        return {
            roundNumber: this._roundNumber,
            matchups: this._matchups,
            isComplete: this._isComplete,
        };
    }
}
