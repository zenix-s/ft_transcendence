import { FastifyInstance } from 'fastify';
import { Result } from '@shared/abstractions/Result';
import { ICommand } from '@shared/application/abstractions/ICommand.interface';
import { PongGame } from '../../../pong-game-manager/domain/PongGame';

import { Match } from '@shared/domain/entity/Match.entity';
import { IMatchRepository } from '@shared/infrastructure/repositories/MatchRepository';
import { IGameTypeRepository } from '@shared/infrastructure/repositories/GameTypeRepository';
import { ApplicationError } from '@shared/Errors';
import { CONSTANTES_APP } from '@shared/constants/ApplicationConstants';

export interface ICreateGameResponse {
    message: string;
    gameId: number;
}

export interface ICreateGameRequest {
    winnerScore?: number;
    maxGameTime?: number;
    userId?: number;
}

export default class CreateGameCommand implements ICommand<ICreateGameRequest, ICreateGameResponse> {
    private readonly matchRepository: IMatchRepository;
    private readonly gameTypeRepository: IGameTypeRepository;

    constructor(private readonly fastify: FastifyInstance) {
        this.matchRepository = this.fastify.MatchRepository;
        this.gameTypeRepository = this.fastify.GameTypeRepository;
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
            const userId = request.userId;

            // Validar que el usuario existe
            const userResult = await this.fastify.UserRepository.getUser({
                id: userId,
            });
            if (!userResult.isSuccess || !userResult.value)
                return Result.error(ApplicationError.UserNotFound);

            const gameType = await this.gameTypeRepository.findByName({
                name: CONSTANTES_APP.MATCH_TYPE.PONG.NAME,
            });
            if (!gameType) {
                return Result.error(ApplicationError.GameTypeNotFound);
            }

            const playerIds = [userId];
            const match = new Match(gameType.id, playerIds);

            const createdMatch = await this.matchRepository.create({ match });
            const matchId = createdMatch.id as number;

            const game = new PongGame(winnerScore, maxGameTime);
            const gameResult = await this.fastify.PongGameManager.createGame(matchId, matchId, game);

            if (!gameResult.isSuccess) {
                try {
                    await this.matchRepository.delete({ id: matchId });
                } catch (deleteError) {
                    this.fastify.log.error(deleteError, 'Failed to delete match after game creation failure');
                }
                return Result.error(ApplicationError.GameCreationError);
            }

            // Unir automáticamente al creador del juego como anfitrión
            const addPlayerResult = await this.fastify.PongGameManager.addPlayerToGame(matchId, userId);
            if (!addPlayerResult.isSuccess) {
                // Si falla al agregar el jugador, eliminar el juego y el match
                try {
                    await this.fastify.PongGameManager.deleteGame(matchId);
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
