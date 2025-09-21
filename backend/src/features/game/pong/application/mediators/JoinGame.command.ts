import { FastifyInstance } from 'fastify';
import { IGameRepository } from '../repositories/Game.IRepository';
import { ErrorResult, Result } from '@shared/abstractions/Result';
import { ICommand } from '@shared/application/abstractions/ICommand.interface';
import { handleError } from '@shared/utils/error.utils';
import { badRequestError } from '@shared/Errors';

export const gameNotFoundError: ErrorResult = 'gameNotFoundError';

export const gameFullError: ErrorResult = 'gameFullError';

export const invalidRequestError: ErrorResult = 'invalidRequestError';

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
        private readonly fastify: FastifyInstance,
        private readonly gameRepository: IGameRepository,
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

            const gameResult = await this.gameRepository.getGame(gameId);
            if (!gameResult.isSuccess || !gameResult.value) {
                return Result.error(gameNotFoundError);
            }

            const game = gameResult.value;

            if (game.hasPlayer(userId)) {
                return Result.success({
                    message: 'Already in the game',
                    userId: userId,
                    gameId: gameId,
                    alreadyJoined: true,
                });
            }

            const added = game.addPlayer(userId);
            if (!added) {
                return Result.error(gameFullError);
            }

            const updateResult = await this.gameRepository.updateGame(gameId, game);
            if (!updateResult.isSuccess) {
                return Result.error('gameUpdateError');
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
