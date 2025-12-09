import { Result } from '@shared/abstractions/Result';
import { ICommand } from '@shared/application/abstractions/ICommand.interface';
import { ApplicationError } from '@shared/Errors';
import { FastifyInstance } from 'fastify';

export interface IStartTournamentRequest {
    userId: number;
    tournamentId: number;
}

export interface IStartTournamentResponse {
    success: boolean;
    message: string;
}

export class StartTournamentCommand implements ICommand<IStartTournamentRequest, IStartTournamentResponse> {
    constructor(private readonly fastify: FastifyInstance) {}

    validate(request?: IStartTournamentRequest | undefined): Result<void> {
        if (!request) return Result.error(ApplicationError.InvalidRequest);

        // Validar que userId esté presente
        if (!request.userId || typeof request.userId !== 'number') {
            return Result.error(ApplicationError.UnauthorizedAccess);
        }

        // Validar que tournamentId esté presente y sea válido
        if (!request.tournamentId || typeof request.tournamentId !== 'number' || request.tournamentId <= 0) {
            return Result.error(ApplicationError.InvalidRequest);
        }

        return Result.success(undefined);
    }

    async execute(request?: IStartTournamentRequest | undefined): Promise<Result<IStartTournamentResponse>> {
        try {
            if (!request) return Result.error(ApplicationError.BadRequest);

            // Paso 1: Llamar al manager para iniciar el torneo
            const startResult = await this.fastify.PongTournamentManager.startTournament({
                tournamentId: request.tournamentId,
                userId: request.userId,
            });

            // Paso 2: Manejar el resultado
            if (!startResult.isSuccess) {
                return Result.error(startResult.error || ApplicationError.TournamentStartError);
            }

            return Result.success({
                success: true,
                message: 'Torneo iniciado correctamente',
            });
        } catch (error: unknown) {
            return this.fastify.handleError<IStartTournamentResponse>({
                code: ApplicationError.InternalServerError,
                error,
            });
        }
    }
}
