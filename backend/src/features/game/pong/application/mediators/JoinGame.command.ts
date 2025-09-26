import { FastifyInstance } from 'fastify';
import { IGameRepository } from '../repositories/Game.IRepository';
import { ErrorResult, Result } from '@shared/abstractions/Result';
import { ICommand } from '@shared/application/abstractions/ICommand.interface';
import { handleError } from '@shared/utils/error.utils';
import { badRequestError } from '@shared/Errors';
import { MatchRepository } from '@shared/infrastructure/repositories/MatchRepository';
import { MatchPlayerRepository } from '@shared/infrastructure/repositories/MatchPlayerRepository';
import { GameRepository } from '../../infrastructure/Game.repository';

export const gameNotFoundError: ErrorResult = 'gameNotFoundError';

export const gameFullError: ErrorResult = 'gameFullError';

export const invalidRequestError: ErrorResult = 'invalidRequestError';

export interface IJoinGameRequest {
    gameId: string;
    userId?: string;
    userIdNum?: number; // Numeric user ID from database
}

export interface IJoinGameResponse {
    message: string;
    userId: string;
    gameId: string;
    alreadyJoined?: boolean;
}

export default class JoinGameCommand implements ICommand<IJoinGameRequest, IJoinGameResponse> {
    private readonly gameRepository: IGameRepository;
    private readonly matchRepository: MatchRepository;
    private readonly matchPlayerRepository: MatchPlayerRepository;

    constructor(private readonly fastify: FastifyInstance) {
        this.gameRepository = GameRepository.getInstance();
        const dbConnection = this.fastify.dbConnection;
        this.matchRepository = new MatchRepository(dbConnection);
        this.matchPlayerRepository = new MatchPlayerRepository(dbConnection);
    }

    validate(request?: IJoinGameRequest): Result<void> {
        if (!request) {
            return Result.error(badRequestError);
        }

        if (!request.gameId) {
            return Result.error(invalidRequestError);
        }

        return Result.success(undefined);
    }

    async execute(request?: IJoinGameRequest): Promise<Result<IJoinGameResponse>> {
        if (!request) return Result.error(badRequestError);

        try {
            const { gameId } = request;
            // Use string ID for game logic
            const userId = request.userId || crypto.randomUUID();
            // Use numeric ID for database if provided
            const userIdNum = request.userIdNum;

            const gameResult = await this.gameRepository.getGame(gameId);
            if (!gameResult.isSuccess || !gameResult.value) {
                return Result.error(gameNotFoundError);
            }

            const game = gameResult.value;

            if (game.hasPlayer(userId)) {
                return Result.success({
                    message: 'Already in the game',
                    userId: userId,
                    gameId: gameId,
                    alreadyJoined: true,
                });
            }

            const added = game.addPlayer(userId);
            if (!added) {
                return Result.error(gameFullError);
            }

            const updateResult = await this.gameRepository.updateGame(gameId, game);
            if (!updateResult.isSuccess) {
                return Result.error('gameUpdateError');
            }

            // Add player to match in database if we have a numeric user ID
            if (userIdNum) {
                try {
                    const matchId = GameRepository.getInstance().getMatchId(gameId);

                    if (matchId) {
                        await this.matchPlayerRepository.add(matchId, userIdNum);

                        // Start match if both players joined
                        if (game.getPlayerCount() === 2) {
                            await this.matchRepository.start(matchId);
                        }
                    }
                } catch (dbError) {
                    // Log but don't fail - player is already added to game in memory
                    this.fastify.log.error(dbError, 'Failed to add player to match in database');
                }
            }

            return Result.success({
                message: `Successfully joined game ${gameId}`,
                userId: userId,
                gameId: gameId,
            });
        } catch (error) {
            return handleError<IJoinGameResponse>(error, 'Failed to join game', this.fastify.log, '500');
        }
    }
}
