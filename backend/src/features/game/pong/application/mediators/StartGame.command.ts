import { FastifyInstance } from 'fastify';
import { ErrorResult, Result } from '@shared/abstractions/Result';
import { ICommand } from '@shared/application/abstractions/ICommand.interface';
import { badRequestError } from '@shared/Errors';
import { IPongGameRepository } from '@shared/infrastructure/repositories/PongGame.repository';

export const gameNotFoundError: ErrorResult = 'gameNotFoundError';

export const cannotStartGameError: ErrorResult = 'cannotStartGameError';

export const gameAlreadyRunningError: ErrorResult = 'gameAlreadyRunningError';

export const invalidRequestError: ErrorResult = 'invalidRequestError';

export interface IStartGameRequest {
    gameId: number;
}

export interface IStartGameResponse {
    message: string;
    gameId: number;
}

export default class StartGameCommand implements ICommand<IStartGameRequest, IStartGameResponse> {
    private readonly gameRepository: IPongGameRepository;

    constructor(private readonly fastify: FastifyInstance) {
        this.gameRepository = fastify.PongGameRepository;
    }

    validate(request?: IStartGameRequest): Result<void> {
        if (!request) {
            return Result.error(badRequestError);
        }

        if (!request.gameId || typeof request.gameId !== 'number') {
            return Result.error(invalidRequestError);
        }

        return Result.success(undefined);
    }

    async execute(request?: IStartGameRequest): Promise<Result<IStartGameResponse>> {
        if (!request) return Result.error(badRequestError);

        try {
            const { gameId } = request;

            const gameResult = await this.gameRepository.getGame(gameId);
            if (!gameResult.isSuccess || !gameResult.value) {
                return Result.error(gameNotFoundError);
            }

            const game = gameResult.value;

            if (!game.canStart()) {
                return Result.error(cannotStartGameError);
            }

            const started = game.start();
            if (!started) {
                return Result.error(gameAlreadyRunningError);
            }

            const updateResult = await this.gameRepository.updateGame(gameId, game);
            if (!updateResult.isSuccess) {
                return Result.error('gameUpdateError');
            }

            return Result.success({
                message: `Game ${gameId} started successfully`,
                gameId: gameId,
            });
        } catch (error) {
            return this.fastify.handleError<IStartGameResponse>({
                code: '500',
                error,
            });
        }
    }
}
