import { Result } from '@shared/abstractions/Result';
import { ICommand } from '@shared/application/abstractions/ICommand.interface';
import { ApplicationError } from '@shared/Errors';
import { FastifyInstance } from 'fastify';
import { Match } from '@shared/domain/Entities/Match.entity';

export interface ICreatePongTournamentRequest {
    userId: number;
    name: string;
    matchSettings?: {
        maxScore: number;
        maxGameTime: number;
        visualStyle: '2d' | '3d';
    };
}

export interface ICreatePongTournamentResponse {
    success: boolean;
    tournamentId?: number;
}

export class CreatePongTournamentCommand implements ICommand<
    ICreatePongTournamentRequest,
    ICreatePongTournamentResponse
> {
    constructor(private readonly fastify: FastifyInstance) {}

    validate(request?: ICreatePongTournamentRequest | undefined): Result<void> {
        if (!request) return Result.error(ApplicationError.InvalidRequest);

        // Paso 1: Validar que userId esté presente
        if (!request.userId || typeof request.userId !== 'number') {
            return Result.error(ApplicationError.UnauthorizedAccess);
        }

        return Result.success(undefined);
    }

    async execute(
        request?: ICreatePongTournamentRequest | undefined
    ): Promise<Result<ICreatePongTournamentResponse>> {
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

            // Paso 4: Crear el torneo usando el PongTournamentManager
            const createTournamentResult = await this.fastify.PongTournamentManager.createTournamnet({
                name: request.name,
                creatorUserId: request.userId,
                matchSettings: request.matchSettings,
            });

            // Paso 3: Manejar el resultado de la creación del torneo
            if (!createTournamentResult.isSuccess || !createTournamentResult.value) {
                return Result.error(createTournamentResult.error || ApplicationError.TournamentCreationError);
            }

            // Paso 4: Notificar que el estado del torneo se ha actualizado
            if (this.fastify.TournamentWebSocketService?.notifyTournamentStateUpdated) {
                this.fastify.TournamentWebSocketService.notifyTournamentStateUpdated(
                    createTournamentResult.value,
                    request.name
                );
            }

            return Result.success({
                success: true,
                tournamentId: createTournamentResult.value,
            });
        } catch (error: unknown) {
            return this.fastify.handleError<ICreatePongTournamentResponse>({
                code: ApplicationError.InternalServerError,
                error,
            });
        }
    }
}
