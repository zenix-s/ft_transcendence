import { FastifyInstance } from 'fastify';
import { Result } from '@shared/abstractions/Result';
import { ICommand } from '@shared/application/abstractions/ICommand.interface';
import { PongGame } from '../../../pong-game-manager/domain/PongGame';

import { Match } from '@shared/domain/entity/Match.entity';
import { IMatchRepository } from '@shared/infrastructure/repositories/MatchRepository';
import { IGameTypeRepository } from '@shared/infrastructure/repositories/GameTypeRepository';
import { ApplicationError } from '@shared/Errors';
import { CONSTANTES_DB } from '@shared/constants/ApplicationConstants';

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

        return Result.success(undefined);
    }

    async execute(request?: ICreateGameRequest | undefined): Promise<Result<ICreateGameResponse>> {
        try {
            const winnerScore = request?.winnerScore || 5;
            const maxGameTime = request?.maxGameTime || 120;
            const userId = request?.userId || null;

            if (userId === null) return Result.error(ApplicationError.UserNotFound);
            const userResult = await this.fastify.UserRepository.getUser({
                id: userId,
            });
            if (!userResult.isSuccess || !userResult.value)
                return Result.error(ApplicationError.UserNotFound);

            const gameType = await this.gameTypeRepository.findByName({
                name: CONSTANTES_DB.MATCH_TYPE.PONG.NAME,
            });
            if (!gameType) {
                return Result.error(ApplicationError.GameTypeNotFound);
            }

            const playerIds = request?.userId ? [request.userId] : [];
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
