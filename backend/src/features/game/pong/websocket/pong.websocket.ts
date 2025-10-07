import { WebSocket } from '@fastify/websocket';
import { FastifyInstance } from 'fastify';
import { Actions, PossibleActions } from '../Pong.types';
import { PongWebSocketService, WebSocketMessage } from '../services';

export default async function pongWebSocketRoutes(fastify: FastifyInstance) {
    const webSocketService = new PongWebSocketService(fastify);

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

                    if (!webSocketService.validateMessage(data)) {
                        webSocketService.sendError(socket, 'invalidFormat');
                        return;
                    }

                    const { action, gameId, token } = data as WebSocketMessage;

                    if (!PossibleActions.includes(action)) {
                        webSocketService.sendError(socket, 'unknownAction');
                        return;
                    }

                    if (action === Actions.AUTH) {
                        if (!token) {
                            webSocketService.sendError(socket, 'missingToken');
                            return;
                        }

                        const authResult = await webSocketService.authenticateUser(token);
                        if (!authResult.isSuccess) {
                            webSocketService.sendError(socket, 'invalidToken');
                            socket.close();
                            return;
                        }

                        const userId = authResult.value;
                        if (typeof userId === 'number') {
                            isAuthenticated = true;
                            currentUserId = userId;
                            webSocketService.sendAuthSuccess(socket, userId);
                        } else {
                            webSocketService.sendError(socket, 'invalidToken');
                            socket.close();
                        }
                        return;
                    }

                    if (!isAuthenticated) {
                        webSocketService.sendError(socket, 'notAuthenticated');
                        return;
                    }

                    switch (action) {
                        case Actions.REQUEST_STATE: {
                            const response = await webSocketService.handleRequestState(gameId);
                            webSocketService.sendMessage(socket, response);

                            if (gameId && response.type !== 'error') {
                                currentGameId = gameId;
                            }
                            break;
                        }

                        case Actions.MOVE_UP:
                        case Actions.MOVE_DOWN: {
                            const direction = action === Actions.MOVE_UP ? 'up' : 'down';
                            const response = await webSocketService.handleMovePaddle(
                                currentGameId,
                                currentUserId,
                                direction
                            );
                            webSocketService.sendMessage(socket, response);
                            break;
                        }

                        case Actions.SET_READY: {
                            const { response } = await webSocketService.handleSetPlayerReady(
                                currentGameId,
                                currentUserId
                            );
                            webSocketService.sendMessage(socket, response);
                            break;
                        }

                        default:
                            webSocketService.sendError(socket, 'unknownAction');
                    }
                } catch (error) {
                    fastify.log.error(error, 'WebSocket message processing error');
                    webSocketService.sendError(socket, 'invalidJson');
                }
            });

            socket.on('close', () => {
                currentGameId = null;
                currentUserId = null;
                isAuthenticated = false;
            });

            socket.on('error', (error) => {
                fastify.log.error(error, 'WebSocket connection error');
            });
        }
    );
}
