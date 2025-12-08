import { FastifyInstance } from 'fastify';
import { Result } from '@shared/abstractions/Result';
import { ICommand } from '@shared/application/abstractions/ICommand.interface';
import { ApplicationError } from '@shared/Errors';
import { ISocialWebSocketService } from '@features/socialSocket/services/ISocialWebSocketService.interface';
import { IMatchRepository } from '@shared/infrastructure/repositories/MatchRepository';
import MatchType from '@shared/domain/ValueObjects/MatchType.value';

export interface IRejectGameInvitationResponse {
    success: boolean;
    message?: string;
}

export interface IRejectGameInvitationRequest {
    userId?: number;
    gameId: number;
}

export default class RejectGameInvitationCommand implements ICommand<
    IRejectGameInvitationRequest,
    IRejectGameInvitationResponse
> {
    private readonly socialWebSocketService: ISocialWebSocketService;
    private readonly matchRepository: IMatchRepository;

    constructor(private readonly fastify: FastifyInstance) {
        this.socialWebSocketService = this.fastify.SocialWebSocketService;
        this.matchRepository = this.fastify.MatchRepository;
    }

    validate(request?: IRejectGameInvitationRequest | undefined): Result<void> {
        if (!request) {
            return Result.error(ApplicationError.InvalidRequestData);
        }

        if (!request.userId) {
            return Result.error(ApplicationError.UnauthorizedAccess);
        }

        if (!request.gameId || typeof request.gameId !== 'number') {
            return Result.error(ApplicationError.InvalidRequestData);
        }

        return Result.success(undefined);
    }

    async execute(
        request?: IRejectGameInvitationRequest | undefined
    ): Promise<Result<IRejectGameInvitationResponse>> {
        try {
            if (!request) {
                return Result.error(ApplicationError.InvalidRequestData);
            }

            const { userId, gameId } = request;

            // 1: Validar que el juego existe
            const match = await this.matchRepository.findById({ id: gameId });
            if (!match) {
                return Result.error(ApplicationError.GameNotFound);
            }

            // 2: Obtener el tipo de juego usando el gameTypeId del match
            const matchTypeId = match.matchTypeId;
            const matchType = MatchType.byId(matchTypeId);
            if (!matchType) {
                return Result.error(ApplicationError.GameTypeNotFound);
            }

            // 3: Validar si el tipo de juego soporta invitaciones
            if (!matchType.supportsInvitations) {
                return Result.error(ApplicationError.GameTypeDoesNotSupportInvitations);
            }

            // 4: Obtener la información del usuario que rechaza la invitación
            const userResult = await this.fastify.UserRepository.getUser({ id: userId as number });
            if (!userResult.isSuccess || !userResult.value) {
                return Result.error(ApplicationError.UserNotFound);
            }

            const user = userResult.value;

            // 5: Obtener la información del creador del juego para notificarle del rechazo
            const playerIds = match.playerIds;
            if (!playerIds || playerIds.length === 0) {
                return Result.error(ApplicationError.GameNotFound);
            }

            // El primer jugador es el creador del juego
            const creatorId = playerIds[0];
            const creatorResult = await this.fastify.UserRepository.getUser({ id: creatorId });
            if (!creatorResult.isSuccess || !creatorResult.value) {
                return Result.error(ApplicationError.UserNotFound);
            }

            const gameCreator = creatorResult.value;

            // 6: Enviar notificación de rechazo al creador del juego a través del socialSocket
            const rejectionResult = await this.socialWebSocketService.sendGameInvitationRejection({
                fromUserId: userId as number,
                fromUsername: user.username,
                fromUserAvatar: user.avatar || null,
                toUserId: gameCreator.id,
                gameId,
                gameTypeName: matchType.name,
                message: `${user.username} ha rechazado tu invitación al juego ${matchType.name}`,
            });

            if (!rejectionResult.isSuccess) {
                return Result.error(rejectionResult.error || ApplicationError.InternalServerError);
            }

            return Result.success({
                success: true,
                message: `Game invitation rejected successfully`,
            });
        } catch (error) {
            return this.fastify.handleError<IRejectGameInvitationResponse>({
                code: ApplicationError.InternalServerError,
                error,
            });
        }
    }
}
