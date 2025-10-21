import { FastifyInstance } from 'fastify';
import { Result } from '@shared/abstractions/Result';
import { ICommand } from '@shared/application/abstractions/ICommand.interface';
import { ApplicationError } from '@shared/Errors';
import { SocialWebSocketService } from '@features/socialSocket/services/SocialWebSocketService';

export interface ISendGameInvitationResponse {
    message: string;
    toUserId: number;
    toUsername: string;
}

export interface ISendGameInvitationRequest {
    fromUserId?: number;
    friendId: number;
    gameType: string;
    message?: string;
}

export default class SendGameInvitationCommand
    implements ICommand<ISendGameInvitationRequest, ISendGameInvitationResponse>
{
    private readonly socialWebSocketService: SocialWebSocketService;

    constructor(private readonly fastify: FastifyInstance) {
        this.socialWebSocketService = new SocialWebSocketService(this.fastify);
    }

    validate(request?: ISendGameInvitationRequest | undefined): Result<void> {
        if (!request) {
            return Result.error(ApplicationError.InvalidRequestData);
        }

        if (!request.fromUserId) {
            return Result.error(ApplicationError.UnauthorizedAccess);
        }

        if (!request.friendId || typeof request.friendId !== 'number') {
            return Result.error(ApplicationError.InvalidRequestData);
        }

        if (!request.gameType || typeof request.gameType !== 'string') {
            return Result.error(ApplicationError.InvalidRequestData);
        }

        if (request.gameType !== 'pong') {
            return Result.error(ApplicationError.InvalidGameType);
        }

        if (request.message && request.message.length > 200) {
            return Result.error(ApplicationError.MessageTooLong);
        }

        if (request.fromUserId === request.friendId) {
            return Result.error(ApplicationError.CannotInviteSelf);
        }

        return Result.success(undefined);
    }

    async execute(
        request?: ISendGameInvitationRequest | undefined
    ): Promise<Result<ISendGameInvitationResponse>> {
        try {
            if (!request) {
                return Result.error(ApplicationError.InvalidRequestData);
            }

            const { fromUserId, friendId, gameType, message } = request;

            // Verify that the friend exists and is actually a friend
            const friendshipResult = await this.fastify.FriendShipRepository.areFriends({
                userId1: fromUserId as number,
                userId2: friendId,
            });

            if (!friendshipResult.isSuccess || !friendshipResult.value) {
                return Result.error(ApplicationError.FriendshipNotFound);
            }

            // Get friend's information
            const friendResult = await this.fastify.UserRepository.getUser({ id: friendId });
            if (!friendResult.isSuccess || !friendResult.value) {
                return Result.error(ApplicationError.UserNotFound);
            }

            const friend = friendResult.value;

            // Get sender's information
            const senderResult = await this.fastify.UserRepository.getUser({ id: fromUserId as number });
            if (!senderResult.isSuccess || !senderResult.value) {
                return Result.error(ApplicationError.UserNotFound);
            }

            const sender = senderResult.value;

            // Send notification through WebSocket if friend is connected
            const notificationSent = await this.socialWebSocketService.sendGameInvitation({
                fromUserId: fromUserId as number,
                fromUsername: sender.username,
                toUserId: friendId,
                gameType,
                message: message || `${sender.username} te ha invitado a jugar ${gameType}!`,
            });

            const responseMessage = notificationSent
                ? `Invitación enviada a ${friend.username}`
                : `Invitación enviada a ${friend.username} (usuario no conectado)`;

            return Result.success({
                message: responseMessage,
                toUserId: friendId,
                toUsername: friend.username,
            });
        } catch (error) {
            return this.fastify.handleError<ISendGameInvitationResponse>({
                code: ApplicationError.InternalServerError,
                error,
            });
        }
    }
}
