import { Result } from '@shared/abstractions/Result';
import { ICommand } from '@shared/application/abstractions/ICommand.interface';
import { ApplicationError } from '@shared/Errors';
import { FastifyInstance } from 'fastify';
import { Match } from '@shared/domain/Entities/Match.entity';

export interface IJoinPongTournamentRequest {
    userId: number;
    tournamentId: number;
}

export interface IJoinPongTournamentResponse {
    success: boolean;
    message: string;
}

export class JoinPongTournamentCommand implements ICommand<
    IJoinPongTournamentRequest,
    IJoinPongTournamentResponse
> {
    constructor(private readonly fastify: FastifyInstance) {}

    validate(request?: IJoinPongTournamentRequest | undefined): Result<void> {
        if (!request) return Result.error(ApplicationError.InvalidRequest);

        // Paso 1: Validar que userId esté presente
        if (!request.userId || typeof request.userId !== 'number') {
            return Result.error(ApplicationError.UnauthorizedAccess);
        }

        // Paso 2: Validar que tournamentId esté presente y sea válido
        if (!request.tournamentId || typeof request.tournamentId !== 'number' || request.tournamentId <= 0) {
            return Result.error(ApplicationError.InvalidRequest);
        }

        return Result.success(undefined);
    }

    async execute(
        request?: IJoinPongTournamentRequest | undefined
    ): Promise<Result<IJoinPongTournamentResponse>> {
        try {
            // Paso 1: Validar que la solicitud
            if (!request) return Result.error(ApplicationError.BadRequest);

            // Paso 2: Verificar si el usuario tiene partidas activas
            const activeMatches = await this.fastify.MatchRepository.findUserMatches({
                userId: request.userId,
                status: [Match.STATUS.PENDING, Match.STATUS.IN_PROGRESS],
            });
            if (activeMatches.length > 0) {
                return Result.error(ApplicationError.PlayerHasActiveMatch);
            }

            // Paso 3: Verificar si el usuario está en un torneo activo
            const activeTournamentResult = await this.fastify.TournamentRepository.isUserInActiveTournament({
                userId: request.userId,
            });
            if (activeTournamentResult.isSuccess && activeTournamentResult.value) {
                return Result.error(ApplicationError.PlayerHasActiveTournament);
            }

            // Paso 4: Unirse al torneo usando el PongTournamentManager
            const joinTournamentResult = await this.fastify.PongTournamentManager.addParticipant({
                tournamentId: request.tournamentId,
                userId: request.userId,
            });

            // Paso 3: Manejar el resultado de unirse al torneo
            if (!joinTournamentResult.isSuccess) {
                return Result.error(joinTournamentResult.error || ApplicationError.ParticipantAdditionError);
            }

            return Result.success({
                success: true,
                message: 'Te has unido al torneo exitosamente',
            });
        } catch (error: unknown) {
            return this.fastify.handleError<IJoinPongTournamentResponse>({
                code: ApplicationError.InternalServerError,
                error,
            });
        }
    }
}
