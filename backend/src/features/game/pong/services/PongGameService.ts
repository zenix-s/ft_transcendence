import { FastifyInstance } from 'fastify';
import { Result } from '@shared/abstractions/Result';
import { PongGame } from '../domain/PongGame';
import { PongGameManager } from './PongGameManager';

interface GameState {
    isRunning: boolean;
    gameTimer: number;
    player1: {
        id: string;
        position: number;
        score: number;
        isReady: boolean;
    } | null;
    player2: {
        id: string;
        position: number;
        score: number;
        isReady: boolean;
    } | null;
    ball: {
        position: { x: number; y: number };
        velocity: { x: number; y: number };
    };
    arePlayersReady: boolean;
    gameRules: {
        winnerScore: number;
        maxGameTime: number | undefined;
    };
    isGameOver: boolean;
    winner: string | null;
    isSinglePlayer: boolean;
}

export class PongGameService {
    private gameManager: PongGameManager;

    constructor(private readonly fastify: FastifyInstance) {
        this.gameManager = new PongGameManager(fastify);
    }

    getGame(gameId: number): PongGame | null {
        return this.gameManager.getGame(gameId);
    }

    updateGame(gameId: number, game: PongGame): void {
        this.gameManager.updateGame(gameId, game);
    }

    async createGame(game: PongGame, matchId: number): Promise<Result<number>> {
        const createResult = await this.gameManager.createGame(matchId, matchId, game);
        if (!createResult.isSuccess) {
            return Result.error('gameCreationError');
        }
        return Result.success(matchId);
    }

    getGameState(gameId: number): Result<{ gameId: number; state: GameState }> {
        const game = this.getGame(gameId);
        if (!game) {
            return Result.error('gameNotFound');
        }

        const gameState = game.getGameState();
        return Result.success({
            gameId,
            state: gameState,
        });
    }

    deleteGame(gameId: number): void {
        this.gameManager.deleteGame(gameId);
    }

    gameExists(gameId: number): boolean {
        return this.gameManager.gameExists(gameId);
    }
}
