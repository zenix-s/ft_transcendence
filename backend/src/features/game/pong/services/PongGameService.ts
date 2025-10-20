import { FastifyInstance } from 'fastify';
import { Result } from '@shared/abstractions/Result';
import { PongGame } from '../domain/PongGame';
import { IPongGameRepository } from '../infrastructure/PongGame.repository';
import { ApplicationError } from '@shared/Errors';
import { IMatchRepository } from '@shared/infrastructure/repositories/MatchRepository';

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
    private readonly gameRepository: IPongGameRepository;
    private readonly matchRepository: IMatchRepository;

    constructor(private readonly fastify: FastifyInstance) {
        this.gameRepository = this.fastify.PongGameRepository;
        this.matchRepository = this.fastify.MatchRepository;
    }

    async getGame(gameId: number): Promise<PongGame | null> {
        const gameResult = await this.gameRepository.getGame({ gameId });
        return gameResult.isSuccess && gameResult.value ? gameResult.value : null;
    }

    async updateGame(gameId: number, game: PongGame): Promise<Result<void>> {
        return await this.gameRepository.updateGame({ gameId, game });
    }

    async createGame(game: PongGame, matchId: number): Promise<Result<number>> {
        return await this.gameRepository.createGame({ game, matchId });
    }

    async getGameState(gameId: number): Promise<Result<{ gameId: number; state: GameState }>> {
        const game = await this.getGame(gameId);
        if (!game) {
            // Verificar si el juego existió alguna vez en el historial
            const match = await this.matchRepository.findById({ id: gameId });
            if (match) {
                return Result.error(ApplicationError.GameAlreadyFinished);
            } else {
                return Result.error(ApplicationError.GameNotFound);
            }
        }

        const gameState = game.getGameState();
        return Result.success({
            gameId,
            state: gameState,
        });
    }

    async deleteGame(gameId: number): Promise<Result<void>> {
        return await this.gameRepository.deleteGame({ gameId });
    }

    async gameExists(gameId: number): Promise<boolean> {
        const existsResult = await this.gameRepository.exists({ gameId });
        return existsResult.isSuccess && existsResult.value !== undefined ? existsResult.value : false;
    }
}
