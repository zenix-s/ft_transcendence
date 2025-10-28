import { Result } from '@shared/abstractions/Result';
import { PongGame } from '../domain/PongGame';
import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { ApplicationError } from '@shared/Errors';

export interface IPongGameRepository {
    createGame({ game, matchId }: { game: PongGame; matchId: number }): Promise<Result<number>>;
    getGame({ gameId }: { gameId: number }): Promise<Result<PongGame>>;
    deleteGame({ gameId }: { gameId: number }): Promise<Result<void>>;
    getAllGames(): Promise<Result<Map<number, PongGame>>>;
    exists({ gameId }: { gameId: number }): Promise<Result<boolean>>;
}

class PongGameRepository implements IPongGameRepository {
    public constructor(private readonly fastify: FastifyInstance) {}

    async createGame({ game, matchId }: { game: PongGame; matchId: number }): Promise<Result<number>> {
        try {
            // Usar matchId como gameId para consistencia - deben ser lo mismo en este sistema
            const gameId = matchId;
            const createResult = await this.fastify.PongGameManager.createGame(gameId, matchId, game);
            if (!createResult.isSuccess) {
                return Result.error(createResult.error || ApplicationError.GameCreationError);
            }
            return Result.success(gameId);
        } catch {
            return Result.error(ApplicationError.GameCreationError);
        }
    }

    async getGame({ gameId }: { gameId: number }): Promise<Result<PongGame>> {
        const gameResult = this.fastify.PongGameManager.getGame(gameId);
        if (!gameResult.isSuccess) {
            return Result.error(gameResult.error || ApplicationError.GameNotFound);
        }
        if (!gameResult.value) {
            return Result.error(ApplicationError.GameNotFound);
        }
        return Result.success(gameResult.value);
    }

    async deleteGame({ gameId }: { gameId: number }): Promise<Result<void>> {
        const existsResult = this.fastify.PongGameManager.gameExists(gameId);
        if (!existsResult.isSuccess) {
            return Result.error(existsResult.error || ApplicationError.InternalServerError);
        }
        if (!existsResult.value) {
            return Result.error(ApplicationError.GameNotFound);
        }
        return this.fastify.PongGameManager.deleteGame(gameId);
    }

    async getAllGames(): Promise<Result<Map<number, PongGame>>> {
        return this.fastify.PongGameManager.getAllGames();
    }

    async exists({ gameId }: { gameId: number }): Promise<Result<boolean>> {
        return this.fastify.PongGameManager.gameExists(gameId);
    }
}

export default fp(
    async (fastify) => {
        const repository = new PongGameRepository(fastify);
        fastify.decorate('PongGameRepository', repository);
    },
    { name: 'PongGameRepository' }
);
