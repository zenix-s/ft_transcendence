import { FastifyInstance } from 'fastify';
import { IGameRepository } from '../repositories/Game.IRepository';
import { ErrorResult, Result } from '@shared/abstractions/Result';
import { ICommand } from '@shared/application/abstractions/ICommand.interface';
import { handleError } from '@shared/utils/error.utils';
import { badRequestError } from '@shared/Errors';

export const gameNotFoundError: ErrorResult = {
    code: 'gameNotFoundError',
    message: 'Game not found',
};

export const gameFullError: ErrorResult = {
    code: 'gameFullError',
    message: 'Game is already full',
};

export const invalidRequestError: ErrorResult = {
    code: 'invalidRequestError',
    message: 'Game ID is required',
};

export interface IJoinGameRequest {
    gameId: string;
    userId?: string;
}

export interface IJoinGameResponse {
    message: string;
    userId: string;
    gameId: string;
    alreadyJoined?: boolean;
}

export default class JoinGameCommand implements ICommand<IJoinGameRequest, IJoinGameResponse> {
    constructor(
        private readonly gameRepository: IGameRepository,
        private readonly fastify: FastifyInstance
    ) {}

    validate(request?: IJoinGameRequest): Result<void> {
        if (!request) {
            return Result.error(badRequestError);
        }

        if (!request.gameId) {
            return Result.error(invalidRequestError);
        }

        return Result.success(undefined);
    }

    async execute(request?: IJoinGameRequest): Promise<Result<IJoinGameResponse>> {
        if (!request) return Result.error(badRequestError);

        try {
            const { gameId } = request;
            const userId = request.userId || crypto.randomUUID();

            // Get the game from repository
            const gameResult = await this.gameRepository.getGame(gameId);
            if (!gameResult.isSuccess || !gameResult.value) {
                return Result.error(gameNotFoundError);
            }

            const game = gameResult.value;

            // Check if player is already in the game
            if (game.hasPlayer(userId)) {
                return Result.success({
                    message: 'Already in the game',
                    userId: userId,
                    gameId: gameId,
                    alreadyJoined: true,
                });
            }

            // Try to add the player
            const added = game.addPlayer(userId);
            if (!added) {
                return Result.error(gameFullError);
            }

            // Update the game in the repository
            const updateResult = await this.gameRepository.updateGame(gameId, game);
            if (!updateResult.isSuccess) {
                return Result.error({
                    code: 'gameUpdateError',
                    message: 'Failed to update game',
                });
            }

            return Result.success({
                message: `Successfully joined game ${gameId}`,
                userId: userId,
                gameId: gameId,
            });
        } catch (error) {
            return handleError<IJoinGameResponse>(error, 'Failed to join game', this.fastify.log, '500');
        }
    }
}
