import { FastifyInstance } from 'fastify';
import { IGameRepository } from '../repositories/Game.IRepository';
import { ErrorResult, Result } from '@shared/abstractions/Result';
import { ICommand } from '@shared/application/abstractions/ICommand.interface';
import { handleError } from '@shared/utils/error.utils';
import { badRequestError } from '@shared/Errors';

export const gameNotFoundError: ErrorResult = 'gameNotFoundError';

export const playerNotInGameError: ErrorResult = 'playerNotInGameError';

export const invalidRequestError: ErrorResult = 'invalidRequestError';

export interface ISetPlayerReadyRequest {
    gameId: string;
    playerId: string;
    isReady: boolean;
}

export interface ISetPlayerReadyResponse {
    message: string;
    gameId: string;
    playerId: string;
    isReady: boolean;
    gameStarted: boolean;
}

export default class SetPlayerReadyCommand
    implements ICommand<ISetPlayerReadyRequest, ISetPlayerReadyResponse>
{
    constructor(
        private readonly gameRepository: IGameRepository,
        private readonly fastify: FastifyInstance
    ) {}

    validate(request?: ISetPlayerReadyRequest): Result<void> {
        if (!request) {
            return Result.error(badRequestError);
        }

        if (!request.gameId || !request.playerId) {
            return Result.error(invalidRequestError);
        }

        if (typeof request.isReady !== 'boolean') {
            return Result.error('invalidRequestError');
        }

        return Result.success(undefined);
    }

    async execute(request?: ISetPlayerReadyRequest): Promise<Result<ISetPlayerReadyResponse>> {
        if (!request) return Result.error(badRequestError);

        try {
            const { gameId, playerId, isReady } = request;

            const gameResult = await this.gameRepository.getGame(gameId);
            if (!gameResult.isSuccess || !gameResult.value) {
                return Result.error(gameNotFoundError);
            }

            const game = gameResult.value;

            const success = game.setPlayerReady(playerId, isReady);
            if (!success) {
                return Result.error(playerNotInGameError);
            }

            const updateResult = await this.gameRepository.updateGame(gameId, game);
            if (!updateResult.isSuccess) {
                return Result.error('gameUpdateError');
            }

            const gameStarted = game.isGameRunning();

            return Result.success({
                message: isReady
                    ? gameStarted
                        ? 'Player is ready and game has started!'
                        : 'Player is ready, waiting for other player'
                    : 'Player is not ready',
                gameId: gameId,
                playerId: playerId,
                isReady: isReady,
                gameStarted: gameStarted,
            });
        } catch (error) {
            return handleError<ISetPlayerReadyResponse>(
                error,
                'Failed to set player ready status',
                this.fastify.log,
                '500'
            );
        }
    }
}
