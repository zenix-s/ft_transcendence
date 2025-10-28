import { FastifyInstance } from 'fastify';
import { Result } from '@shared/abstractions/Result';
import { ICommand } from '@shared/application/abstractions/ICommand.interface';
import { ApplicationError } from '@shared/Errors';
import { IGameTypeRepository } from '@shared/infrastructure/repositories/GameTypeRepository';
import { IMatchRepository } from '@shared/infrastructure/repositories/MatchRepository';
import { GAME_TYPES } from '@shared/constants/ApplicationConstants';

export interface IAcceptGameInvitationResponse {
    success: boolean;
    gameType?: string;
    message?: string;
}

export interface IAcceptGameInvitationRequest {
    userId?: number;
    gameId: number;
}

export default class AcceptGameInvitationCommand
    implements ICommand<IAcceptGameInvitationRequest, IAcceptGameInvitationResponse>
{
    private readonly matchRepository: IMatchRepository;
    private readonly gameTypeRepository: IGameTypeRepository;

    constructor(private readonly fastify: FastifyInstance) {
        this.matchRepository = this.fastify.MatchRepository;
        this.gameTypeRepository = this.fastify.GameTypeRepository;
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

            // 2: Obtener el tipo de juego usando el gameTypeId del match
            const gameTypeId = match.gameTypeId;
            const gameTypeResult = await this.gameTypeRepository.findById({ id: gameTypeId });
            if (!gameTypeResult) {
                return Result.error(ApplicationError.GameTypeNotFound);
            }

            const gameType = gameTypeResult;

            // 3: Validar si el tipo de juego soporta invitaciones
            if (!gameType.supports_invitations) {
                return Result.error(ApplicationError.GameTypeDoesNotSupportInvitations);
            }

            // 4: Determinar el tipo de juego y llamar al método específico
            let joinResult: Result<string>;

            switch (gameType.name.toLowerCase()) {
                case GAME_TYPES.PONG:
                    joinResult = await this.joinPongGame(userId as number, gameId);
                    break;

                default:
                    return Result.error(ApplicationError.GameTypeNotSupported);
            }

            if (!joinResult.isSuccess) {
                return Result.error(joinResult.error || ApplicationError.InternalServerError);
            }

            return Result.success({
                success: true,
                gameType: gameType.name,
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

            const addPlayerResult = this.fastify.PongGameManager.addPlayerToGame(gameId, userId);
            if (!addPlayerResult.isSuccess) {
                return Result.error(addPlayerResult.error || ApplicationError.InternalServerError);
            }

            return Result.success(`Successfully joined Pong game ${gameId}`);
        } catch {
            return Result.error(ApplicationError.InternalServerError);
        }
    }
}
