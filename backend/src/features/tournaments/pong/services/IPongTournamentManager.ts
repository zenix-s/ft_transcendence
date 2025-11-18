import { Result } from '@shared/abstractions/Result';
import { Tournament } from '@shared/domain/Entities/Tournament.entity';
import { IMatchSettings } from '@shared/domain/ValueObjects/MatchSettings.value';

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
    getActiveTournaments(params: { limit?: number; offset?: number }): Promise<Result<Tournament[]>>;
    getActiveTournamentsBasic(params: { limit?: number; offset?: number }): Promise<Result<Tournament[]>>;
    getTournamentById({ id }: { id: number }): Promise<Result<Tournament | null>>;
    isUserAdminOfActiveTournament({ userId }: { userId: number }): Promise<Result<boolean>>;
}
