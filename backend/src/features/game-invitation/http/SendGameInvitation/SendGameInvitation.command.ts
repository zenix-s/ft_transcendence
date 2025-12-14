import { FastifyInstance } from 'fastify';
import { Result } from '@shared/abstractions/Result';
import { ICommand } from '@shared/application/abstractions/ICommand.interface';
import { ApplicationError } from '@shared/Errors';
import { ISocialWebSocketService } from '@features/socialSocket/services/ISocialWebSocketService.interface';
import { IMatchRepository } from '@shared/infrastructure/repositories/MatchRepository';
import MatchType from '@shared/domain/ValueObjects/MatchType.value';
import { Match } from '@shared/domain/Entities/Match.entity';

export interface ISendGameInvitationResponse {
    success: boolean;
}

export interface ISendGameInvitationRequest {
    fromUserId?: number;
    username: string;
    gameId: number;
    message?: string;
}

export default class SendGameInvitationCommand implements ICommand<
    ISendGameInvitationRequest,
    ISendGameInvitationResponse
> {
    private readonly socialWebSocketService: ISocialWebSocketService;
    private readonly matchRepository: IMatchRepository;

    constructor(private readonly fastify: FastifyInstance) {
        this.socialWebSocketService = this.fastify.SocialWebSocketService;
        this.matchRepository = this.fastify.MatchRepository;
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

        if (!request.gameId || typeof request.gameId !== 'number') {
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

            const { fromUserId, username, gameId, message } = request;

            // 1: Validar que el juego existe y obtener su tipo
            const match = await this.matchRepository.findById({ id: gameId });
            if (!match) {
                return Result.error(ApplicationError.GameNotFound);
            }

            const activeGameResult = this.fastify.PongGameManager.getGame(gameId);
            if (!activeGameResult.isSuccess || !activeGameResult.value) {
                return Result.error(ApplicationError.GameNotFound);
            }

            // 2: Obtener el tipo de juego usando el gameTypeId del match
            const gameTypeId = match.matchTypeId;
            const matchType = MatchType.byId(gameTypeId);
            if (!matchType) {
                return Result.error(ApplicationError.GameTypeNotFound);
            }

            // 3: Validar si el tipo de juego soporta invitaciones
            if (!matchType.supportsInvitations) {
                return Result.error(ApplicationError.GameTypeDoesNotSupportInvitations);
            }

            // 3: Obtener la información del usuario objetivo
            const targetUserResult = await this.fastify.UserRepository.getUser({ username });
            if (!targetUserResult.isSuccess || !targetUserResult.value) {
                return Result.error(ApplicationError.UserNotFound);
            }

            const targetUser = targetUserResult.value;

            // 4: Prevenir auto-invitaciones
            if (fromUserId === targetUser.id) {
                return Result.error(ApplicationError.CannotInviteSelf);
            }

            // 5: Verificar si el remitente está en un torneo activo
            const senderTournamentResult = await this.fastify.TournamentRepository.isUserInActiveTournament({
                userId: fromUserId as number,
            });
            if (senderTournamentResult.isSuccess && senderTournamentResult.value) {
                return Result.error(ApplicationError.CurrentPlayerHasActiveTournament);
            }
            const activeMatches = await this.matchRepository.findUserMatches({
                userId: fromUserId as number,
                status: [Match.STATUS.PENDING, Match.STATUS.IN_PROGRESS],
            });

            if (activeMatches.length > 0) {
                return Result.error(ApplicationError.CurrentPlayerHasActiveMatch);
            }

            // 6: Verificar si el destinatario está en un torneo activo
            const recipientTournamentResult =
                await this.fastify.TournamentRepository.isUserInActiveTournament({
                    userId: targetUser.id,
                });
            if (recipientTournamentResult.isSuccess && recipientTournamentResult.value) {
                return Result.error(ApplicationError.PlayerHasActiveTournament);
            }

            const recipientActiveMatches = await this.matchRepository.findUserMatches({
                userId: targetUser.id,
                status: [Match.STATUS.PENDING, Match.STATUS.IN_PROGRESS],
            });

            if (recipientActiveMatches.length > 0) {
                return Result.error(ApplicationError.PlayerHasActiveMatch);
            }

            // 7: Obtener la información del usuario que envía la invitación
            const senderResult = await this.fastify.UserRepository.getUser({ id: fromUserId as number });
            if (!senderResult.isSuccess || !senderResult.value) {
                return Result.error(ApplicationError.UserNotFound);
            }

            const sender = senderResult.value;

            // 7: Enviar la invitación a través del servicio de WebSocket
            const invitationResult = await this.socialWebSocketService.sendGameInvitation({
                fromUserId: fromUserId as number,
                fromUsername: sender.username,
                fromUserAvatar: sender.avatar || null,
                toUserId: targetUser.id,
                gameId,
                gameTypeName: matchType.name,
                message: message || `${sender.username} te ha invitado a jugar!`,
                matchSettings: activeGameResult.value.getMatchSettings(),
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
