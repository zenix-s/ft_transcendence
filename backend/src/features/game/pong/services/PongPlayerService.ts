import { FastifyInstance } from 'fastify';
import { Result } from '@shared/abstractions/Result';
import { PongGameService } from './PongGameService';

export class PongPlayerService {
    private readonly gameService: PongGameService;

    constructor(private readonly fastify: FastifyInstance) {
        this.gameService = new PongGameService(fastify);
    }

    async movePaddle(
        gameId: number,
        playerId: number,
        direction: 'up' | 'down'
    ): Promise<Result<{ moved: boolean }>> {
        try {
            const game = await this.gameService.getGame(gameId);
            if (!game) {
                return Result.error('gameNotFound');
            }
            const moved = game.movePlayer(playerId, direction);

            if (!moved) {
                return Result.error('playerNotInGame');
            }

            const updateResult = await this.gameService.updateGame(gameId, game);
            if (!updateResult.isSuccess) {
                return Result.error('gameUpdateError');
            }

            return Result.success({ moved: true });
        } catch (error) {
            return this.fastify.handleError({
                code: '500',
                error,
            });
        }
    }

    async setPlayerReady(
        gameId: number,
        playerId: number,
        isReady: boolean
    ): Promise<Result<{ isReady: boolean; gameStarted: boolean }>> {
        try {
            const game = await this.gameService.getGame(gameId);
            if (!game) {
                return Result.error('gameNotFound');
            }
            const success = game.setPlayerReady(playerId, isReady);

            if (!success) {
                return Result.error('playerNotInGame');
            }

            const updateResult = await this.gameService.updateGame(gameId, game);
            if (!updateResult.isSuccess) {
                return Result.error('gameUpdateError');
            }

            const gameStarted = game.isGameRunning();

            return Result.success({
                isReady,
                gameStarted,
            });
        } catch (error) {
            return this.fastify.handleError({
                code: '500',
                error,
            });
        }
    }
}
