import { FastifyInstance } from 'fastify';
import { Result } from '@shared/abstractions/Result';
import { IQuery } from '@shared/application/abstractions/IQuery.interface';
import { ApplicationError } from '@shared/Errors';
import { IMatchRepository } from '@shared/infrastructure/repositories/MatchRepository';
import { GameState } from '../../../pong-game-manager/Pong.types';

export interface IGetGameStateRequest {
    gameId: number;
}

export interface IGetGameStateResponse {
    gameId: number;
    state: GameState;
}

export default class GetGameStateQuery implements IQuery<IGetGameStateRequest, IGetGameStateResponse> {
    private readonly matchRepository: IMatchRepository;

    constructor(private readonly fastify: FastifyInstance) {
        this.matchRepository = this.fastify.MatchRepository;
    }

    validate(request?: IGetGameStateRequest): Result<void> {
        if (!request) {
            return Result.error(ApplicationError.BadRequest);
        }

        if (!request.gameId || typeof request.gameId !== 'number') {
            return Result.error(ApplicationError.InvalidRequest);
        }

        return Result.success(undefined);
    }

    async execute(request?: IGetGameStateRequest): Promise<Result<IGetGameStateResponse>> {
        if (!request) return Result.error(ApplicationError.BadRequest);

        try {
            const { gameId } = request;

            const game = this.fastify.PongGameManager.getGame(gameId);
            if (!game) {
                // Verificar si el juego existió alguna vez en el historial
                const match = await this.matchRepository.findById({ id: gameId });
                if (match) {
                    return Result.error(ApplicationError.GameAlreadyFinished);
                } else {
                    return Result.error(ApplicationError.GameNotFound);
                }
            }

            const gameStateResult = this.fastify.PongGameManager.getGameState(gameId);
            if (!gameStateResult.isSuccess) {
                return Result.error(gameStateResult.error || ApplicationError.GameNotFound);
            }

            if (!gameStateResult.value) {
                return Result.error(ApplicationError.GameNotFound);
            }

            return Result.success(gameStateResult.value);
        } catch (error) {
            return this.fastify.handleError<IGetGameStateResponse>({
                code: ApplicationError.InternalServerError,
                error,
            });
        }
    }
}
