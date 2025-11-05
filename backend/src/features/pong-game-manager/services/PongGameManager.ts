import { FastifyInstance } from 'fastify';
import { Result } from '@shared/abstractions/Result';
import { PongGame } from '../domain/PongGame';
import { ActivePongGame } from './ActivePongGame';
import { ApplicationError } from '@shared/Errors';
import { IPongGameManager } from './IPongGameManager.interface';
import { GameState } from '../Pong.types';

export class PongGameManager implements IPongGameManager {
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
                code: ApplicationError.InternalServerError,
                error,
            });
        }
    }

    getGame(gameId: number): Result<PongGame> {
        const activeGame = this.activeGames.get(gameId);
        if (!activeGame) {
            return Result.error(ApplicationError.GameNotFound);
        }
        return Result.success(activeGame.game);
    }

    movePaddle(gameId: number, playerId: number, direction: 'up' | 'down'): Result<void> {
        const activeGame = this.activeGames.get(gameId);
        if (!activeGame) {
            return Result.error(ApplicationError.GameNotFound);
        }

        const moved = activeGame.game.movePlayer(playerId, direction);
        if (!moved) {
            return Result.error(ApplicationError.PlayerNotInGame);
        }

        activeGame.updateLastActivity();
        return Result.success(undefined);
    }

    setPlayerReady(gameId: number, playerId: number, isReady: boolean): Result<{ gameStarted: boolean }> {
        const activeGame = this.activeGames.get(gameId);
        if (!activeGame) {
            return Result.error(ApplicationError.GameNotFound);
        }

        const success = activeGame.game.setPlayerReady(playerId, isReady);
        if (!success) {
            return Result.error(ApplicationError.PlayerNotInGame);
        }

        activeGame.updateLastActivity();
        const gameStarted = activeGame.game.isGameRunning();
        return Result.success({ gameStarted });
    }

    async addPlayerToGame(gameId: number, playerId: number): Promise<Result<void>> {
        const activeGame = this.activeGames.get(gameId);
        if (!activeGame) {
            return Result.error(ApplicationError.GameNotFound);
        }

        // Obtener los datos del usuario
        const userResult = await this.fastify.UserRepository.getUser({ id: playerId });
        if (!userResult.isSuccess || !userResult.value) {
            return Result.error(userResult.error || ApplicationError.UserNotFound);
        }

        const added = activeGame.game.addPlayer(playerId, userResult.value);
        if (!added) {
            return Result.error(ApplicationError.GameFull);
        }

        activeGame.updateLastActivity();
        return Result.success(undefined);
    }

    getGameState(gameId: number): Result<{ gameId: number; state: GameState }> {
        const gameResult = this.getGame(gameId);
        if (!gameResult.isSuccess) {
            return Result.error(gameResult.error || ApplicationError.GameNotFound);
        }
        if (!gameResult.value) {
            return Result.error(ApplicationError.GameNotFound);
        }
        return Result.success({
            gameId,
            state: gameResult.value.getGameState(),
        });
    }

    deleteGame(gameId: number): Result<void> {
        const activeGame = this.activeGames.get(gameId);
        if (!activeGame) {
            return Result.error(ApplicationError.GameNotFound);
        }
        activeGame.stop();
        this.activeGames.delete(gameId);
        return Result.success(undefined);
    }

    gameExists(gameId: number): Result<boolean> {
        return Result.success(this.activeGames.has(gameId));
    }

    getAllGames(): Result<Map<number, PongGame>> {
        const games = new Map<number, PongGame>();
        this.activeGames.forEach((activeGame, gameId) => {
            games.set(gameId, activeGame.game);
        });
        return Result.success(games);
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

    getActiveGameCount(): Result<number> {
        return Result.success(this.activeGames.size);
    }

    getActiveGameIds(): Result<number[]> {
        return Result.success(Array.from(this.activeGames.keys()));
    }
}
