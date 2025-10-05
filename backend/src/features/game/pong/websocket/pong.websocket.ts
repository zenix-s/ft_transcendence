import { WebSocket } from '@fastify/websocket';
import { FastifyInstance } from 'fastify';
import { GameRepository } from '../infrastructure/Game.repository';
import { PossibleActions, Actions } from '../Pong.types';
import {
    WS_ERRORS,
    handleRequestState,
    handleMoverPaddle,
    handleSetReady,
} from '../application/websocket-handlers/gameActions.handlers';
import SaveMatchHistoryCommand from '../application/mediators/SaveMatchHistory.command';

interface WebSocketMessage {
    action: Actions;
    gameId?: number;
    token?: string;
}

function validateWebSocketMessage(data: unknown): data is WebSocketMessage {
    if (!data || typeof data !== 'object') return false;
    const obj = data as Record<string, unknown>;
    if (!PossibleActions.includes(obj.action as Actions)) return false;
    if (obj.gameId !== undefined && typeof obj.gameId !== 'number') return false;
    return true;
}

const gameLoops = new Map<number, NodeJS.Timeout>();

function startGameLoop(gameId: number, fastify: FastifyInstance) {
    const repository = GameRepository.getInstance();
    const existingLoop = gameLoops.get(gameId);
    if (existingLoop) {
        clearInterval(existingLoop);
    }

    const loop = setInterval(async () => {
        const gameResult = await repository.getGame(gameId);
        if (!gameResult.isSuccess) {
            clearInterval(loop);
            gameLoops.delete(gameId);
            return;
        }

        const game = gameResult.value;
        if (!game) {
            clearInterval(loop);
            gameLoops.delete(gameId);
            return;
        }

        if (!game.isGameRunning() || game.isGameOver()) {
            clearInterval(loop);
            gameLoops.delete(gameId);

            if (game.isGameOver()) {
                try {
                    const saveCommand = new SaveMatchHistoryCommand(fastify);
                    await saveCommand.execute({ gameId });
                } catch (error) {
                    fastify.log.error(error, 'Failed to save match history');
                }
            }
            return;
        }

        game.update();
        await repository.updateGame(gameId, game);

        if (game.isGameOver()) {
            clearInterval(loop);
            gameLoops.delete(gameId);

            try {
                const saveCommand = new SaveMatchHistoryCommand(fastify);
                await saveCommand.execute({ gameId });
            } catch (error) {
                fastify.log.error(error, 'Failed to save match history');
            }
        }
    }, 16);

    gameLoops.set(gameId, loop);
}

export default async function pongWebSocketRoutes(fastify: FastifyInstance) {
    fastify.get(
        '/',
        {
            websocket: true,
            schema: {
                description: 'WebSocket endpoint for real-time Pong game actions',
                tags: ['Game'],
                security: [{ bearerAuth: [] }],
            },
        },
        (socket: WebSocket) => {
            let currentGameId: number | null = null;
            let currentUserId: number | null = null;
            let isAuthenticated = false;

            socket.on('message', async (message) => {
                try {
                    const data = JSON.parse(message.toString());

                    if (!validateWebSocketMessage(data)) {
                        socket.send(JSON.stringify({ error: WS_ERRORS.INVALID_FORMAT }));
                        return;
                    }

                    const { action, gameId, token } = data;

                    if (action === Actions.AUTH) {
                        if (!token) {
                            socket.send(JSON.stringify({ error: WS_ERRORS.MISSING_TOKEN }));
                            return;
                        }

                        try {
                            const decoded = (await fastify.jwt.verify(token)) as { id?: number };
                            isAuthenticated = true;
                            currentUserId = decoded.id || null;
                            socket.send(
                                JSON.stringify({
                                    type: 'authSuccess',
                                    userId: currentUserId,
                                })
                            );
                        } catch {
                            socket.send(JSON.stringify({ error: WS_ERRORS.INVALID_TOKEN }));
                            socket.close();
                        }
                        return;
                    }

                    if (!isAuthenticated) {
                        socket.send(JSON.stringify({ error: WS_ERRORS.NOT_AUTHENTICATED }));
                        return;
                    }

                    switch (action) {
                        case Actions.REQUEST_STATE: {
                            const response = await handleRequestState(gameId);
                            socket.send(response);

                            if (gameId && !response.includes('error')) {
                                currentGameId = gameId;
                            }
                            break;
                        }

                        case Actions.MOVE_UP:
                        case Actions.MOVE_DOWN: {
                            const direction = action === Actions.MOVE_UP ? 'up' : 'down';
                            const response = await handleMoverPaddle(direction, currentGameId, currentUserId);
                            socket.send(response);
                            break;
                        }

                        case Actions.SET_READY: {
                            const { response, gameStarted } = await handleSetReady(
                                currentGameId,
                                currentUserId,
                                fastify
                            );
                            socket.send(response);

                            if (gameStarted && currentGameId) {
                                startGameLoop(currentGameId, fastify);
                            }
                            break;
                        }

                        default:
                            socket.send(JSON.stringify({ error: WS_ERRORS.UNKNOWN_ACTION }));
                    }
                } catch {
                    socket.send(JSON.stringify({ error: WS_ERRORS.INVALID_JSON }));
                }
            });

            socket.on('close', () => {
                currentGameId = null;
                currentUserId = null;
                isAuthenticated = false;
            });
        }
    );
}

process.on('SIGINT', () => {
    gameLoops.forEach((loop) => clearInterval(loop));
    gameLoops.clear();
});

process.on('SIGTERM', () => {
    gameLoops.forEach((loop) => clearInterval(loop));
    gameLoops.clear();
});
