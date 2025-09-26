import { FastifyInstance } from 'fastify';
import SetPlayerReadyCommand from '../mediators/SetPlayerReady.command';
import { ErrorResult } from '@shared/abstractions/Result';
import { GameRepository } from '../../infrastructure/Game.repository';

export const WS_ERRORS = {
    INVALID_FORMAT: 'InvalidFormat' as ErrorResult,
    MISSING_GAME_ID: 'MissingGameId' as ErrorResult,
    GAME_NOT_FOUND: 'GameNotFound' as ErrorResult,
    GAME_DATA_ERROR: 'GameDataError' as ErrorResult,
    NO_ACTIVE_GAME: 'NoActiveGame' as ErrorResult,
    PLAYER_NOT_IN_GAME: 'PlayerNotInGame' as ErrorResult,
    UNKNOWN_ACTION: 'UnknownAction' as ErrorResult,
    INVALID_JSON: 'InvalidJSON' as ErrorResult,
    MISSING_TOKEN: 'MissingToken' as ErrorResult,
    INVALID_TOKEN: 'InvalidToken' as ErrorResult,
    NOT_AUTHENTICATED: 'NotAuthenticated' as ErrorResult,
};

export async function handleRequestState(
    gameId: string | undefined
): Promise<string> {
    const gameRepository = GameRepository.getInstance();
    if (!gameId) {
        return JSON.stringify({ error: WS_ERRORS.MISSING_GAME_ID });
    }

    const gameResult = await gameRepository.getGame(gameId);
    if (!gameResult.isSuccess) {
        return JSON.stringify({ error: WS_ERRORS.GAME_NOT_FOUND });
    }

    const game = gameResult.value;
    if (!game) {
        return JSON.stringify({ error: WS_ERRORS.GAME_DATA_ERROR });
    }

    return JSON.stringify({
        type: 'gameState',
        gameId: gameId,
        state: game.getGameState(),
    });
}

export async function handleMoverPaddle(
    direction: 'up' | 'down',
    currentGameId: string | null,
    currentUserId: string | null
): Promise<string> {
    const gameRepository = GameRepository.getInstance();
    if (!currentGameId || !currentUserId) {
        return JSON.stringify({ error: WS_ERRORS.NO_ACTIVE_GAME });
    }

    const moveGameResult = await gameRepository.getGame(currentGameId);
    if (!moveGameResult.isSuccess) {
        return JSON.stringify({ error: WS_ERRORS.GAME_NOT_FOUND });
    }

    const moveGame = moveGameResult.value;
    if (!moveGame) {
        return JSON.stringify({ error: WS_ERRORS.GAME_DATA_ERROR });
    }

    const moved = moveGame.movePlayer(currentUserId, direction);
    if (!moved) {
        return JSON.stringify({ error: WS_ERRORS.PLAYER_NOT_IN_GAME });
    }

    await gameRepository.updateGame(currentGameId, moveGame);

    return JSON.stringify({
        type: 'moveConfirmed',
        direction: direction,
    });
}

export async function handleSetReady(
    currentGameId: string | null,
    currentUserId: string | null,
    fastify: FastifyInstance
): Promise<{ response: string; gameStarted: boolean }> {
    if (!currentGameId || !currentUserId) {
        return {
            response: JSON.stringify({ error: WS_ERRORS.NO_ACTIVE_GAME }),
            gameStarted: false,
        };
    }

    const setReadyCommand = new SetPlayerReadyCommand(fastify);
    const readyResult = await setReadyCommand.execute({
        gameId: currentGameId,
        playerId: currentUserId,
        isReady: true,
    });

    if (!readyResult.isSuccess) {
        return {
            response: JSON.stringify({ error: readyResult.error }),
            gameStarted: false,
        };
    }

    return {
        response: JSON.stringify({
            type: 'readyConfirmed',
            ...readyResult.value,
        }),
        gameStarted: readyResult.value?.gameStarted || false,
    };
}
