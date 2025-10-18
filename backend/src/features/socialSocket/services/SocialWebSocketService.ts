import { FastifyInstance } from 'fastify';
import { WebSocket } from '@fastify/websocket';
import { Result } from '@shared/abstractions/Result';
import { ApplicationError } from '@shared/Errors';
import {
    SocialWebSocketMessage,
    SocialWebSocketResponse,
    Friend,
    FriendConnectionStatusResponse,
} from '../Social.types';

export class SocialWebSocketService {
    private activeConnections: Map<number, WebSocket> = new Map<number, WebSocket>();

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

    async getFriendsList(userId: number): Promise<Result<Friend[]>> {
        try {
            // Get friends with their user data
            const friendsResult = await this.fastify.FriendShipRepository.getFriends({ userId });
            if (!friendsResult.isSuccess) {
                return Result.error(ApplicationError.NotFoundError);
            }

            const users = friendsResult.value;
            if (!users || users.length === 0) {
                return Result.success([]);
            }

            // Transform User entities to Friend objects
            const friends: Friend[] = users.map((user) => ({
                id: user.id,
                username: user.username,
                avatar: user.avatar || null,
                is_connected: user.is_connected || false,
            }));

            return Result.success(friends);
        } catch (error) {
            this.fastify.log.error(error, 'Error getting friends list');
            return Result.error(ApplicationError.InternalServerError);
        }
    }

    async updateUserConnectionStatus(userId: number, isConnected: boolean): Promise<Result<void>> {
        try {
            const updateResult = await this.fastify.UserRepository.updateConnectionStatus({
                userId,
                isConnected,
            });
            if (!updateResult.isSuccess) {
                return Result.error(ApplicationError.InternalServerError);
            }
            return Result.success(undefined);
        } catch (error) {
            this.fastify.log.error(error, 'Error updating user connection status');
            return Result.error(ApplicationError.InternalServerError);
        }
    }

    addActiveConnection(userId: number, socket: WebSocket): void {
        this.activeConnections.set(userId, socket);
    }

    removeActiveConnection(userId: number): void {
        this.activeConnections.delete(userId);
    }

    async notifyFriendsConnectionStatus(userId: number, isConnected: boolean): Promise<void> {
        try {
            const userResult = await this.fastify.UserRepository.getUserById({ id: userId });
            if (!userResult.isSuccess || !userResult.value) {
                return;
            }

            const user = userResult.value;

            const friendsOfResult = await this.fastify.FriendShipRepository.getFriendsOf({ userId });
            if (!friendsOfResult.isSuccess || !friendsOfResult.value) {
                return;
            }

            const friendsOf = friendsOfResult.value;

            for (const friend of friendsOf) {
                const friendSocket = this.activeConnections.get(friend.id);
                if (friendSocket) {
                    const notification: FriendConnectionStatusResponse = {
                        type: 'friendConnectionStatus',
                        friendId: userId,
                        username: user.username,
                        isConnected: isConnected,
                    };
                    this.sendMessage(friendSocket, notification);
                }
            }
        } catch (error) {
            this.fastify.log.error(error, 'Error notifying friends about connection status');
        }
    }

    sendMessage(socket: WebSocket, response: SocialWebSocketResponse): void {
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

    sendFriendsList(socket: WebSocket, friends: Friend[]): void {
        this.sendMessage(socket, {
            type: 'friendsList',
            friends,
        });
    }

    sendFriendConnectionStatus(
        socket: WebSocket,
        friendId: number,
        username: string,
        isConnected: boolean
    ): void {
        this.sendMessage(socket, {
            type: 'friendConnectionStatus',
            friendId,
            username,
            isConnected,
        });
    }

    validateMessage(data: unknown): data is SocialWebSocketMessage {
        if (!data || typeof data !== 'object') {
            this.fastify.log.warn('WebSocket message is not an object');
            return false;
        }

        const message = data as Record<string, unknown>;

        if (!('action' in message) || typeof message.action !== 'number') {
            this.fastify.log.warn('WebSocket message missing action or action is not a number');
            return false;
        }

        return true;
    }
}
