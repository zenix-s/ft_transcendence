import { Result } from '@shared/abstractions/Result';
import { Tournament } from '@shared/domain/Entities/Tournament.entity';
import { TournamentParticipant } from '@shared/domain/Entities/TournamentParticipant.entity';
import MatchType from '@shared/domain/ValueObjects/MatchType.value';
import { ApplicationError } from '@shared/Errors';
import { FastifyInstance } from 'fastify';

export class ActivePongTournament {
    private tournamentId: number | null;

    constructor(private readonly fastify: FastifyInstance) {
        this.tournamentId = null;
    }

    async initialize({ name }: { name: string }): Promise<Result<number>> {
        const tournamentEntity = Tournament.create({
            name: name,
            matchTypeId: MatchType.TOURNAMENT_PONG.id,
            createdAt: new Date(),
        });

        const createResult = await this.fastify.TournamentRepository.createTournament({
            tournament: tournamentEntity,
        });

        if (!createResult.isSuccess || !createResult.value) {
            return Result.failure(createResult.error || ApplicationError.InsertionError);
        }

        this.tournamentId = createResult.value;

        return Result.success(this.tournamentId);
    }

    async addParticipant({ userId }: { userId: number }): Promise<Result<void>> {
        try {
            if (this.tournamentId === null) {
                return Result.error(ApplicationError.TournamentNotInitialized);
            }

            // Recuperar la instancia completa del torneo desde la base de datos
            const tournamentResult = await this.fastify.TournamentRepository.findById({
                id: this.tournamentId,
            });

            if (!tournamentResult.isSuccess || !tournamentResult.value) {
                return Result.error(tournamentResult.error || ApplicationError.TournamentNotFound);
            }

            const tournament = tournamentResult.value;

            // Crear el participante
            const participant = TournamentParticipant.create({
                tournamentId: this.tournamentId,
                userId: userId,
            });

            // Añadir participante a la entidad de dominio
            const addSuccess = tournament.addParticipant(participant);
            if (!addSuccess) {
                return Result.error(ApplicationError.ParticipantAlreadyExists);
            }

            // Persistir cambios en la base de datos
            const updateResult = await this.fastify.TournamentRepository.update({
                tournament: tournament,
            });

            if (!updateResult.isSuccess) {
                return Result.error(updateResult.error || ApplicationError.UpdateError);
            }

            return Result.success(undefined);
        } catch (error) {
            return this.fastify.handleError({
                code: ApplicationError.ParticipantAdditionError,
                error,
            });
        }
    }

    getTournamentId(): number | null {
        return this.tournamentId;
    }
}
