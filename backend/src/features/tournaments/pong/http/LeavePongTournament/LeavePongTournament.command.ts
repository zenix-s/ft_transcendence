import { Result } from '@shared/abstractions/Result';
import { ICommand } from '@shared/application/abstractions/ICommand.interface';
import { ApplicationError } from '@shared/Errors';
import { FastifyInstance } from 'fastify';

export interface ILeavePongTournamentRequest {
    userId: number;
    tournamentId: number;
}

export interface ILeavePongTournamentResponse {
    success: boolean;
}

export class LeavePongTournamentCommand implements ICommand<
    ILeavePongTournamentRequest,
    ILeavePongTournamentResponse
> {
    constructor(private readonly fastify: FastifyInstance) {}

    validate(request?: ILeavePongTournamentRequest | undefined): Result<void> {
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
        request?: ILeavePongTournamentRequest | undefined
    ): Promise<Result<ILeavePongTournamentResponse>> {
        try {
            // Paso 1: Validar que la solicitud
            if (!request) return Result.error(ApplicationError.BadRequest);

            // Paso 2: Abandonar el torneo usando el PongTournamentManager
            const leaveTournamentResult = await this.fastify.PongTournamentManager.removeParticipant({
                tournamentId: request.tournamentId,
                userId: request.userId,
            });

            // Paso 3: Manejar el resultado de abandonar el torneo
            if (!leaveTournamentResult.isSuccess) {
                return Result.error(leaveTournamentResult.error || ApplicationError.ParticipantNotFound);
            }

            return Result.success({
                success: true,
            });
        } catch (error: unknown) {
            return this.fastify.handleError<ILeavePongTournamentResponse>({
                code: ApplicationError.InternalServerError,
                error,
            });
        }
    }
}
