import { FastifyInstance } from 'fastify';
import { Result } from '@shared/abstractions/Result';
import { ICommand } from '@shared/application/abstractions/ICommand.interface';
import { PongGame } from '../../../pong-game-manager/domain/PongGame.entity';

import { Match } from '@shared/domain/Entities/Match.entity';
import { IMatchRepository } from '@shared/infrastructure/repositories/MatchRepository';
import { ApplicationError } from '@shared/Errors';
import MatchType from '@shared/domain/ValueObjects/MatchType.value';
import { VisualStyle } from '@shared/domain/ValueObjects/MatchSettings.value';

export interface ICreateSinglePlayerGameResponse {
    message: string;
    gameId: number;
    mode: string;
}

export interface ICreateSinglePlayerGameRequest {
    winnerScore?: number;
    maxGameTime?: number;
    aiDifficulty?: number;
    visualStyle?: VisualStyle;
    userId?: number;
}

export default class CreateSinglePlayerGameCommand implements ICommand<
    ICreateSinglePlayerGameRequest,
    ICreateSinglePlayerGameResponse
> {
    private readonly matchRepository: IMatchRepository;

    constructor(private readonly fastify: FastifyInstance) {
        this.matchRepository = this.fastify.MatchRepository;
    }

    validate(request?: ICreateSinglePlayerGameRequest | undefined): Result<void> {
        if (!request) return Result.error(ApplicationError.InvalidRequest);

        // Paso 1: Validar que userId esté presente
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

        if (request.aiDifficulty !== undefined) {
            if (
                typeof request.aiDifficulty !== 'number' ||
                request.aiDifficulty < 0 ||
                request.aiDifficulty > 1
            ) {
                return Result.error(ApplicationError.InvalidAiDifficulty);
            }
        }

        return Result.success(undefined);
    }

    async execute(
        request?: ICreateSinglePlayerGameRequest | undefined
    ): Promise<Result<ICreateSinglePlayerGameResponse>> {
        try {
            // Paso 1: Validar que request y userId existan
            if (!request || !request.userId) {
                return Result.error(ApplicationError.UnauthorizedAccess);
            }

            const userId = request.userId;

            // Paso 2: Validar que el usuario existe
            const userResult = await this.fastify.UserRepository.getUser({
                id: userId,
            });
            if (!userResult.isSuccess || !userResult.value)
                return Result.error(ApplicationError.UserNotFound);

            // Paso 3: Verificar si el usuario tiene partidas activas (pending o in_progress)
            const activeMatches = await this.matchRepository.findUserMatches({
                userId: userId,
                status: [Match.STATUS.PENDING, Match.STATUS.IN_PROGRESS],
            });

            if (activeMatches.length > 0) {
                return Result.error(ApplicationError.CurrentPlayerHasActiveMatch);
            }

            // Verificar si el usuario está en un torneo activo
            const activeTournamentResult = await this.fastify.TournamentRepository.isUserInActiveTournament({
                userId: userId,
            });
            if (activeTournamentResult.isSuccess && activeTournamentResult.value) {
                return Result.error(ApplicationError.CurrentPlayerHasActiveTournament);
            }

            const winnerScore = request.winnerScore || 5;
            const maxGameTime = request.maxGameTime || 120;
            const aiDifficulty = request.aiDifficulty || 0.95;
            const visualStyle = request.visualStyle || '2d';

            const gameType = MatchType.SINGLE_PLAYER_PONG;

            const playerIds = [userId, 1];

            const match = new Match(gameType.id, playerIds);

            const createdMatch = await this.matchRepository.create({ match });

            const game = new PongGame(winnerScore, maxGameTime, true, aiDifficulty, visualStyle);

            const matchId = createdMatch.id as number;

            const gameResult = await this.fastify.PongGameManager.createGame(matchId, game);

            // Paso 4: Agregar el jugador a través del PongGameManager para aplicar todas las protecciones
            const addPlayerResult = await this.fastify.PongGameManager.addPlayerToGame({
                matchId: matchId,
                playerId: userId,
            });
            if (!addPlayerResult.isSuccess) {
                try {
                    await this.matchRepository.delete({ id: matchId });
                } catch (deleteError) {
                    this.fastify.log.error(deleteError, 'Failed to delete match after add player failure');
                }
                return Result.error(addPlayerResult.error || ApplicationError.GameCreationError);
            }

            if (!gameResult.isSuccess) {
                try {
                    await this.matchRepository.delete({ id: matchId });
                } catch (deleteError) {
                    this.fastify.log.error(deleteError, 'Failed to delete match after game creation failure');
                }
                return Result.error(ApplicationError.GameCreationError);
            }

            return Result.success({
                message: `Single player game created successfully with ID: ${matchId}`,
                gameId: matchId,
                mode: gameType.name,
            });
        } catch (error) {
            return this.fastify.handleError<ICreateSinglePlayerGameResponse>({
                code: ApplicationError.InternalServerError,
                error,
            });
        }
    }
}
