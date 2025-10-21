import { FastifyInstance } from 'fastify';
import { Result } from '@shared/abstractions/Result';
import { ICommand } from '@shared/application/abstractions/ICommand.interface';
import { ApplicationError } from '@shared/Errors';
import { ISocialWebSocketService } from '@features/socialSocket/services/ISocialWebSocketService.interface';

export interface ISendGameInvitationResponse {
    message: string;
    toUserId: number;
    toUsername: string;
}

export interface ISendGameInvitationRequest {
    fromUserId?: number;
    toUserId: number;
    gameType: string;
    message?: string;
}

export default class SendGameInvitationCommand
    implements ICommand<ISendGameInvitationRequest, ISendGameInvitationResponse>
{
    private readonly socialWebSocketService: ISocialWebSocketService;

    constructor(private readonly fastify: FastifyInstance) {
        this.socialWebSocketService = this.fastify.SocialWebSocketService;
    }

    validate(request?: ISendGameInvitationRequest | undefined): Result<void> {
        if (!request) {
            return Result.error(ApplicationError.InvalidRequestData);
        }

        if (!request.fromUserId) {
            return Result.error(ApplicationError.UnauthorizedAccess);
        }

        if (!request.toUserId || typeof request.toUserId !== 'number') {
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

        if (request.fromUserId === request.toUserId) {
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

            const { fromUserId, toUserId, gameType, message } = request;

            // Get target user's information
            const targetUserResult = await this.fastify.UserRepository.getUser({ id: toUserId });
            if (!targetUserResult.isSuccess || !targetUserResult.value) {
                return Result.error(ApplicationError.UserNotFound);
            }

            const targetUser = targetUserResult.value;

            // Get sender's information
            const senderResult = await this.fastify.UserRepository.getUser({ id: fromUserId as number });
            if (!senderResult.isSuccess || !senderResult.value) {
                return Result.error(ApplicationError.UserNotFound);
            }

            const sender = senderResult.value;

            // Send notification through WebSocket
            const invitationResult = await this.socialWebSocketService.sendGameInvitation({
                fromUserId: fromUserId as number,
                fromUsername: sender.username,
                toUserId: toUserId,
                gameType,
                message: message || `${sender.username} te ha invitado a jugar ${gameType}!`,
            });

            if (!invitationResult.isSuccess) {
                return Result.error(invitationResult.error || ApplicationError.InternalServerError);
            }

            return Result.success({
                message: `Invitación enviada a ${targetUser.username}`,
                toUserId: toUserId,
                toUsername: targetUser.username,
            });
        } catch (error) {
            return this.fastify.handleError<ISendGameInvitationResponse>({
                code: ApplicationError.InternalServerError,
                error,
            });
        }
    }
}
