import { FastifyInstance } from 'fastify';
import { IPongGameRepository } from '../../infrastructure/PongGame.repository';
import { Result } from '@shared/abstractions/Result';
import { ICommand } from '@shared/application/abstractions/ICommand.interface';
import { PongGame } from '../../domain/PongGame';

import { Match } from '@shared/domain/entity/Match.entity';
import { IMatchRepository } from '@shared/infrastructure/repositories/MatchRepository';
import { IGameTypeRepository } from '@shared/infrastructure/repositories/GameTypeRepository';
import { ApplicationError } from '@shared/Errors';

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
    private readonly gameRepository: IPongGameRepository;
    private readonly matchRepository: IMatchRepository;
    private readonly gameTypeRepository: IGameTypeRepository;

    constructor(private readonly fastify: FastifyInstance) {
        this.gameRepository = this.fastify.PongGameRepository;
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

            const gameType = await this.gameTypeRepository.findByName('pong');
            if (!gameType) {
                return Result.error(ApplicationError.GameTypeNotFound);
            }

            const playerIds = request?.userId ? [request.userId] : [];
            const match = new Match(gameType.id, playerIds);

            const createdMatch = await this.matchRepository.create(match);

            const game = new PongGame(winnerScore, maxGameTime);
            const gameIdResult = await this.gameRepository.createGame(game, createdMatch.id as number);

            if (!gameIdResult.isSuccess || !gameIdResult.value) {
                try {
                    await this.matchRepository.delete(createdMatch.id as number);
                } catch (deleteError) {
                    this.fastify.log.error(deleteError, 'Failed to delete match after game creation failure');
                }
                return Result.error(ApplicationError.GameCreationError);
            }

            const gameId = gameIdResult.value;

            return Result.success({
                message: `Game created successfully with ID: ${gameId}`,
                gameId: gameId,
            });
        } catch (error) {
            return this.fastify.handleError<ICreateGameResponse>({
                code: ApplicationError.InternalServerError,
                error,
            });
        }
    }
}
