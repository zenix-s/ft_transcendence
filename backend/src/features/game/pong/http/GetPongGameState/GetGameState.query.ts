import { FastifyInstance } from 'fastify';
import { Result } from '@shared/abstractions/Result';
import { IQuery } from '@shared/application/abstractions/IQuery.interface';
import { ApplicationError } from '@shared/Errors';
import { IPongGameRepository } from '../../infrastructure/PongGame.repository';

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
    private readonly gameRepository: IPongGameRepository;

    constructor(private readonly fastify: FastifyInstance) {
        this.gameRepository = this.fastify.PongGameRepository;
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

            const gameResult = await this.gameRepository.getGame(gameId);
            if (!gameResult.isSuccess || !gameResult.value) {
                return Result.error(ApplicationError.GameNotFound);
            }

            const game = gameResult.value;

            return Result.success({
                gameId: gameId,
                state: game.getGameState(),
            });
        } catch (error) {
            return this.fastify.handleError<IGetGameStateResponse>({
                code: ApplicationError.InternalServerError,
                error,
            });
        }
    }
}
