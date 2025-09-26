import { Result, ErrorResult } from '@shared/abstractions/Result';
import { IGameRepository } from '../application/repositories/Game.IRepository';
import { PongGame } from '../domain/PongGame';

const gameNotFoundError: ErrorResult = 'GameNotFound';

const gameCreationError: ErrorResult = 'GameCreationError';

export class GameRepository implements IGameRepository {
    private static instance: GameRepository;
    private games: Map<string, PongGame>;
    private gameToMatchMap: Map<string, number>; // Maps game ID to match ID in database

    private constructor() {
        this.games = new Map<string, PongGame>();
        this.gameToMatchMap = new Map<string, number>();
    }

    public static getInstance(): GameRepository {
        if (!GameRepository.instance) {
            GameRepository.instance = new GameRepository();
        }
        return GameRepository.instance;
    }

    public setMatchId(gameId: string, matchId: number): void {
        this.gameToMatchMap.set(gameId, matchId);
    }

    public getMatchId(gameId: string): number | undefined {
        return this.gameToMatchMap.get(gameId);
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
        this.gameToMatchMap.delete(gameId);
        return Result.success(undefined);
    }

    async getAllGames(): Promise<Result<Map<string, PongGame>>> {
        return Result.success(new Map(this.games));
    }

    async exists(gameId: string): Promise<Result<boolean>> {
        return Result.success(this.games.has(gameId));
    }
}
