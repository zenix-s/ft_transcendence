import { Result } from '@shared/abstractions/Result';

export interface IPongTournamentManager {
    createTournamnet({ name }: { name: string }): Promise<Result<number>>;
}
