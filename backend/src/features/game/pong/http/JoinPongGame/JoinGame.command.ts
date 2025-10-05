import { FastifyInstance } from 'fastify';
import { IGameRepository } from '../../application/repositories/Game.IRepository';
import { ErrorResult, Result } from '@shared/abstractions/Result';
import { ICommand } from '@shared/application/abstractions/ICommand.interface';
import { badRequestError } from '@shared/Errors';
import { GameRepository } from '../../infrastructure/Game.repository';
import { IMatchRepository } from '@shared/infrastructure/repositories/MatchRepository';

export const gameNotFoundError: ErrorResult = 'gameNotFoundError';

export const gameFullError: ErrorResult = 'gameFullError';

export const invalidRequestError: ErrorResult = 'invalidRequestError';

export interface IJoinGameRequest {
    gameId: number;
    userId: number;
}

export interface IJoinGameResponse {
    message: string;
    userId: number;
    gameId: number;
    alreadyJoined?: boolean;
}

export default class JoinGameCommand implements ICommand<IJoinGameRequest, IJoinGameResponse> {
    private readonly gameRepository: IGameRepository;
    private readonly matchRepository: IMatchRepository;

    constructor(private readonly fastify: FastifyInstance) {
        this.gameRepository = GameRepository.getInstance();
        this.matchRepository = this.fastify.MatchRepository;
    }

    validate(request?: IJoinGameRequest): Result<void> {
        if (!request) {
            return Result.error(badRequestError);
        }

        if (!request.gameId || typeof request.gameId !== 'number') {
            return Result.error(invalidRequestError);
        }

        if (!request.userId || typeof request.userId !== 'number') {
            return Result.error(invalidRequestError);
        }

        return Result.success(undefined);
    }

    async execute(request?: IJoinGameRequest): Promise<Result<IJoinGameResponse>> {
        if (!request) return Result.error(badRequestError);

        try {
            const { gameId, userId } = request;

            const gameResult = await this.gameRepository.getGame(gameId);
            if (!gameResult.isSuccess || !gameResult.value) {
                return Result.error(gameNotFoundError);
            }

            const game = gameResult.value;

            const match = await this.matchRepository.findById(gameId);
            if (!match) {
                return Result.error('matchNotFound');
            }

            if (game.isSinglePlayerMode()) {
                if (game.hasPlayer(userId)) {
                    return Result.success({
                        message: 'Already in the single-player game',
                        userId: userId,
                        gameId: gameId,
                        alreadyJoined: true,
                    });
                }

                if (game.getPlayerCount() >= 2) {
                    return Result.error('singlePlayerGameAlreadyHasPlayer');
                }

                const added = game.addPlayer(userId);
                if (!added) {
                    return Result.error('cannotJoinSinglePlayerGame');
                }

                const playerAdded = match.addPlayer(userId);
                if (playerAdded) {
                    await this.matchRepository.update(match);
                }

                const updateResult = await this.gameRepository.updateGame(gameId, game);
                if (!updateResult.isSuccess) {
                    return Result.error('gameUpdateError');
                }

                return Result.success({
                    message: `Successfully joined single-player game ${gameId}`,
                    userId: userId,
                    gameId: gameId,
                });
            }

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

            const playerAdded = match.addPlayer(userId);
            if (playerAdded) {
                await this.matchRepository.update(match);

                if (game.getPlayerCount() === 2 && match.canStart()) {
                    const started = match.start();
                    if (started) {
                        await this.matchRepository.update(match);
                    }
                }
            }

            const updateResult = await this.gameRepository.updateGame(gameId, game);
            if (!updateResult.isSuccess) {
                return Result.error('gameUpdateError');
            }

            return Result.success({
                message: `Successfully joined game ${gameId}`,
                userId: userId,
                gameId: gameId,
            });
        } catch (error) {
            return this.fastify.handleError<IJoinGameResponse>({
                code: '500',
                error,
            });
        }
    }
}
