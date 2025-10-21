import { FastifyInstance } from 'fastify';
import { Result } from '@shared/abstractions/Result';
import { ICommand } from '@shared/application/abstractions/ICommand.interface';
import { ApplicationError } from '@shared/Errors';
import { ISocialWebSocketService } from '@features/socialSocket/services/ISocialWebSocketService.interface';
import { IGameTypeRepository } from '@shared/infrastructure/repositories/GameTypeRepository';

export interface ISendGameInvitationResponse {
    success: boolean;
}

export interface ISendGameInvitationRequest {
    fromUserId?: number;
    username: string;
    gameType: string;
    message?: string;
}

export default class SendGameInvitationCommand
    implements ICommand<ISendGameInvitationRequest, ISendGameInvitationResponse>
{
    private readonly socialWebSocketService: ISocialWebSocketService;
    private readonly gameTypeRepository: IGameTypeRepository;

    constructor(private readonly fastify: FastifyInstance) {
        this.socialWebSocketService = this.fastify.SocialWebSocketService;
        this.gameTypeRepository = this.fastify.GameTypeRepository;
    }

    validate(request?: ISendGameInvitationRequest | undefined): Result<void> {
        if (!request) {
            return Result.error(ApplicationError.InvalidRequestData);
        }

        if (!request.fromUserId) {
            return Result.error(ApplicationError.UnauthorizedAccess);
        }

        if (!request.username || typeof request.username !== 'string') {
            return Result.error(ApplicationError.InvalidRequestData);
        }

        if (!request.gameType || typeof request.gameType !== 'string') {
            return Result.error(ApplicationError.InvalidRequestData);
        }

        if (request.message && request.message.length > 200) {
            return Result.error(ApplicationError.MessageTooLong);
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

            const { fromUserId, username, gameType, message } = request;

            // Validate game type exists in database
            const gameTypeResult = await this.gameTypeRepository.findByName({ name: gameType });
            if (!gameTypeResult) {
                return Result.error(ApplicationError.InvalidGameType);
            }

            // Validate that the game type supports invitations
            if (!gameTypeResult.supports_invitations) {
                return Result.error(ApplicationError.GameTypeDoesNotSupportInvitations);
            }

            // Get target user's information by username
            const targetUserResult = await this.fastify.UserRepository.getUser({ username });
            if (!targetUserResult.isSuccess || !targetUserResult.value) {
                return Result.error(ApplicationError.UserNotFound);
            }

            const targetUser = targetUserResult.value;

            // Check if user is trying to invite themselves
            if (fromUserId === targetUser.id) {
                return Result.error(ApplicationError.CannotInviteSelf);
            }

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
                fromUserAvatar: sender.avatar || null,
                toUserId: targetUser.id,
                gameType,
                message: message || `${sender.username} te ha invitado a jugar ${gameType}!`,
            });

            if (!invitationResult.isSuccess) {
                return Result.error(invitationResult.error || ApplicationError.InternalServerError);
            }

            return Result.success({
                success: true,
            });
        } catch (error) {
            return this.fastify.handleError<ISendGameInvitationResponse>({
                code: ApplicationError.InternalServerError,
                error,
            });
        }
    }
}
