import { Result } from '@shared/abstractions/Result';
import { Tournament } from '@shared/domain/Entities/Tournament.entity';

export interface IPongTournamentManager {
    createTournamnet({ name }: { name: string }): Promise<Result<number>>;
    addParticipant({ tournamentId, userId }: { tournamentId: number; userId: number }): Promise<Result<void>>;
    getActiveTournaments(params: { limit?: number; offset?: number }): Promise<Result<Tournament[]>>;
}
