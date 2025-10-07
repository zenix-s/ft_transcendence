import { FastifyInstance } from 'fastify';
import { Result } from '@shared/abstractions/Result';
import { PongGame } from '../domain/PongGame';
import { ActivePongGame } from './ActivePongGame';

export class PongGameManager {
    private activeGames = new Map<number, ActivePongGame>();

    constructor(private readonly fastify: FastifyInstance) {
        this.setupProcessHandlers();
    }

    async createGame(gameId: number, matchId: number, game: PongGame): Promise<Result<void>> {
        try {
            this.deleteGame(gameId);

            const activeGame = new ActivePongGame(gameId, matchId, game, this.fastify, (id: number) =>
                this.onGameEnd(id)
            );

            activeGame.start();
            this.activeGames.set(gameId, activeGame);

            return Result.success(undefined);
        } catch (error) {
            return this.fastify.handleError({
                code: '500',
                error,
            });
        }
    }

    getGame(gameId: number): PongGame | null {
        const activeGame = this.activeGames.get(gameId);
        return activeGame ? activeGame.game : null;
    }

    updateGame(gameId: number, game: PongGame): void {
        const activeGame = this.activeGames.get(gameId);
        if (activeGame) {
            activeGame.updateGame(game);
        }
    }

    deleteGame(gameId: number): void {
        const activeGame = this.activeGames.get(gameId);
        if (activeGame) {
            activeGame.stop();
            this.activeGames.delete(gameId);
        }
    }

    gameExists(gameId: number): boolean {
        return this.activeGames.has(gameId);
    }

    getAllGames(): Map<number, PongGame> {
        const games = new Map<number, PongGame>();
        this.activeGames.forEach((activeGame, gameId) => {
            games.set(gameId, activeGame.game);
        });
        return games;
    }

    private onGameEnd(gameId: number): void {
        this.activeGames.delete(gameId);
    }

    private setupProcessHandlers(): void {
        const cleanup = () => {
            this.activeGames.forEach((activeGame) => {
                activeGame.stop();
            });
            this.activeGames.clear();
        };

        process.on('SIGINT', cleanup);
        process.on('SIGTERM', cleanup);
    }

    getActiveGameCount(): number {
        return this.activeGames.size;
    }

    getActiveGameIds(): number[] {
        return Array.from(this.activeGames.keys());
    }
}
