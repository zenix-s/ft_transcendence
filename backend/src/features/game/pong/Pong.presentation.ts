import { WebSocket } from '@fastify/websocket';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { GameRepository } from './infrastructure/Game.repository';
import CreateGameCommand from './application/mediadores/CreateGame.command';
import JoinGameCommand from './application/mediadores/JoinGame.command';
import SetPlayerReadyCommand from './application/mediadores/SetPlayerReady.command';
import GetGameStateQuery from './application/mediadores/GetGameState.query';
import { PossibleActions, Acciones } from './Pong.types';
import { Result } from '@shared/abstractions/Result';

interface WebSocketMessage {
    accion: Acciones;
    userId?: string;
    gameId?: string;
}

interface JoinGameRequest {
    Body: {
        userId?: string;
    };
    Params: {
        gameId: string;
    };
}

interface GameActionRequest {
    Params: {
        gameId: string;
    };
}

function validateWebSocketMessage(data: unknown): data is WebSocketMessage {
    if (!data || typeof data !== 'object') return false;
    const obj = data as Record<string, unknown>;
    if (!PossibleActions.includes(obj.accion as Acciones)) return false;
    if (obj.userId !== undefined && typeof obj.userId !== 'string') return false;
    if (obj.gameId !== undefined && typeof obj.gameId !== 'string') return false;
    return true;
}

// Helper function to handle command/query execution and responses
async function handleCommand<TRequest, TResponse>(
    commandOrQuery: {
        validate(request?: TRequest): Result<void>;
        execute(request?: TRequest): Promise<Result<TResponse>>;
    },
    request: TRequest | undefined,
    reply: FastifyReply,
    successStatus = 200
): Promise<FastifyReply> {
    const validationResult = commandOrQuery.validate(request);
    if (!validationResult.isSuccess) {
        return reply.status(400).send({
            error: {
                code: validationResult.error?.code,
                message: validationResult.error?.message,
            },
        });
    }

    const result = await commandOrQuery.execute(request);
    if (!result.isSuccess) {
        return reply.status(409).send({
            error: {
                code: result.error?.code,
                message: result.error?.message,
            },
        });
    }

    return reply.status(successStatus).send(result.value);
}

