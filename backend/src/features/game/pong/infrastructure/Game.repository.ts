import { Result, ErrorResult } from '@shared/abstractions/Result';
import { IGameRepository } from '../application/repositories/Game.IRepository';
import { PongGame } from '../domain/PongGame';

const gameNotFoundError: ErrorResult = 'GameNotFound';

const gameCreationError: ErrorResult = 'GameCreationError';

export class GameRepository implements IGameRepository {
    private static instance: GameRepository;
    private games: Map<number, PongGame>;

    private constructor() {
        this.games = new Map<number, PongGame>();
    }

    public static getInstance(): GameRepository {
        if (!GameRepository.instance) {
            GameRepository.instance = new GameRepository();
        }
        return GameRepository.instance;
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
