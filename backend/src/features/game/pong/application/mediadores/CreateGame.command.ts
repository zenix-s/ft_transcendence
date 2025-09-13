import { FastifyInstance } from 'fastify';
import { IGameRepository } from '../repositories/Game.IRepository';
import { ErrorResult, Result } from '@shared/abstractions/Result';
import { ICommand } from '@shared/application/abstractions/ICommand.interface';
import { PongGame } from '../../dominio/PongGame';
import { handleError } from '@shared/utils/error.utils';

export const gameCreationError: ErrorResult = {
    code: 'gameCreationError',
    message: 'Failed to create game',
};

export interface ICreateGameResponse {
    message: string;
    gameId: string;
}

export default class CreateGameCommand implements ICommand<void, ICreateGameResponse> {
    constructor(
        private readonly gameRepository: IGameRepository,
        private readonly fastify: FastifyInstance
    ) {}

    validate(): Result<void> {
        // No validation needed for void request
        return Result.success(undefined);
    }

    async execute(): Promise<Result<ICreateGameResponse>> {
        try {
            // Create a new game instance
            const game = new PongGame();

            // Save the game to the repository
            const gameIdResult = await this.gameRepository.createGame(game);

            if (!gameIdResult.isSuccess || !gameIdResult.value) {
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
