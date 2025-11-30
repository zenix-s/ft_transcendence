import { FastifyInstance } from 'fastify';
import { WebSocket } from '@fastify/websocket';
import { Result } from '@shared/abstractions/Result';
import { ApplicationError } from '@shared/Errors';
import {
    SocialWebSocketMessage,
    SocialWebSocketResponse,
    Friend,
    FriendConnectionStatusResponse,
    GameInvitationResponse,
    GameInvitationRejectionResponse,
    GameInvitationAcceptanceResponse,
    FriendProfileUpdateResponse,
} from '../Social.types';
import { ISocialWebSocketService } from './ISocialWebSocketService.interface';
import { IMatchSettings } from '@shared/domain/ValueObjects/MatchSettings.value';

export class SocialWebSocketService implements ISocialWebSocketService {
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
            const userResult = await this.fastify.UserRepository.getUser({ id: userId });
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

    async notifyFriendsProfileUpdate(userId: number): Promise<void> {
        try {
            const userResult = await this.fastify.UserRepository.getUser({ id: userId });
            if (!userResult.isSuccess || !userResult.value) {
                return;
            }

            const user = userResult.value;

            const friendsOfResult = await this.fastify.FriendShipRepository.getFriendsOf({
                userId: user.id,
            });
            if (!friendsOfResult.isSuccess || !friendsOfResult.value) {
                return;
            }

            const friendsOf = friendsOfResult.value;

            for (const friend of friendsOf) {
                const friendSocket = this.activeConnections.get(friend.id);
                if (friendSocket) {
                    const notification: FriendProfileUpdateResponse = {
                        type: 'friendProfileUpdate',
                        friendId: user.id,
                        username: user.username,
                        avatar: user.avatar || null,
                    };
                    this.sendMessage(friendSocket, notification);
                }
            }
        } catch (error) {
            this.fastify.log.error(error, 'Error notifying friends about profile update');
        }
    }

    async sendGameInvitation({
        fromUserId,
        fromUsername,
        fromUserAvatar,
        toUserId,
        gameId,
        gameTypeName,
        message,
        matchSettings,
    }: {
        fromUserId: number;
        fromUsername: string;
        fromUserAvatar: string | null;
        toUserId: number;
        gameId: number;
        gameTypeName: string;
        message: string;
        matchSettings: IMatchSettings;
    }): Promise<Result<void>> {
        try {
            const targetSocket = this.activeConnections.get(toUserId);

            if (!targetSocket) {
                return Result.error(ApplicationError.UserNotConnected);
            }

            const gameInvitationResponse: GameInvitationResponse = {
                type: 'gameInvitation',
                success: true,
                fromUserId,
                fromUsername,
                fromUserAvatar,
                gameId,
                gameTypeName,
                message,
                matchSettings,
            };

            this.sendMessage(targetSocket, gameInvitationResponse);

            this.fastify.log.info(`Game invitation sent to user ${toUserId} from user ${fromUserId}`);
            return Result.success(undefined);
        } catch (error) {
            this.fastify.log.error(error, 'Error sending game invitation');
            return Result.error(ApplicationError.InternalServerError);
        }
    }

    async sendGameInvitationRejection({
        fromUserId,
        fromUsername,
        fromUserAvatar,
        toUserId,
        gameId,
        gameTypeName,
        message,
    }: {
        fromUserId: number;
        fromUsername: string;
        fromUserAvatar: string | null;
        toUserId: number;
        gameId: number;
        gameTypeName: string;
        message: string;
    }): Promise<Result<void>> {
        try {
            const targetSocket = this.activeConnections.get(toUserId);

            if (!targetSocket) {
                return Result.error(ApplicationError.UserNotConnected);
            }

            const gameInvitationRejectionResponse: GameInvitationRejectionResponse = {
                type: 'gameInvitationRejection',
                success: true,
                fromUserId,
                fromUsername,
                fromUserAvatar,
                gameId,
                gameTypeName,
                message,
            };

            this.sendMessage(targetSocket, gameInvitationRejectionResponse);

            this.fastify.log.info(
                `Game invitation rejection sent to user ${toUserId} from user ${fromUserId}`
            );
            return Result.success(undefined);
        } catch (error) {
            this.fastify.log.error(error, 'Error sending game invitation rejection');
            return Result.error(ApplicationError.InternalServerError);
        }
    }

    async sendGameInvitationAcceptance({
        fromUserId,
        fromUsername,
        fromUserAvatar,
        toUserId,
        gameId,
        gameTypeName,
        message,
    }: {
        fromUserId: number;
        fromUsername: string;
        fromUserAvatar: string | null;
        toUserId: number;
        gameId: number;
        gameTypeName: string;
        message: string;
    }): Promise<Result<void>> {
        try {
            const targetSocket = this.activeConnections.get(toUserId);

            if (!targetSocket) {
                return Result.error(ApplicationError.UserNotConnected);
            }

            const gameInvitationAcceptanceResponse: GameInvitationAcceptanceResponse = {
                type: 'gameInvitationAcceptance',
                success: true,
                fromUserId,
                fromUsername,
                fromUserAvatar,
                gameId,
                gameTypeName,
                message,
            };

            this.sendMessage(targetSocket, gameInvitationAcceptanceResponse);

            this.fastify.log.info(
                `Game invitation acceptance sent to user ${toUserId} from user ${fromUserId}`
            );
            return Result.success(undefined);
        } catch (error) {
            this.fastify.log.error(error, 'Error sending game invitation acceptance');
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
