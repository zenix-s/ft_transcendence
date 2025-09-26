import { FastifyInstance } from 'fastify';
import { IGameRepository } from '../repositories/Game.IRepository';
import { ErrorResult, Result } from '@shared/abstractions/Result';
import { ICommand } from '@shared/application/abstractions/ICommand.interface';
import { handleError } from '@shared/utils/error.utils';
import { badRequestError } from '@shared/Errors';
import { GameRepository } from '../../infrastructure/Game.repository';

export const gameNotFoundError: ErrorResult = 'gameNotFoundError';

export const cannotStartGameError: ErrorResult = 'cannotStartGameError';

export const gameAlreadyRunningError: ErrorResult = 'gameAlreadyRunningError';

export const invalidRequestError: ErrorResult = 'invalidRequestError';

export interface IStartGameRequest {
    gameId: string;
}

export interface IStartGameResponse {
    message: string;
    gameId: string;
}

export default class StartGameCommand implements ICommand<IStartGameRequest, IStartGameResponse> {
    private readonly gameRepository: IGameRepository;

    constructor(private readonly fastify: FastifyInstance) {
        this.gameRepository = GameRepository.getInstance();
    }

    validate(request?: IStartGameRequest): Result<void> {
        if (!request) {
            return Result.error(badRequestError);
        }

        if (!request.gameId) {
            return Result.error(invalidRequestError);
        }

        return Result.success(undefined);
    }

    async execute(request?: IStartGameRequest): Promise<Result<IStartGameResponse>> {
        if (!request) return Result.error(badRequestError);

        try {
            const { gameId } = request;

            // Get the game from repository
            const gameResult = await this.gameRepository.getGame(gameId);
            if (!gameResult.isSuccess || !gameResult.value) {
                return Result.error(gameNotFoundError);
            }

            const game = gameResult.value;

            // Check if game can start
            if (!game.canStart()) {
                return Result.error(cannotStartGameError);
            }

            // Try to start the game
            const started = game.start();
            if (!started) {
                return Result.error(gameAlreadyRunningError);
            }

            // Update the game in the repository
            const updateResult = await this.gameRepository.updateGame(gameId, game);
            if (!updateResult.isSuccess) {
                return Result.error('gameUpdateError');
            }

            return Result.success({
                message: `Game ${gameId} started successfully`,
                gameId: gameId,
            });
        } catch (error) {
            return handleError<IStartGameResponse>(error, 'Failed to start game', this.fastify.log, '500');
        }
    }
}