export default async function gameRoutes(fastify: FastifyInstance) {
    const gameRepository = new GameRepository();

    // Create a new game
    fastify.post('/create', async (req: FastifyRequest, reply: FastifyReply) => {
        const createGameCommand = new CreateGameCommand(gameRepository, fastify);
        return handleCommand(createGameCommand, undefined, reply, 201);
    });

    // Join a game
    fastify.post('/join/:gameId', async (req: FastifyRequest<JoinGameRequest>, reply: FastifyReply) => {
        const { gameId } = req.params;
        const userId = req.body?.userId;
        const joinGameCommand = new JoinGameCommand(gameRepository, fastify);
        return handleCommand(joinGameCommand, { gameId, userId }, reply);
    });

    // Get game state
    fastify.get('/state/:gameId', async (req: FastifyRequest<GameActionRequest>, reply: FastifyReply) => {
        const { gameId } = req.params;
        const getGameStateQuery = new GetGameStateQuery(gameRepository, fastify);
        return handleCommand(getGameStateQuery, { gameId }, reply);
    });

    // WebSocket endpoint for real-time game updates
    fastify.get('/', { websocket: true }, (socket: WebSocket) => {
        let currentGameId: string | null = null;
        let currentUserId: string | null = null;

        socket.on('message', async (message) => {
            try {
                const data = JSON.parse(message.toString());

                if (!validateWebSocketMessage(data)) {
                    socket.send(
                        JSON.stringify({
                            error: 'Invalid message format',
                            code: 'InvalidFormat',
                        })
                    );
                    return;
                }

                const { accion, userId, gameId } = data;

                switch (accion) {
                    case Acciones.SOLICITAR_ESTADO: {
                        if (!gameId) {
                            socket.send(
                                JSON.stringify({
                                    error: 'Game ID required',
                                    code: 'MissingGameId',
                                })
                            );
                            return;
                        }

                        const gameResult = await gameRepository.getGame(gameId);
                        if (!gameResult.isSuccess) {
                            socket.send(
                                JSON.stringify({
                                    error: 'Game not found',
                                    code: 'GameNotFound',
                                })
                            );
                            return;
                        }

                        currentGameId = gameId;
                        currentUserId = userId || null;

                        const game = gameResult.value;
                        if (!game) {
                            socket.send(
                                JSON.stringify({
                                    error: 'Game data not available',
                                    code: 'GameDataError',
                                })
                            );
                            return;
                        }
                        socket.send(
                            JSON.stringify({
                                type: 'gameState',
                                gameId: gameId,
                                state: game.getGameState(),
                            })
                        );
                        break;
                    }

                    case Acciones.MOVER_ARRIBA:
                    case Acciones.MOVER_ABAJO: {
                        if (!currentGameId || !currentUserId) {
                            socket.send(
                                JSON.stringify({
                                    error: 'Must request game state first',
                                    code: 'NoActiveGame',
                                })
                            );
                            return;
                        }

                        const moveGameResult = await gameRepository.getGame(currentGameId);
                        if (!moveGameResult.isSuccess) {
                            socket.send(
                                JSON.stringify({
                                    error: 'Game not found',
                                    code: 'GameNotFound',
                                })
                            );
                            return;
                        }

                        const moveGame = moveGameResult.value;
                        if (!moveGame) {
                            socket.send(
                                JSON.stringify({
                                    error: 'Game data not available',
                                    code: 'GameDataError',
                                })
                            );
                            return;
                        }
                        const direction = accion === Acciones.MOVER_ARRIBA ? 'up' : 'down';
                        const moved = moveGame.movePlayer(currentUserId, direction);

                        if (!moved) {
                            socket.send(
                                JSON.stringify({
                                    error: 'Player not in game',
                                    code: 'PlayerNotInGame',
                                })
                            );
                            return;
                        }

                        await gameRepository.updateGame(currentGameId, moveGame);

                        socket.send(
                            JSON.stringify({
                                type: 'moveConfirmed',
                                direction: direction,
                            })
                        );
                        break;
                    }

                    case Acciones.INDICAR_LISTO: {
                        if (!currentGameId || !currentUserId) {
                            socket.send(
                                JSON.stringify({
                                    error: 'Must request game state first',
                                    code: 'NoActiveGame',
                                })
                            );
                            return;
                        }

                        const setReadyCommand = new SetPlayerReadyCommand(gameRepository, fastify);
                        const readyResult = await setReadyCommand.execute({
                            gameId: currentGameId,
                            playerId: currentUserId,
                            isReady: true,
                        });

                        if (!readyResult.isSuccess) {
                            socket.send(
                                JSON.stringify({
                                    error: readyResult.error?.message,
                                    code: readyResult.error?.code,
                                })
                            );
                            return;
                        }

                        socket.send(
                            JSON.stringify({
                                type: 'readyConfirmed',
                                ...readyResult.value,
                            })
                        );

                        // If game started, begin the game loop
                        if (readyResult.value?.gameStarted) {
                            startGameLoop(currentGameId, gameRepository);
                        }
                        break;
                    }

                    case Acciones.SALIR_JUEGO: {
                        if (!currentGameId || !currentUserId) {
                            socket.send(
                                JSON.stringify({
                                    type: 'leftGame',
                                    message: 'No active game to leave',
                                })
                            );
                            return;
                        }

                        const leaveGameResult = await gameRepository.getGame(currentGameId);
                        if (leaveGameResult.isSuccess && leaveGameResult.value) {
                            const leaveGame = leaveGameResult.value;
                            leaveGame.removePlayer(currentUserId);

                            // Stop the game if a player leaves
                            if (leaveGame.isGameRunning()) {
                                leaveGame.stop();
                            }

                            await gameRepository.updateGame(currentGameId, leaveGame);
                        }

                        currentGameId = null;
                        currentUserId = null;

                        socket.send(
                            JSON.stringify({
                                type: 'leftGame',
                                message: 'Successfully left the game',
                            })
                        );
                        break;
                    }

                    default:
                        socket.send(
                            JSON.stringify({
                                error: 'Unknown action',
                                code: 'UnknownAction',
                            })
                        );
                }
            } catch {
                socket.send(
                    JSON.stringify({
                        error: 'Invalid JSON',
                        code: 'InvalidJSON',
                    })
                );
            }
        });

        socket.on('close', async () => {
            // Clean up when socket closes
            if (currentGameId && currentUserId) {
                const gameResult = await gameRepository.getGame(currentGameId);
                if (gameResult.isSuccess && gameResult.value) {
                    const game = gameResult.value;
                    game.removePlayer(currentUserId);

                    if (game.isGameRunning()) {
                        game.stop();
                    }

                    await gameRepository.updateGame(currentGameId, game);
                }
            }
        });
    });
}

// Game loop management
const gameLoops = new Map<string, NodeJS.Timeout>();

function startGameLoop(gameId: string, repository: GameRepository) {
    // Clear any existing loop for this game
    const existingLoop = gameLoops.get(gameId);
    if (existingLoop) {
        clearInterval(existingLoop);
    }

    const loop = setInterval(async () => {
        const gameResult = await repository.getGame(gameId);
        if (!gameResult.isSuccess) {
            clearInterval(loop);
            gameLoops.delete(gameId);
            return;
        }

        const game = gameResult.value;
        if (!game) {
            clearInterval(loop);
            gameLoops.delete(gameId);
            return;
        }

        if (!game.isGameRunning()) {
            clearInterval(loop);
            gameLoops.delete(gameId);
            return;
        }

        game.update();
        await repository.updateGame(gameId, game);

        // Optional: Broadcast game state to connected WebSocket clients
        // This would require maintaining a list of connected sockets per game
    }, 16); // ~60 FPS

    gameLoops.set(gameId, loop);
}

// Clean up game loops on server shutdown
process.on('SIGINT', () => {
    gameLoops.forEach((loop) => clearInterval(loop));
    gameLoops.clear();
});
