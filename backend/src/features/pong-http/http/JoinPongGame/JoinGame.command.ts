import { FastifyInstance } from 'fastify';
import { Result } from '@shared/abstractions/Result';
import { ICommand } from '@shared/application/abstractions/ICommand.interface';
import { ApplicationError } from '@shared/Errors';
import { IMatchRepository } from '@shared/infrastructure/repositories/MatchRepository';

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
    private readonly matchRepository: IMatchRepository;

    constructor(private readonly fastify: FastifyInstance) {
        this.matchRepository = this.fastify.MatchRepository;
    }

    validate(request?: IJoinGameRequest): Result<void> {
        if (!request) {
            return Result.error(ApplicationError.BadRequest);
        }

        if (!request.gameId || typeof request.gameId !== 'number') {
            return Result.error(ApplicationError.InvalidRequest);
        }

        if (!request.userId || typeof request.userId !== 'number') {
            return Result.error(ApplicationError.InvalidRequest);
        }

        return Result.success(undefined);
    }

    async execute(request?: IJoinGameRequest): Promise<Result<IJoinGameResponse>> {
        if (!request) return Result.error(ApplicationError.BadRequest);

        try {
            const { gameId, userId } = request;

            const gameResult = this.fastify.PongGameManager.getGame(gameId);
            if (!gameResult.isSuccess) {
                return Result.error(gameResult.error || ApplicationError.GameNotFound);
            }
            if (!gameResult.value) {
                return Result.error(ApplicationError.GameNotFound);
            }
            const game = gameResult.value;

            const match = await this.matchRepository.findById({ id: gameId });
            if (!match) {
                return Result.error(ApplicationError.MatchNotFound);
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
                    return Result.error(ApplicationError.SinglePlayerGameAlreadyHasPlayer);
                }

                const addResult = await this.fastify.PongGameManager.addPlayerToGame(gameId, userId);
                if (!addResult.isSuccess) {
                    return Result.error(addResult.error || ApplicationError.CannotJoinSinglePlayerGame);
                }

                const playerAdded = match.addPlayer(userId);
                if (playerAdded) {
                    await this.matchRepository.update({ match });
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

            const addResult = await this.fastify.PongGameManager.addPlayerToGame(gameId, userId);
            if (!addResult.isSuccess) {
                return Result.error(addResult.error || ApplicationError.GameFull);
            }

            const playerAdded = match.addPlayer(userId);
            if (playerAdded) {
                await this.matchRepository.update({ match });

                const updatedGameResult = this.fastify.PongGameManager.getGame(gameId);
                if (
                    updatedGameResult.isSuccess &&
                    updatedGameResult.value &&
                    updatedGameResult.value.getPlayerCount() === 2 &&
                    match.canStart()
                ) {
                    const started = match.start();
                    if (started) {
                        await this.matchRepository.update({ match });
                    }
                }
            }

            return Result.success({
                message: `Successfully joined game ${gameId}`,
                userId: userId,
                gameId: gameId,
            });
        } catch (error) {
            return this.fastify.handleError<IJoinGameResponse>({
                code: ApplicationError.InternalServerError,
                error,
            });
        }
    }
}
