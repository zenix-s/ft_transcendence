import { FastifyInstance } from 'fastify';
import { IGameRepository } from '../repositories/Game.IRepository';
import { ErrorResult, Result } from '@shared/abstractions/Result';
import { ICommand } from '@shared/application/abstractions/ICommand.interface';
import { PongGame } from '../../domain/PongGame';
import { handleError } from '@shared/utils/error.utils';

export const gameCreationError: ErrorResult = 'gameCreationError';

export interface ICreateGameResponse {
    message: string;
    gameId: string;
}

export interface ICreateGameRequest {
    winnerScore?: number;
    maxGameTime?: number;
}

export default class CreateGameCommand implements ICommand<ICreateGameRequest, ICreateGameResponse> {
    constructor(
        private readonly fastify: FastifyInstance,
        private readonly gameRepository: IGameRepository
    ) {}

    validate(request?: ICreateGameRequest | undefined): Result<void> {
        if (!request) return Result.success(undefined);

        if (request.winnerScore !== undefined) {
            if (
                typeof request.winnerScore !== 'number' ||
                request.winnerScore < 1 ||
                request.winnerScore > 100
            ) {
                return Result.error('invalidWinnerScore');
            }
        }

        if (request.maxGameTime !== undefined) {
            if (
                typeof request.maxGameTime !== 'number' ||
                request.maxGameTime < 30 ||
                request.maxGameTime > 3600
            ) {
                return Result.error('invalidMaxGameTime');
            }
        }

        return Result.success(undefined);
    }

    async execute(request?: ICreateGameRequest | undefined): Promise<Result<ICreateGameResponse>> {
        try {
            const winnerScore = request?.winnerScore || 5;
            const maxGameTime = request?.maxGameTime || 120;

            const game = new PongGame(winnerScore, maxGameTime);

            const gameIdResult = await this.gameRepository.createGame(game);

            if (!gameIdResult.isSuccess || !gameIdResult.value) {
                return Result.error(gameCreationError);
            }

            const gameId = gameIdResult.value;

            return Result.success({
                message: `Game created successfully with ID: ${gameId}`,
                gameId: gameId,
            });
        } catch (error) {
            return handleError<ICreateGameResponse>(error, 'Game creation failed', this.fastify.log, '500');
        }
    }
}
