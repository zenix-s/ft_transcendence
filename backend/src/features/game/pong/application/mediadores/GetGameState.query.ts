import { FastifyInstance } from 'fastify';
import { IGameRepository } from '../repositories/Game.IRepository';
import { ErrorResult, Result } from '@shared/abstractions/Result';
import { IQuery } from '@shared/application/abstractions/IQuery.interface';
import { handleError } from '@shared/utils/error.utils';
import { badRequestError } from '@shared/Errors';

export const gameNotFoundError: ErrorResult = {
    code: 'gameNotFoundError',
    message: 'Game not found',
};

export const invalidRequestError: ErrorResult = {
    code: 'invalidRequestError',
    message: 'Game ID is required',
};

export interface IGetGameStateRequest {
    gameId: string;
}

export interface IGetGameStateResponse {
    gameId: string;
    state: {
        isRunning: boolean;
        gameTimer: number;
        player1: {
            id: string;
            position: number;
            score: number;
            isReady: boolean;
        } | null;
        player2: {
            id: string;
            position: number;
            score: number;
            isReady: boolean;
        } | null;
        ball: {
            position: { x: number; y: number };
            velocity: { x: number; y: number };
        };
        arePlayersReady: boolean;
    };
}

export default class GetGameStateQuery implements IQuery<IGetGameStateRequest, IGetGameStateResponse> {
    constructor(
        private readonly gameRepository: IGameRepository,
        private readonly fastify: FastifyInstance
    ) {}

    validate(request?: IGetGameStateRequest): Result<void> {
        if (!request) {
            return Result.error(badRequestError);
        }

        if (!request.gameId) {
            return Result.error(invalidRequestError);
        }

        return Result.success(undefined);
    }

    async execute(request?: IGetGameStateRequest): Promise<Result<IGetGameStateResponse>> {
        if (!request) return Result.error(badRequestError);

        try {
            const { gameId } = request;

            // Get the game from repository
            const gameResult = await this.gameRepository.getGame(gameId);
            if (!gameResult.isSuccess || !gameResult.value) {
                return Result.error(gameNotFoundError);
            }

            const game = gameResult.value;

            return Result.success({
                gameId: gameId,
                state: game.getGameState(),
            });
        } catch (error) {
            return handleError<IGetGameStateResponse>(
                error,
                'Failed to get game state',
                this.fastify.log,
                '500'
            );
        }
    }
}
