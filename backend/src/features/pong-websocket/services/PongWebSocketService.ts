import { FastifyInstance } from 'fastify';
import { WebSocket } from '@fastify/websocket';
import { Result } from '@shared/abstractions/Result';
import { ApplicationError } from '@shared/Errors';
import { Actions } from '../../pong-game-manager/Pong.types';
import { IPongService } from './IPongService.interface';

export interface WebSocketMessage {
    action: Actions;
    gameId?: number;
    token?: string;
    settings?: {
        winnerScore?: number;
        maxGameTime?: number;
        difficulty?: number;
    };
}

export interface WebSocketResponse {
    type: string;
    error?: string;
    [key: string]: unknown;
}

export class PongWebSocketService implements IPongService {
    constructor(private readonly fastify: FastifyInstance) {}

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
                error: ApplicationError.BadRequest,
            };
        }

        const gameStateResult = this.fastify.PongGameManager.getGameState(gameId);
        if (!gameStateResult.isSuccess) {
            const gameHistoryStatus = await this.fastify.MatchRepository.findById({ id: gameId });
            if (gameHistoryStatus != null && gameHistoryStatus.isCompleted()) {
                return {
                    type: 'error',
                    error: ApplicationError.GameAlreadyFinished,
                };
            }

            return {
                type: 'error',
                error: gameStateResult.error,
            };
        }

        return {
            type: 'gameState',
            ...gameStateResult.value,
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
                error: ApplicationError.GameNotFound,
            };
        }

        const moveResult = this.fastify.PongGameManager.movePaddle(gameId, playerId, direction);
        if (!moveResult.isSuccess) {
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
                    error: ApplicationError.GameNotFound,
                },
                gameStarted: false,
            };
        }

        const readyResult = this.fastify.PongGameManager.setPlayerReady(gameId, playerId, true);
        if (!readyResult.isSuccess) {
            return {
                response: {
                    type: 'error',
                    error: readyResult.error,
                },
                gameStarted: false,
            };
        }

        const gameStarted = readyResult.value ? readyResult.value.gameStarted : false;

        if (gameStarted) {
            this.fastify.log.info(`Game ${gameId} started automatically via repository`);
        }

        return {
            response: {
                type: 'readyConfirmed',
                gameId,
                playerId,
                isReady: true,
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

    async handleModifySettings(
        gameId: number | null,
        playerId: number | null,
        settings: { winnerScore?: number; maxGameTime?: number; difficulty?: number }
    ): Promise<WebSocketResponse> {
        if (!gameId || !playerId) {
            return {
                type: 'error',
                error: ApplicationError.GameNotFound,
            };
        }

        const modifyResult = this.fastify.PongGameManager.modifyGameSettings(gameId, playerId, settings);
        if (!modifyResult.isSuccess) {
            return {
                type: 'error',
                error: modifyResult.error,
            };
        }

        return {
            type: 'settingsModified',
            gameId,
            settings,
            message: 'Game settings updated successfully',
        };
    }

    async handleLeaveGame(gameId: number | null, playerId: number | null): Promise<WebSocketResponse> {
        if (!gameId || !playerId) {
            return {
                type: 'error',
                error: ApplicationError.GameNotFound,
            };
        }

        const leaveResult = await this.fastify.PongGameManager.leaveGame(gameId, playerId);
        if (!leaveResult.isSuccess) {
            return {
                type: 'error',
                error: leaveResult.error,
            };
        }

        return {
            type: 'playerLeft',
            gameId,
            playerId,
            message: 'Player left the game',
        };
    }

    validateMessage(data: unknown): data is WebSocketMessage {
        if (!data || typeof data !== 'object') {
            this.fastify.log.warn('WebSocket message is not an object');
            return false;
        }

        return true;
    }
}
