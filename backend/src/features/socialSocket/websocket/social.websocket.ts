import { WebSocket } from '@fastify/websocket';
import { FastifyInstance } from 'fastify';
import { SocialActions, PossibleSocialActions } from '../Social.types';
import { SocialWebSocketService } from '../services';

export default async function socialWebSocketRoutes(fastify: FastifyInstance) {
    const webSocketService = new SocialWebSocketService(fastify);

    fastify.get(
        '/',
        {
            websocket: true,
            schema: {
                description: 'WebSocket endpoint for social features',
                tags: ['Social'],
                security: [{ bearerAuth: [] }],
            },
        },
        (socket: WebSocket) => {
            let currentUserId: number | null = null;
            let isAuthenticated = false;

            socket.on('message', async (message) => {
                try {
                    const data = JSON.parse(message.toString());

                    if (!webSocketService.validateMessage(data)) {
                        webSocketService.sendError(socket, 'invalidFormat');
                        return;
                    }

                    const { action, token } = data;

                    if (!PossibleSocialActions.includes(action)) {
                        webSocketService.sendError(socket, 'unknownAction');
                        return;
                    }

                    // Handle authentication (action 0)
                    if (action === SocialActions.AUTH) {
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

                            webSocketService.addActiveConnection(userId, socket);

                            const connectionResult = await webSocketService.updateUserConnectionStatus(
                                userId,
                                true
                            );
                            if (!connectionResult.isSuccess) {
                                fastify.log.error(
                                    'Failed to update user connection status on authentication'
                                );
                            }

                            await webSocketService.notifyFriendsConnectionStatus(userId, true);

                            webSocketService.sendAuthSuccess(socket, userId);
                        } else {
                            webSocketService.sendError(socket, 'invalidToken');
                            socket.close();
                        }
                        return;
                    }

                    // Check if user is authenticated for other actions
                    if (!isAuthenticated || !currentUserId) {
                        webSocketService.sendError(socket, 'notAuthenticated');
                        return;
                    }

                    // Handle list friends (action 1)
                    if (action === SocialActions.LIST_FRIENDS) {
                        const friendsResult = await webSocketService.getFriendsList(currentUserId);
                        if (!friendsResult.isSuccess || !friendsResult.value) {
                            webSocketService.sendError(socket, 'errorGettingFriends');
                            return;
                        }

                        webSocketService.sendFriendsList(socket, friendsResult.value);
                        return;
                    }

                    webSocketService.sendError(socket, 'unknownAction');
                } catch (error) {
                    fastify.log.error(error, 'WebSocket message processing error');
                    webSocketService.sendError(socket, 'invalidJson');
                }
            });

            socket.on('close', async () => {
                if (currentUserId) {
                    webSocketService.removeActiveConnection(currentUserId);

                    const connectionResult = await webSocketService.updateUserConnectionStatus(
                        currentUserId,
                        false
                    );
                    if (!connectionResult.isSuccess) {
                        fastify.log.error('Failed to update user connection status on disconnect');
                    }

                    await webSocketService.notifyFriendsConnectionStatus(currentUserId, false);
                }

                currentUserId = null;
                isAuthenticated = false;
            });

            socket.on('error', (error) => {
                fastify.log.error(error, 'WebSocket connection error');
            });
        }
    );
}
