import { FastifyInstance } from 'fastify';
import { Result } from '@shared/abstractions/Result';
import { ICommand } from '@shared/application/abstractions/ICommand.interface';
import { PongGame } from '../../../pong-game-manager/domain/PongGame';

import { Match } from '@shared/domain/entity/Match.entity';
import { IMatchRepository } from '@shared/infrastructure/repositories/MatchRepository';
import { IGameTypeRepository } from '@shared/infrastructure/repositories/GameTypeRepository';
import { ApplicationError } from '@shared/Errors';

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
            const winnerScore = request?.winnerScore || 5;
            const maxGameTime = request?.maxGameTime || 120;
            const aiDifficulty = request?.aiDifficulty || 0.95;

            this.fastify.log.info('Creating single player game');

            const gameType = await this.gameTypeRepository.findByName({ name: 'single_player_pong' });
            if (!gameType) {
                this.fastify.log.error('Single player game type not found');
                return Result.error(ApplicationError.SinglePlayerGameTypeNotFound);
            }

            this.fastify.log.info('Found game type');

            const playerIds = request?.userId ? [request.userId, 1] : [1];
            this.fastify.log.info('Creating match with players');

            const match = new Match(gameType.id, playerIds);

            this.fastify.log.info('Saving match to database');
            const createdMatch = await this.matchRepository.create({ match });

            this.fastify.log.info('Match created successfully');

            this.fastify.log.info('Creating PongGame instance');
            const game = new PongGame(winnerScore, maxGameTime, true, aiDifficulty);

            if (request?.userId) {
                this.fastify.log.info('Adding player to game');
                game.addPlayer(request.userId);

                // En modo un jugador, marcar el jugador como listo e iniciar el juego
                this.fastify.log.info('Setting player as ready for single player game');
                game.setPlayerReady(request.userId, true);
            }

            this.fastify.log.info('Starting match');
            const started = createdMatch.start();
            if (started) {
                this.fastify.log.info('Match started, updating in database');
                await this.matchRepository.update({ match: createdMatch });
            }

            const matchId = createdMatch.id as number;

            this.fastify.log.info('Creating game with PongGameManager');
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
                mode: 'singleplayer',
            });
        } catch (error) {
            return this.fastify.handleError<ICreateSinglePlayerGameResponse>({
                code: ApplicationError.InternalServerError,
                error,
            });
        }
    }
}
