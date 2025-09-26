import { FastifyInstance } from 'fastify';
import { IGameRepository } from '../repositories/Game.IRepository';
import { ErrorResult, Result } from '@shared/abstractions/Result';
import { ICommand } from '@shared/application/abstractions/ICommand.interface';
import { PongGame } from '../../domain/PongGame';
import { handleError } from '@shared/utils/error.utils';
import { MatchRepository } from '@shared/infrastructure/repositories/MatchRepository';
import { GameTypeRepository } from '@shared/infrastructure/repositories/GameTypeRepository';
import { GameRepository } from '../../infrastructure/Game.repository';

export const gameCreationError: ErrorResult = 'gameCreationError';

export interface ICreateSinglePlayerGameResponse {
    message: string;
    gameId: number;
    mode: string;
}

export interface ICreateSinglePlayerGameRequest {
    winnerScore?: number;
    maxGameTime?: number;
    aiDifficulty?: number; // 0-1, where 1 is perfect tracking
    userId?: number; // From authenticated user
}

export default class CreateSinglePlayerGameCommand
    implements ICommand<ICreateSinglePlayerGameRequest, ICreateSinglePlayerGameResponse>
{
    private readonly gameRepository: IGameRepository;
    private readonly matchRepository: MatchRepository;
    private readonly gameTypeRepository: GameTypeRepository;

    constructor(private readonly fastify: FastifyInstance) {
        this.gameRepository = GameRepository.getInstance();
        const dbConnection = this.fastify.dbConnection;
        this.matchRepository = new MatchRepository(dbConnection);
        this.gameTypeRepository = new GameTypeRepository(dbConnection);
    }

    validate(request?: ICreateSinglePlayerGameRequest | undefined): Result<void> {
        if (!request) return Result.success(undefined);

        if (request.winnerScore !== undefined) {
            if (
                typeof request.winnerScore !== 'number' ||
                request.winnerScore < 1 ||
                request.winnerScore > 100
            ) {
                return Result.error('invalidWinnerScore');
            }
        }

        if (request.maxGameTime !== undefined) {
            if (
                typeof request.maxGameTime !== 'number' ||
                request.maxGameTime < 30 ||
                request.maxGameTime > 3600
            ) {
                return Result.error('invalidMaxGameTime');
            }
        }

        if (request.aiDifficulty !== undefined) {
            if (
                typeof request.aiDifficulty !== 'number' ||
                request.aiDifficulty < 0 ||
                request.aiDifficulty > 1
            ) {
                return Result.error('invalidAiDifficulty');
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

            const gameType = await this.gameTypeRepository.findByName('single_player_pong');
            if (!gameType) {
                return Result.error('Single player game type not found in database');
            }

            const playerIds = request?.userId ? [request.userId, -1] : [-1];
            const match = await this.matchRepository.create({
                game_type_id: gameType.id,
                player_ids: playerIds,
            });

            const game = new PongGame(winnerScore, maxGameTime, true, aiDifficulty);

            if (request?.userId) {
                game.addPlayer(request.userId);
            }

            await this.matchRepository.start(match.id);

            const gameIdResult = await this.gameRepository.createGame(game, match.id);

            if (!gameIdResult.isSuccess || !gameIdResult.value) {
                try {
                    await this.matchRepository.delete(match.id);
                } catch (deleteError) {
                    this.fastify.log.error(deleteError, 'Failed to delete match after game creation failure');
                }
                return Result.error(gameCreationError);
            }

            const gameId = gameIdResult.value;

            return Result.success({
                message: `Single player game created successfully with ID: ${gameId}`,
                gameId: gameId,
                mode: 'singleplayer',
            });
        } catch (error) {
            return handleError<ICreateSinglePlayerGameResponse>(
                error,
                'Single player game creation failed',
                this.fastify.log,
                '500'
            );
        }
    }
}
