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
    gameId: string;
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

            const game = new PongGame(winnerScore, maxGameTime);

            const gameIdResult = await this.gameRepository.createGame(game);

            if (!gameIdResult.isSuccess || !gameIdResult.value) {
                return Result.error(gameCreationError);
            }

            const gameId = gameIdResult.value;

            // Save match to database
            try {
                // Get or create pong game type
                let gameType = await this.gameTypeRepository.findByName('pong');
                if (!gameType) {
                    gameType = await this.gameTypeRepository.create({
                        name: 'pong',
                        display_name: 'Pong Classic',
                        min_players: 2,
                        max_players: 2,
                    });
                }

                // Create match record with creator as first player if provided
                const playerIds = request?.userId ? [request.userId] : [];
                const match = await this.matchRepository.create({
                    game_type_id: gameType.id,
                    player_ids: playerIds,
                });

                // Store match ID in game repository
                GameRepository.getInstance().setMatchId(gameId, match.id);
            } catch (dbError) {
                // Log but don't fail - game is already created in memory
                this.fastify.log.error(dbError, 'Failed to save match to database');
            }

            return Result.success({
                message: `Game created successfully with ID: ${gameId}`,
                gameId: gameId,
            });
        } catch (error) {
            return handleError<ICreateGameResponse>(error, 'Game creation failed', this.fastify.log, '500');
        }
    }
}
