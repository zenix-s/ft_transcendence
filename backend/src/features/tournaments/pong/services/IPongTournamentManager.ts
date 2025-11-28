import { Result } from '@shared/abstractions/Result';
import { Tournament } from '@shared/domain/Entities/Tournament.entity';
import { IMatchSettings } from '@shared/domain/ValueObjects/MatchSettings.value';
import { ActivePongTournament } from './ActivePongTournament';

export interface PongTournamentAggregate {
    tournament: Tournament;
    isRegistered: boolean;
    userRole?: string;
}

export interface IPongTournamentManager {
    createTournamnet({
        name,
        creatorUserId,
        matchSettings,
    }: {
        name: string;
        creatorUserId: number;
        matchSettings?: IMatchSettings;
    }): Promise<Result<number>>;
    addParticipant({ tournamentId, userId }: { tournamentId: number; userId: number }): Promise<Result<void>>;
    removeParticipant({
        tournamentId,
        userId,
    }: {
        tournamentId: number;
        userId: number;
    }): Promise<Result<void>>;
    removeTournament(tournamentId: number): void;
    getActiveTournaments(params: { limit?: number; offset?: number }): Promise<Result<Tournament[]>>;
    getActiveTournamentsBasic(params: { limit?: number; offset?: number }): Promise<Result<Tournament[]>>;
    getTournamentById({
        id,
        userId,
    }: {
        id: number;
        userId: number;
    }): Promise<Result<PongTournamentAggregate>>;
    isUserAdminOfActiveTournament({ userId }: { userId: number }): Promise<Result<boolean>>;
    getActiveTournamentsWithIsRegisteredFlag({
        userId,
        limit,
        offset,
        onlyRegistered,
    }: {
        userId: number;
        limit?: number;
        offset?: number;
        onlyRegistered?: boolean;
    }): Promise<Result<PongTournamentAggregate[]>>;
    startTournament({
        tournamentId,
        userId,
    }: {
        tournamentId: number;
        userId: number;
    }): Promise<Result<void>>;
    getActiveTournament(tournamentId: number): ActivePongTournament | null;
}
