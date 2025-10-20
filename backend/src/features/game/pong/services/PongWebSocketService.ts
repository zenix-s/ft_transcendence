import { FastifyInstance } from 'fastify';
import { WebSocket } from '@fastify/websocket';
import { Result } from '@shared/abstractions/Result';
import { ApplicationError } from '@shared/Errors';
import { Actions } from '../Pong.types';
import { PongGameService } from './PongGameService';
import { PongPlayerService } from './PongPlayerService';

export interface WebSocketMessage {
    action: Actions;
    gameId?: number;
    token?: string;
    direction?: 'up' | 'down';
}

export interface WebSocketResponse {
    type: string;
    error?: string;
    [key: string]: unknown;
}

export class PongWebSocketService {
    private readonly gameService: PongGameService;
    private readonly playerService: PongPlayerService;

    constructor(private readonly fastify: FastifyInstance) {
        this.gameService = new PongGameService(fastify);
        this.playerService = new PongPlayerService(fastify);
    }

    async authenticateUser(token: string): Promise<Result<number>> {
        try {
            const decoded = (await this.fastify.jwt.verify(token)) as { id?: number };
            if (!decoded.id || typeof decoded.id !== 'number') {
                return Result.error(ApplicationError.InvalidToken);
            }
            return Result.success(decoded.id);
        } catch {
            return Result.error(ApplicationError.InvalidToken);
        }
    }

    async handleRequestState(gameId?: number): Promise<WebSocketResponse> {
        if (!gameId) {
            return {
                type: 'error',
                error: 'missingGameId',
            };
        }

        const stateResult = await this.gameService.getGameState(gameId);
        if (!stateResult.isSuccess) {
            return {
                type: 'error',
                error: stateResult.error,
            };
        }

        return {
            type: 'gameState',
            ...stateResult.value,
        };
    }

    async handleMovePaddle(
        gameId: number | null,
        playerId: number | null,
        direction: 'up' | 'down'
    ): Promise<WebSocketResponse> {
        if (!gameId || !playerId) {
            return {
                type: 'error',
                error: 'noActiveGame',
            };
        }

        const moveResult = await this.playerService.movePaddle(gameId, playerId, direction);
        if (!moveResult.isSuccess) {
            // Si el error es GameNotFound, verificar si el juego existe en el historial
            if (moveResult.error === 'GameNotFound') {
                const stateResult = await this.gameService.getGameState(gameId);
                if (stateResult.error === 'GameAlreadyFinished') {
                    return {
                        type: 'error',
                        error: 'gameAlreadyFinished',
                        message: 'This game has already finished. Movement is not allowed.',
                    };
                }
            }
            return {
                type: 'error',
                error: moveResult.error,
            };
        }

        return {
            type: 'moveConfirmed',
            direction,
            gameId,
        };
    }

    async handleSetPlayerReady(
        gameId: number | null,
        playerId: number | null
    ): Promise<{ response: WebSocketResponse; gameStarted: boolean }> {
        if (!gameId || !playerId) {
            return {
                response: {
                    type: 'error',
                    error: 'noActiveGame',
                },
                gameStarted: false,
            };
        }

        const readyResult = await this.playerService.setPlayerReady(gameId, playerId, true);
        if (!readyResult.isSuccess) {
            // Si el error es GameNotFound, verificar si el juego existe en el historial
            if (readyResult.error === 'GameNotFound') {
                const stateResult = await this.gameService.getGameState(gameId);
                if (stateResult.error === 'GameAlreadyFinished') {
                    return {
                        response: {
                            type: 'error',
                            error: 'gameAlreadyFinished',
                            message: 'This game has already finished. Cannot change ready status.',
                        },
                        gameStarted: false,
                    };
                }
            }
            return {
                response: {
                    type: 'error',
                    error: readyResult.error,
                },
                gameStarted: false,
            };
        }

        const { isReady, gameStarted } = readyResult.value || { isReady: false, gameStarted: false };

        if (gameStarted) {
            this.fastify.log.info(`Game ${gameId} started automatically via repository`);
        }

        return {
            response: {
                type: 'readyConfirmed',
                gameId,
                playerId,
                isReady,
                gameStarted,
                message: gameStarted ? 'Game started!' : 'Ready confirmed, waiting for other player',
            },
            gameStarted,
        };
    }

    sendMessage(socket: WebSocket, response: WebSocketResponse): void {
        try {
            socket.send(JSON.stringify(response));
        } catch (error) {
            this.fastify.log.error(error, 'Failed to send WebSocket message');
        }
    }

    sendError(socket: WebSocket, error: string): void {
        this.sendMessage(socket, {
            type: 'error',
            error,
        });
    }

    sendAuthSuccess(socket: WebSocket, userId: number): void {
        this.sendMessage(socket, {
            type: 'authSuccess',
            userId,
        });
    }

    validateMessage(data: unknown): data is WebSocketMessage {
        if (!data || typeof data !== 'object') {
            this.fastify.log.warn('WebSocket message is not an object');
            return false;
        }

        return true;
    }
}
