import { FastifyInstance } from 'fastify';
import { Result } from '@shared/abstractions/Result';
import { ICommand } from '@shared/application/abstractions/ICommand.interface';
import { ApplicationError } from '@shared/Errors';
import { IMatchRepository } from '@shared/infrastructure/repositories/MatchRepository';
import MatchType from '@shared/domain/ValueObjects/MatchType.value';
import { ISocialWebSocketService } from '@features/socialSocket/services/ISocialWebSocketService.interface';

export interface IAcceptGameInvitationResponse {
    success: boolean;
    gameType?: string;
    message?: string;
}

export interface IAcceptGameInvitationRequest {
    userId?: number;
    gameId: number;
}

export default class AcceptGameInvitationCommand implements ICommand<
    IAcceptGameInvitationRequest,
    IAcceptGameInvitationResponse
> {
    private readonly matchRepository: IMatchRepository;
    private readonly socialWebSocketService: ISocialWebSocketService;

    constructor(private readonly fastify: FastifyInstance) {
        this.matchRepository = this.fastify.MatchRepository;
        this.socialWebSocketService = this.fastify.SocialWebSocketService;
    }

    validate(request?: IAcceptGameInvitationRequest | undefined): Result<void> {
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
        request?: IAcceptGameInvitationRequest | undefined
    ): Promise<Result<IAcceptGameInvitationResponse>> {
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

            // 2: Verificar si el usuario está en un torneo activo
            const activeTournamentResult = await this.fastify.TournamentRepository.isUserInActiveTournament({
                userId: userId as number,
            });
            if (activeTournamentResult.isSuccess && activeTournamentResult.value) {
                return Result.error(ApplicationError.CurrentPlayerHasActiveTournament);
            }

            // 3: Obtener el tipo de juego usando el gameTypeId del match
            const matchTypeId = match.matchTypeId;
            const matchType = MatchType.byId(matchTypeId);
            if (!matchType) {
                return Result.error(ApplicationError.GameTypeNotFound);
            }

            // 3: Validar si el tipo de juego soporta invitaciones
            if (!matchType.supportsInvitations) {
                return Result.error(ApplicationError.GameTypeDoesNotSupportInvitations);
            }

            // 4: Determinar el tipo de juego y llamar al método específico
            let joinResult: Result<string>;

            switch (matchType.name.toLowerCase()) {
                case MatchType.PONG.name.toLowerCase():
                    joinResult = await this.joinPongGame(userId as number, gameId);
                    break;

                default:
                    return Result.error(ApplicationError.GameTypeNotSupported);
            }

            if (!joinResult.isSuccess) {
                return Result.error(joinResult.error || ApplicationError.InternalServerError);
            }

            // 5: Si se proporcionó el username del invitador, enviar notificación de aceptación
            // if (inviterUsername) {
            //     // Obtener la información del usuario que acepta la invitación
            //     const userResult = await this.fastify.UserRepository.getUser({ id: userId as number });
            //     if (!userResult.isSuccess || !userResult.value) {
            //         return Result.error(ApplicationError.UserNotFound);
            //     }

            //     const user = userResult.value;

            //     // Obtener la información del usuario que envió la invitación
            //     const inviterResult = await this.fastify.UserRepository.getUser({
            //         username: inviterUsername,
            //     });
            //     if (inviterResult.isSuccess && inviterResult.value) {
            //         const inviter = inviterResult.value;

            //         // Solo notificar si el usuario que acepta no es el mismo que envió la invitación
            //         if (inviter.id !== userId) {
            //             // Enviar notificación de aceptación al usuario que envió la invitación
            //             await this.socialWebSocketService.sendGameInvitationAcceptance({
            //                 fromUserId: userId as number,
            //                 fromUsername: user.username,
            //                 fromUserAvatar: user.avatar || null,
            //                 toUserId: inviter.id,
            //                 gameId,
            //                 gameTypeName: matchType.name,
            //                 message: `${user.username} ha aceptado tu invitación al juego ${matchType.name}`,
            //             });
            //         }
            //     }
            // }

            // 5. Obtener la información del usuario que acepta la invitación
            const userResult = await this.fastify.UserRepository.getUser({ id: userId as number });
            if (!userResult.isSuccess || !userResult.value) {
                return Result.error(ApplicationError.UserNotFound);
            }

            const user = userResult.value;

            // 6: Obtener la información del creador del juego para notificarle
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

            // 7: Enviar notificación de rechazo al creador del juego a través del socialSocket
            const rejectionResult = await this.socialWebSocketService.sendGameInvitationAcceptance({
                fromUserId: userId as number,
                fromUsername: user.username,
                fromUserAvatar: user.avatar || null,
                toUserId: gameCreator.id,
                gameId,
                gameTypeName: matchType.name,
                message: `${user.username} ha aceptado tu invitación al juego ${matchType.name}`,
            });

            if (!rejectionResult.isSuccess) {
                return Result.error(rejectionResult.error || ApplicationError.InternalServerError);
            }

            return Result.success({
                success: true,
                gameType: matchType.name,
                message: joinResult.value,
            });
        } catch (error) {
            return this.fastify.handleError<IAcceptGameInvitationResponse>({
                code: ApplicationError.InternalServerError,
                error,
            });
        }
    }

    private async joinPongGame(userId: number, gameId: number): Promise<Result<string>> {
        try {
            const gameExistsResult = this.fastify.PongGameManager.gameExists(gameId);
            if (!gameExistsResult.isSuccess || !gameExistsResult.value) {
                return Result.error(ApplicationError.GameNotFound);
            }

            const addPlayerResult = await this.fastify.PongGameManager.addPlayerToGame({
                matchId: gameId,
                playerId: userId,
            });
            if (!addPlayerResult.isSuccess) {
                return Result.error(addPlayerResult.error || ApplicationError.InternalServerError);
            }

            return Result.success(`Successfully joined Pong game ${gameId}`);
        } catch {
            return Result.error(ApplicationError.InternalServerError);
        }
    }
}
