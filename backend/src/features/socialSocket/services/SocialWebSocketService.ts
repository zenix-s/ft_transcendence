import { FastifyInstance } from 'fastify';
import { WebSocket } from '@fastify/websocket';
import { Result } from '@shared/abstractions/Result';
import { ApplicationError } from '@shared/Errors';
import { SocialWebSocketMessage, SocialWebSocketResponse, Friend } from '../Social.types';

export class SocialWebSocketService {
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
            const friendsResult = await this.fastify.FriendShipRepository.getFriends(userId);
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
            }));

            return Result.success(friends);
        } catch (error) {
            this.fastify.log.error(error, 'Error getting friends list');
            return Result.error(ApplicationError.InternalServerError);
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
