import { Result, ErrorResult } from '@shared/abstractions/Result';
import { IGameRepository } from '../application/repositories/Game.IRepository';
import { PongGame } from '../domain/PongGame';

const gameNotFoundError: ErrorResult = 'GameNotFound';

const gameCreationError: ErrorResult = 'GameCreationError';

export class GameRepository implements IGameRepository {
    private games: Map<string, PongGame>;

    constructor() {
        this.games = new Map<string, PongGame>();
    }

    async createGame(game: PongGame): Promise<Result<string>> {
        try {
            const gameId = crypto.randomUUID();
            this.games.set(gameId, game);
            return Result.success(gameId);
        } catch {
            return Result.error(gameCreationError);
        }
    }

    async getGame(gameId: string): Promise<Result<PongGame>> {
        const game = this.games.get(gameId);
        if (!game) {
            return Result.error(gameNotFoundError);
        }
        return Result.success(game);
    }

    async updateGame(gameId: string, game: PongGame): Promise<Result<void>> {
        if (!this.games.has(gameId)) {
            return Result.error(gameNotFoundError);
        }
        this.games.set(gameId, game);
        return Result.success(undefined);
    }

    async deleteGame(gameId: string): Promise<Result<void>> {
        if (!this.games.has(gameId)) {
            return Result.error(gameNotFoundError);
        }
        this.games.delete(gameId);
        return Result.success(undefined);
    }

    async getAllGames(): Promise<Result<Map<string, PongGame>>> {
        return Result.success(new Map(this.games));
    }

    async exists(gameId: string): Promise<Result<boolean>> {
        return Result.success(this.games.has(gameId));
    }
}
