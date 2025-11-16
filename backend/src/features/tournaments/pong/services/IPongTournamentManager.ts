import { Result } from '@shared/abstractions/Result';

export interface IPongTournamentManager {
    createTournamnet({ name }: { name: string }): Promise<Result<number>>;
    addParticipant({ tournamentId, userId }: { tournamentId: number; userId: number }): Promise<Result<void>>;
}
