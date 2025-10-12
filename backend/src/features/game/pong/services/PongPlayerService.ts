import { FastifyInstance } from 'fastify';
import { Result } from '@shared/abstractions/Result';
import { PongGameService } from './PongGameService';
import { ApplicationError } from '@shared/Errors';

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
                return Result.error(ApplicationError.GameNotFound);
            }
            const moved = game.movePlayer(playerId, direction);

            if (!moved) {
                return Result.error(ApplicationError.PlayerNotInGame);
            }

            const updateResult = await this.gameService.updateGame(gameId, game);
            if (!updateResult.isSuccess) {
                return Result.error(ApplicationError.GameUpdateError);
            }

            return Result.success({ moved: true });
        } catch (error) {
            return this.fastify.handleError({
                code: ApplicationError.InternalServerError,
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
                return Result.error(ApplicationError.GameNotFound);
            }
            const success = game.setPlayerReady(playerId, isReady);

            if (!success) {
                return Result.error(ApplicationError.PlayerNotInGame);
            }

            const updateResult = await this.gameService.updateGame(gameId, game);
            if (!updateResult.isSuccess) {
                return Result.error(ApplicationError.GameUpdateError);
            }

            const gameStarted = game.isGameRunning();

            return Result.success({
                isReady,
                gameStarted,
            });
        } catch (error) {
            return this.fastify.handleError({
                code: ApplicationError.InternalServerError,
                error,
            });
        }
    }
}
