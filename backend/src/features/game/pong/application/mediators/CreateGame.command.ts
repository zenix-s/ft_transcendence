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

export interface ICreateGameResponse {
    message: string;
    gameId: number;
}

export interface ICreateGameRequest {
    winnerScore?: number;
    maxGameTime?: number;
    userId?: number; // From authenticated user
}

export default class CreateGameCommand implements ICommand<ICreateGameRequest, ICreateGameResponse> {
    private readonly gameRepository: IGameRepository;
    private readonly matchRepository: MatchRepository;
    private readonly gameTypeRepository: GameTypeRepository;

    constructor(private readonly fastify: FastifyInstance) {
        this.gameRepository = GameRepository.getInstance();
        const dbConnection = this.fastify.dbConnection;
        this.matchRepository = new MatchRepository(dbConnection);
        this.gameTypeRepository = new GameTypeRepository(dbConnection);
    }

    validate(request?: ICreateGameRequest | undefined): Result<void> {
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

        return Result.success(undefined);
    }

    async execute(request?: ICreateGameRequest | undefined): Promise<Result<ICreateGameResponse>> {
        try {
            const winnerScore = request?.winnerScore || 5;
            const maxGameTime = request?.maxGameTime || 120;

            // Create match in database first
            // Get pong game type (must exist from database initialization)
            const gameType = await this.gameTypeRepository.findByName('pong');
            if (!gameType) {
                return Result.error('Pong game type not found in database');
            }

            // Create match record with creator as first player if provided
            const playerIds = request?.userId ? [request.userId] : [];
            const match = await this.matchRepository.create({
                game_type_id: gameType.id,
                player_ids: playerIds,
            });

            // Create game with match ID
            const game = new PongGame(winnerScore, maxGameTime);
            const gameIdResult = await this.gameRepository.createGame(game, match.id);

            if (!gameIdResult.isSuccess || !gameIdResult.value) {
                // Delete the match if game creation failed
                try {
                    await this.matchRepository.delete(match.id);
                } catch (deleteError) {
                    this.fastify.log.error(deleteError, 'Failed to delete match after game creation failure');
                }
                return Result.error(gameCreationError);
            }

            const gameId = gameIdResult.value;

            return Result.success({
                message: `Game created successfully with ID: ${gameId}`,
                gameId: gameId,
            });
        } catch (error) {
            return handleError<ICreateGameResponse>(error, 'Game creation failed', this.fastify.log, '500');
        }
    }
}
