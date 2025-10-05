import { FastifyInstance } from 'fastify';
import { IGameRepository } from '../../application/repositories/Game.IRepository';
import { ErrorResult, Result } from '@shared/abstractions/Result';
import { IQuery } from '@shared/application/abstractions/IQuery.interface';
import { badRequestError } from '@shared/Errors';
import { GameRepository } from '../../infrastructure/Game.repository';

export const gameNotFoundError: ErrorResult = 'gameNotFoundError';

export const invalidRequestError: ErrorResult = 'invalidRequestError';

export interface IGetGameStateRequest {
    gameId: number;
}

export interface IGetGameStateResponse {
    gameId: number;
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
        gameRules: {
            winnerScore: number;
            maxGameTime?: number;
        };
        isGameOver: boolean;
        winner: string | null;
        isSinglePlayer?: boolean;
    };
}

export default class GetGameStateQuery implements IQuery<IGetGameStateRequest, IGetGameStateResponse> {
    private readonly gameRepository: IGameRepository;

    constructor(private readonly fastify: FastifyInstance) {
        this.gameRepository = GameRepository.getInstance();
    }

    validate(request?: IGetGameStateRequest): Result<void> {
        if (!request) {
            return Result.error(badRequestError);
        }

        if (!request.gameId || typeof request.gameId !== 'number') {
            return Result.error(invalidRequestError);
        }

        return Result.success(undefined);
    }

    async execute(request?: IGetGameStateRequest): Promise<Result<IGetGameStateResponse>> {
        if (!request) return Result.error(badRequestError);

        try {
            const { gameId } = request;

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
            return this.fastify.handleError<IGetGameStateResponse>({
                code: '500',
                error,
            });
        }
    }
}
