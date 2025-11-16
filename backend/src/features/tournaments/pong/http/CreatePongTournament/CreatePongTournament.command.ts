import { Result } from '@shared/abstractions/Result';
import { ICommand } from '@shared/application/abstractions/ICommand.interface';
import { ApplicationError } from '@shared/Errors';
import { FastifyInstance } from 'fastify';

export interface ICreatePongTournamentRequest {
    userId: number;
    name: string;
}

export interface ICreatePongTournamentResponse {
    success: boolean;
    tournamentId?: number;
}

export class CreatePongTournamentCommand
    implements ICommand<ICreatePongTournamentRequest, ICreatePongTournamentResponse>
{
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

            // Paso 2: Crear el torneo usando el PongTournamentManager
            const createTournamentResult = await this.fastify.PongTournamentManager.createTournamnet({
                name: request.name,
            });

            // Paso 3: Manejar el resultado de la creación del torneo
            if (!createTournamentResult.isSuccess || !createTournamentResult.value) {
                return Result.error(createTournamentResult.error || ApplicationError.TournamentCreationError);
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
