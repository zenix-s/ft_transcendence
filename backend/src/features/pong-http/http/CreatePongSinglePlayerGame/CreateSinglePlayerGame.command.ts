import { FastifyInstance } from 'fastify';
import { Result } from '@shared/abstractions/Result';
import { ICommand } from '@shared/application/abstractions/ICommand.interface';
import { PongGame } from '../../../pong-game-manager/domain/PongGame';

import { Match } from '@shared/domain/entity/Match.entity';
import { IMatchRepository } from '@shared/infrastructure/repositories/MatchRepository';
import { IGameTypeRepository } from '@shared/infrastructure/repositories/GameTypeRepository';
import { ApplicationError } from '@shared/Errors';
import { CONSTANTES_DB } from '@shared/constants/ApplicationConstants';

export interface ICreateSinglePlayerGameResponse {
    message: string;
    gameId: number;
    mode: string;
}

export interface ICreateSinglePlayerGameRequest {
    winnerScore?: number;
    maxGameTime?: number;
    aiDifficulty?: number;
    userId?: number;
}

export default class CreateSinglePlayerGameCommand
    implements ICommand<ICreateSinglePlayerGameRequest, ICreateSinglePlayerGameResponse>
{
    private readonly matchRepository: IMatchRepository;
    private readonly gameTypeRepository: IGameTypeRepository;

    constructor(private readonly fastify: FastifyInstance) {
        this.matchRepository = this.fastify.MatchRepository;
        this.gameTypeRepository = this.fastify.GameTypeRepository;
    }

    validate(request?: ICreateSinglePlayerGameRequest | undefined): Result<void> {
        if (!request) return Result.success(undefined);

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
            if (!request) return Result.error(ApplicationError.BadRequest);

            const userId = request.userId || null;
            if (userId === null) return Result.error(ApplicationError.UserNotFound);
            const userResult = await this.fastify.UserRepository.getUser({
                id: userId,
            });
            if (!userResult.isSuccess || !userResult.value)
                return Result.error(ApplicationError.UserNotFound);

            const winnerScore = request?.winnerScore || 5;
            const maxGameTime = request?.maxGameTime || 120;
            const aiDifficulty = request?.aiDifficulty || 0.95;

            const gameType = await this.gameTypeRepository.findByName({
                name: CONSTANTES_DB.MATCH_TYPE.SINGLE_PLAYER_PONG.NAME,
            });

            if (!gameType) {
                this.fastify.log.error('Single player game type not found');
                return Result.error(ApplicationError.SinglePlayerGameTypeNotFound);
            }

            const playerIds = request?.userId ? [request.userId, 1] : [1];

            const match = new Match(gameType.id, playerIds);

            const createdMatch = await this.matchRepository.create({ match });

            const game = new PongGame(winnerScore, maxGameTime, true, aiDifficulty);

            game.addPlayer(userResult.value.id, userResult.value);

            // En modo un jugador, marcar el jugador como listo e iniciar el juego
            game.setPlayerReady(userResult.value.id, true);

            const started = createdMatch.start();
            if (started) {
                await this.matchRepository.update({ match: createdMatch });
            }

            const matchId = createdMatch.id as number;

            const gameResult = await this.fastify.PongGameManager.createGame(matchId, matchId, game);

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
                mode: CONSTANTES_DB.MATCH_TYPE.SINGLE_PLAYER_PONG.NAME,
            });
        } catch (error) {
            return this.fastify.handleError<ICreateSinglePlayerGameResponse>({
                code: ApplicationError.InternalServerError,
                error,
            });
        }
    }
}
