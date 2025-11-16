import { Result } from '@shared/abstractions/Result';
import { IPongTournamentManager } from './IPongTournamentManager';
import { FastifyInstance } from 'fastify';
import { ActivePongTournament } from './ActivePongTournament';
import { ApplicationError } from '@shared/Errors';

export class PongTournamentManager implements IPongTournamentManager {
    private tournaments = new Map<number, ActivePongTournament>();

    constructor(private readonly fastify: FastifyInstance) {}

    async createTournamnet({ name }: { name: string }): Promise<Result<number>> {
        try {
            const activePongTournament = new ActivePongTournament(this.fastify);
            const tournamentInitializeResult = await activePongTournament.initialize({ name });
            if (!tournamentInitializeResult.isSuccess || !tournamentInitializeResult.value) {
                return Result.error(
                    tournamentInitializeResult.error || ApplicationError.TournamentCreationError
                );
            }

            this.tournaments.set(tournamentInitializeResult.value, activePongTournament);

            return Result.success(tournamentInitializeResult.value);
        } catch (error) {
            return this.fastify.handleError({
                code: ApplicationError.TournamentCreationError,
                error,
            });
        }
    }

    async addParticipant({
        tournamentId,
        userId,
    }: {
        tournamentId: number;
        userId: number;
    }): Promise<Result<void>> {
        try {
            const activeTournament = this.tournaments.get(tournamentId);
            if (!activeTournament) {
                return Result.error(ApplicationError.TournamentNotFound);
            }

            const addParticipantResult = await activeTournament.addParticipant({ userId });
            if (!addParticipantResult.isSuccess) {
                return Result.error(addParticipantResult.error || ApplicationError.ParticipantAdditionError);
            }

            return Result.success(undefined);
        } catch (error) {
            return this.fastify.handleError({
                code: ApplicationError.ParticipantAdditionError,
                error,
            });
        }
    }
}
