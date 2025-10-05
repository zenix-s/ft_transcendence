import { Result, ErrorResult } from '@shared/abstractions/Result';
import { PongGame } from '../../../features/game/pong/domain/PongGame';
import fp from 'fastify-plugin';

const gameNotFoundError: ErrorResult = 'GameNotFound';

const gameCreationError: ErrorResult = 'GameCreationError';

export interface IPongGameRepository {
    createGame(game: PongGame, matchId: number): Promise<Result<number>>;
    getGame(gameId: number): Promise<Result<PongGame>>;
    updateGame(gameId: number, game: PongGame): Promise<Result<void>>;
    deleteGame(gameId: number): Promise<Result<void>>;
    getAllGames(): Promise<Result<Map<number, PongGame>>>;
    exists(gameId: number): Promise<Result<boolean>>;
}

class PongGameRepository implements IPongGameRepository {
    private games: Map<number, PongGame>;

    public constructor() {
        this.games = new Map<number, PongGame>();
    }

    async createGame(game: PongGame, matchId: number): Promise<Result<number>> {
        try {
            this.games.set(matchId, game);
            return Result.success(matchId);
        } catch {
            return Result.error(gameCreationError);
        }
    }

    async getGame(gameId: number): Promise<Result<PongGame>> {
        const game = this.games.get(gameId);
        if (!game) {
            return Result.error(gameNotFoundError);
        }
        return Result.success(game);
    }

    async updateGame(gameId: number, game: PongGame): Promise<Result<void>> {
        if (!this.games.has(gameId)) {
            return Result.error(gameNotFoundError);
        }
        this.games.set(gameId, game);
        return Result.success(undefined);
    }

    async deleteGame(gameId: number): Promise<Result<void>> {
        if (!this.games.has(gameId)) {
            return Result.error(gameNotFoundError);
        }
        this.games.delete(gameId);
        return Result.success(undefined);
    }

    async getAllGames(): Promise<Result<Map<number, PongGame>>> {
        return Result.success(new Map(this.games));
    }

    async exists(gameId: number): Promise<Result<boolean>> {
        return Result.success(this.games.has(gameId));
    }
}

export default fp(
    async (fastify) => {
        const repository = new PongGameRepository();
        fastify.decorate('PongGameRepository', repository);
    },
    { name: 'PongGameRepository' }
);
