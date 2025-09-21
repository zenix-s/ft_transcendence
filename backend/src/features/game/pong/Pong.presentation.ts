import { WebSocket } from '@fastify/websocket';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { GameRepository } from './infrastructure/Game.repository';
import CreateGameCommand from './application/mediators/CreateGame.command';
import JoinGameCommand from './application/mediators/JoinGame.command';
import GetGameStateQuery from './application/mediators/GetGameState.query';
import { PossibleActions, Actions } from './Pong.types';
import { Result } from '@shared/abstractions/Result';
import {
    WS_ERRORS,
    handleRequestState,
    handleMoverPaddle,
    handleSetReady,
} from './application/websocket-handlers/gameActions.handlers';

interface WebSocketMessage {
    action: Actions;
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

interface CreateGameRequest {
    Body: {
        winnerScore?: number;
        maxGameTime?: number;
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
    if (!PossibleActions.includes(obj.action as Actions)) return false;
    if (obj.userId !== undefined && typeof obj.userId !== 'string') return false;
    if (obj.gameId !== undefined && typeof obj.gameId !== 'string') return false;
    return true;
}

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
        return reply.status(400).send({ error: validationResult.error });
    }

    const result = await commandOrQuery.execute(request);
    if (!result.isSuccess) {
        return reply.status(409).send({ error: result.error });
    }

    return reply.status(successStatus).send(result.value);
}

export default async function gameRoutes(fastify: FastifyInstance) {
    const gameRepository = new GameRepository();

    fastify.post(
        '/create',
        {
            schema: {
                description: 'Create a new Pong game with optional custom rules',
                tags: ['Game'],
                security: [{ bearerAuth: [] }],
                body: {
                    type: 'object',
                    properties: {
                        winnerScore: {
                            type: 'number',
                            description: 'Score required to win the game (1-100)',
                            default: 5,
                            minimum: 1,
                            maximum: 100,
                        },
                        maxGameTime: {
                            type: 'number',
                            description: 'Maximum game duration in seconds (30-3600)',
                            default: 120,
                            minimum: 30,
                            maximum: 3600,
                        },
                    },
                },
                response: {
                    201: {
                        description: 'Game created successfully',
                        type: 'object',
                        properties: {
                            message: { type: 'string' },
                            gameId: { type: 'string' },
                        },
                    },
                    400: {
                        description: 'Invalid request parameters',
                        type: 'object',
                        properties: {
                            error: { type: 'string' },
                        },
                    },
                },
            },
        },
        async (req: FastifyRequest<CreateGameRequest>, reply: FastifyReply) => {
            const createGameCommand = new CreateGameCommand(fastify, gameRepository);
            const request = {
                winnerScore: req.body?.winnerScore,
                maxGameTime: req.body?.maxGameTime,
            };

            return handleCommand(createGameCommand, request, reply, 201);
        }
    );

    fastify.post(
        '/join/:gameId',
        {
            schema: {
                description: 'Join an existing Pong game',
                tags: ['Game'],
                security: [{ bearerAuth: [] }],
            },
        },
        async (req: FastifyRequest<JoinGameRequest>, reply: FastifyReply) => {
            const { gameId } = req.params;
            const userId = req.body?.userId;
            const joinGameCommand = new JoinGameCommand(fastify, gameRepository);
            return handleCommand(joinGameCommand, { gameId, userId }, reply);
        }
    );

    fastify.get(
        '/state/:gameId',
        {
            schema: {
                description: 'Get current state of the game',
                tags: ['Game'],
                security: [{ bearerAuth: [] }],
            },
        },
        async (req: FastifyRequest<GameActionRequest>, reply: FastifyReply) => {
            const { gameId } = req.params;
            const getGameStateQuery = new GetGameStateQuery(fastify, gameRepository);
            return handleCommand(getGameStateQuery, { gameId }, reply);
        }
    );

    fastify.get(
        '/',
        {
            websocket: true,
            schema: {
                description: 'WebSocket endpoint for real-time Pong game actions',
                tags: ['Game'],
                security: [{ bearerAuth: [] }],
            },
        },
        (socket: WebSocket) => {
            let currentGameId: string | null = null;
            let currentUserId: string | null = null;

            socket.on('message', async (message) => {
                try {
                    const data = JSON.parse(message.toString());

                    if (!validateWebSocketMessage(data)) {
                        socket.send(JSON.stringify({ error: WS_ERRORS.INVALID_FORMAT }));
                        return;
                    }

                    const { action, userId, gameId } = data;

                    switch (action) {
                        case Actions.REQUEST_STATE: {
                            const response = await handleRequestState(gameId, userId, gameRepository);
                            socket.send(response);

                            if (gameId && !response.includes('error')) {
                                currentGameId = gameId;
                                currentUserId = userId || null;
                            }
                            break;
                        }

                        case Actions.MOVE_UP:
                        case Actions.MOVE_DOWN: {
                            const direction = action === Actions.MOVE_UP ? 'up' : 'down';
                            const response = await handleMoverPaddle(
                                direction,
                                currentGameId,
                                currentUserId,
                                gameRepository
                            );
                            socket.send(response);
                            break;
                        }

                        case Actions.SET_READY: {
                            const { response, gameStarted } = await handleSetReady(
                                currentGameId,
                                currentUserId,
                                gameRepository,
                                fastify
                            );
                            socket.send(response);

                            if (gameStarted && currentGameId) {
                                startGameLoop(currentGameId, gameRepository);
                            }
                            break;
                        }

                        default:
                            socket.send(JSON.stringify({ error: WS_ERRORS.UNKNOWN_ACTION }));
                    }
                } catch {
                    socket.send(JSON.stringify({ error: WS_ERRORS.INVALID_JSON }));
                }
            });
        }
    );
}

const gameLoops = new Map<string, NodeJS.Timeout>();

function startGameLoop(gameId: string, repository: GameRepository) {
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

        if (!game.isGameRunning() || game.isGameOver()) {
            clearInterval(loop);
            gameLoops.delete(gameId);
            return;
        }

        game.update();
        await repository.updateGame(gameId, game);

        if (game.isGameOver()) {
            clearInterval(loop);
            gameLoops.delete(gameId);
        }
    }, 16);

    gameLoops.set(gameId, loop);
}

process.on('SIGINT', () => {
    gameLoops.forEach((loop) => clearInterval(loop));
    gameLoops.clear();
});
