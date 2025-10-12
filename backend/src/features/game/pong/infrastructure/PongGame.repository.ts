import { Result } from '@shared/abstractions/Result';
import { PongGame } from '../domain/PongGame';
import { PongGameManager } from '../services/PongGameManager';
import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { ApplicationError } from '@shared/Errors';

export interface IPongGameRepository {
    createGame(game: PongGame, matchId: number): Promise<Result<number>>;
    getGame(gameId: number): Promise<Result<PongGame>>;
    updateGame(gameId: number, game: PongGame): Promise<Result<void>>;
    deleteGame(gameId: number): Promise<Result<void>>;
    getAllGames(): Promise<Result<Map<number, PongGame>>>;
    exists(gameId: number): Promise<Result<boolean>>;
}

class PongGameRepository implements IPongGameRepository {
    private gameManager: PongGameManager;

    public constructor(fastify: FastifyInstance) {
        this.gameManager = new PongGameManager(fastify);
    }

    async createGame(game: PongGame, matchId: number): Promise<Result<number>> {
        try {
            // Use matchId as gameId for consistency - they should be the same in this system
            const gameId = matchId;
            const createResult = await this.gameManager.createGame(gameId, matchId, game);
            if (!createResult.isSuccess) {
                return Result.error(ApplicationError.GameCreationError);
            }
            return Result.success(gameId);
        } catch {
            return Result.error(ApplicationError.GameCreationError);
        }
    }

    async getGame(gameId: number): Promise<Result<PongGame>> {
        const game = this.gameManager.getGame(gameId);
        if (!game) {
            return Result.error(ApplicationError.GameNotFound);
        }
        return Result.success(game);
    }

    async updateGame(gameId: number, game: PongGame): Promise<Result<void>> {
        if (!this.gameManager.gameExists(gameId)) {
            return Result.error(ApplicationError.GameNotFound);
        }
        this.gameManager.updateGame(gameId, game);
        return Result.success(undefined);
    }

    async deleteGame(gameId: number): Promise<Result<void>> {
        if (!this.gameManager.gameExists(gameId)) {
            return Result.error(ApplicationError.GameNotFound);
        }
        this.gameManager.deleteGame(gameId);
        return Result.success(undefined);
    }

    async getAllGames(): Promise<Result<Map<number, PongGame>>> {
        return Result.success(this.gameManager.getAllGames());
    }

    async exists(gameId: number): Promise<Result<boolean>> {
        return Result.success(this.gameManager.gameExists(gameId));
    }
}

export default fp(
    async (fastify) => {
        const repository = new PongGameRepository(fastify);
        fastify.decorate('PongGameRepository', repository);
    },
    { name: 'PongGameRepository' }
);
