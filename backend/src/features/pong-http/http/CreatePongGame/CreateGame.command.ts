import { FastifyInstance } from 'fastify';
import { Result } from '@shared/abstractions/Result';
import { ICommand } from '@shared/application/abstractions/ICommand.interface';
import { PongGame } from '../../../pong-game-manager/domain/PongGame.entity';
import { Match } from '@shared/domain/Entities/Match.entity';
import { IMatchRepository } from '@shared/infrastructure/repositories/MatchRepository';
import { ApplicationError } from '@shared/Errors';
import MatchType from '@shared/domain/ValueObjects/MatchType.value';
import { VisualStyle } from '@shared/domain/ValueObjects/MatchSettings.value';

export interface ICreateGameResponse {
    message: string;
    gameId: number;
}

export interface ICreateGameRequest {
    winnerScore?: number;
    maxGameTime?: number;
    visualStyle?: VisualStyle;
    userId?: number;
}

export default class CreateGameCommand implements ICommand<ICreateGameRequest, ICreateGameResponse> {
    private readonly matchRepository: IMatchRepository;

    constructor(private readonly fastify: FastifyInstance) {
        this.matchRepository = this.fastify.MatchRepository;
    }

    validate(request?: ICreateGameRequest | undefined): Result<void> {
        if (!request) return Result.error(ApplicationError.InvalidRequest);

        // Validar que userId esté presente
        if (!request.userId || typeof request.userId !== 'number') {
            return Result.error(ApplicationError.UnauthorizedAccess);
        }

        if (request.winnerScore !== undefined) {
            if (
                typeof request.winnerScore !== 'number' ||
                request.winnerScore < 1 ||
                request.winnerScore > 100
            ) {
                return Result.error(ApplicationError.InvalidWinnerScore);
            }
        }

        if (request.maxGameTime !== undefined) {
            if (
                typeof request.maxGameTime !== 'number' ||
                request.maxGameTime < 30 ||
                request.maxGameTime > 3600
            ) {
                return Result.error(ApplicationError.InvalidMaxGameTime);
            }
        }

        return Result.success(undefined);
    }

    async execute(request?: ICreateGameRequest | undefined): Promise<Result<ICreateGameResponse>> {
        try {
            // Validar que request y userId existan
            if (!request || !request.userId) {
                return Result.error(ApplicationError.UnauthorizedAccess);
            }

            const winnerScore = request.winnerScore || 5;
            const maxGameTime = request.maxGameTime || 120;
            const visualStyle = request.visualStyle || '2d';
            const userId = request.userId;

            // Validar que el usuario existe
            const userResult = await this.fastify.UserRepository.getUser({
                id: userId,
            });
            if (!userResult.isSuccess || !userResult.value)
                return Result.error(ApplicationError.UserNotFound);

            // Verificar si el usuario tiene partidas activas (pending o in_progress)
            const activeMatches = await this.matchRepository.findUserMatches({
                userId: userId,
                status: [Match.STATUS.PENDING, Match.STATUS.IN_PROGRESS],
            });

            if (activeMatches.length > 0) {
                return Result.error(ApplicationError.PlayerHasActiveMatch);
            }

            const gameType = MatchType.PONG;

            const playerIds = [userId];
            const match = new Match(gameType.id, playerIds);

            const createdMatch = await this.matchRepository.create({ match });
            const matchId = createdMatch.id as number;

            const game = new PongGame(winnerScore, maxGameTime, false, 0.95, visualStyle);
            const gameResult = await this.fastify.PongGameManager.createGame(matchId, game);

            if (!gameResult.isSuccess) {
                try {
                    await this.matchRepository.delete({ id: matchId });
                } catch (deleteError) {
                    this.fastify.log.error(deleteError, 'Failed to delete match after game creation failure');
                }
                return Result.error(ApplicationError.GameCreationError);
            }

            // Unir automáticamente al creador del juego como anfitrión
            const addPlayerResult = await this.fastify.PongGameManager.addPlayerToGame({
                matchId: matchId,
                playerId: userId,
            });
            if (!addPlayerResult.isSuccess) {
                // Si falla al agregar el jugador, eliminar el juego y el match
                try {
                    this.fastify.PongGameManager.deleteGame(matchId);
                    await this.matchRepository.delete({ id: matchId });
                } catch (deleteError) {
                    this.fastify.log.error(deleteError, 'Failed to clean up after player addition failure');
                }
                return Result.error(addPlayerResult.error || ApplicationError.GameCreationError);
            }

            return Result.success({
                message: `Game created successfully with ID: ${matchId}`,
                gameId: matchId,
            });
        } catch (error) {
            return this.fastify.handleError<ICreateGameResponse>({
                code: ApplicationError.InternalServerError,
                error,
            });
        }
    }
}
