// export interface ICreateSinglePlayerGameResponse {
//     message: string;
//     gameId: number;
//     mode: string;
// }

import { Result } from '@shared/abstractions/Result';
import { ICommand } from '@shared/application/abstractions/ICommand.interface';
import { ApplicationError } from '@shared/Errors';
import { FastifyInstance } from 'fastify';

// export interface ICreateSinglePlayerGameRequest {
//     winnerScore?: number;
//     maxGameTime?: number;
//     aiDifficulty?: number;
//     userId?: number;
// }

// export default class CreateSinglePlayerGameCommand
//     implements ICommand<ICreateSinglePlayerGameRequest, ICreateSinglePlayerGameResponse>
//

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
            if (!request) return Result.error(ApplicationError.BadRequest);

            return Result.success({
                success: true,
                tournamentId: 1,
            });
        } catch (error: unknown) {
            return this.fastify.handleError<ICreatePongTournamentResponse>({
                code: ApplicationError.InternalServerError,
                error,
            });
        }
    }
}
