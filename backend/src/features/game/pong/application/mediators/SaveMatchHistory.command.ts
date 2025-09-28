import { FastifyInstance } from 'fastify';
import { ErrorResult, Result } from '@shared/abstractions/Result';
import { ICommand } from '@shared/application/abstractions/ICommand.interface';
import { handleError } from '@shared/utils/error.utils';
import { MatchRepository } from '@shared/infrastructure/repositories/MatchRepository';
import { GameRepository } from '../../infrastructure/Game.repository';
import { IGameRepository } from '../repositories/Game.IRepository';

export const saveMatchError: ErrorResult = 'saveMatchError';

export interface ISaveMatchHistoryRequest {
    gameId: number;
}

export interface ISaveMatchHistoryResponse {
    message: string;
    matchId?: number;
}

export default class SaveMatchHistoryCommand
    implements ICommand<ISaveMatchHistoryRequest, ISaveMatchHistoryResponse>
{
    private readonly matchRepository: MatchRepository;
    private readonly gameRepository: IGameRepository;

    constructor(private readonly fastify: FastifyInstance) {
        const dbConnection = this.fastify.dbConnection;
        this.matchRepository = new MatchRepository(dbConnection);
        this.gameRepository = GameRepository.getInstance();
    }

    validate(request?: ISaveMatchHistoryRequest): Result<void> {
        if (!request || !request.gameId || typeof request.gameId !== 'number') {
            return Result.error('invalidRequest');
        }
        return Result.success(undefined);
    }

    async execute(request?: ISaveMatchHistoryRequest): Promise<Result<ISaveMatchHistoryResponse>> {
        if (!request) return Result.error('invalidRequest');

        try {
            const { gameId } = request;

            // Get the game instance
            const gameResult = await this.gameRepository.getGame(gameId);
            if (!gameResult.isSuccess || !gameResult.value) {
                return Result.error('gameNotFoundError');
            }

            const game = gameResult.value;
            const gameState = game.getGameState();

            if (!gameState.isGameOver) {
                return Result.error('gameNotFinished');
            }

            // Get the match entity from repository
            const match = await this.matchRepository.findById(gameId);
            if (!match) {
                return Result.error('matchNotFound');
            }

            // Prepare final scores and winners
            const finalScores: Record<number, number> = {};
            const winnerIds: number[] = [];

            if (gameState.player1) {
                const player1Id = parseInt(gameState.player1.id);
                if (!isNaN(player1Id)) {
                    finalScores[player1Id] = gameState.player1.score;
                    if (gameState.winner === gameState.player1.id) {
                        winnerIds.push(player1Id);
                    }
                }
            }

            if (gameState.player2) {
                const player2Id = parseInt(gameState.player2.id);
                if (!isNaN(player2Id)) {
                    finalScores[player2Id] = gameState.player2.score;
                    if (gameState.winner === gameState.player2.id) {
                        winnerIds.push(player2Id);
                    }
                }
            }

            // Use domain method to end the match
            const endResult = match.end(winnerIds, finalScores);
            if (!endResult) {
                return Result.error('cannotEndMatch');
            }

            // Save the updated match using single update method
            await this.matchRepository.update(match);

            return Result.success({
                message: 'Match history saved successfully',
                matchId: match.id,
            });
        } catch (error) {
            return handleError<ISaveMatchHistoryResponse>(
                error,
                'Failed to save match history',
                this.fastify.log,
                '500'
            );
        }
    }
}
