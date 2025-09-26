import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import CreateGameCommand from '../application/mediators/CreateGame.command';
import JoinGameCommand from '../application/mediators/JoinGame.command';
import GetGameStateQuery from '../application/mediators/GetGameState.query';
import GetMatchHistoryQuery from '../application/mediators/GetMatchHistory.query';
import GetUserStatsQuery from '../application/mediators/GetUserStats.query';
import { Result } from '@shared/abstractions/Result';

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

interface MatchHistoryRequest {
    Querystring?: {
        limit?: number;
        offset?: number;
    };
}

interface UserMatchHistoryRequest {
    Params: {
        userId: string;
    };
    Querystring?: {
        limit?: number;
        offset?: number;
    };
}

interface UserStatsRequest {
    Params: {
        userId: string;
    };
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

export default async function pongHttpRoutes(fastify: FastifyInstance) {
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
            const createGameCommand = new CreateGameCommand(fastify);
            // Get authenticated user ID from JWT token
            const userIdNum = req.user?.userId;
            const request = {
                winnerScore: req.body?.winnerScore,
                maxGameTime: req.body?.maxGameTime,
                userId: userIdNum ? parseInt(userIdNum) : undefined,
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
            // Get authenticated user ID from JWT token
            const userIdNum = req.user?.userId;
            const userId = req.body?.userId || userIdNum?.toString();
            const joinGameCommand = new JoinGameCommand(fastify);
            return handleCommand(
                joinGameCommand,
                {
                    gameId,
                    userId,
                    userIdNum: userIdNum ? parseInt(userIdNum) : undefined,
                },
                reply
            );
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
            const getGameStateQuery = new GetGameStateQuery(fastify);
            return handleCommand(getGameStateQuery, { gameId }, reply);
        }
    );

    // Match history endpoints
    fastify.get(
        '/matches',
        {
            schema: {
                description: 'Get all match history',
                tags: ['Game'],
                security: [{ bearerAuth: [] }],
                querystring: {
                    type: 'object',
                    properties: {
                        limit: { type: 'number', default: 20 },
                        offset: { type: 'number', default: 0 },
                    },
                },
            },
        },
        async (req: FastifyRequest<MatchHistoryRequest>, reply: FastifyReply) => {
            const getMatchHistoryQuery = new GetMatchHistoryQuery(fastify);
            const request = {
                limit: req.query?.limit,
                offset: req.query?.offset,
            };
            return handleCommand(getMatchHistoryQuery, request, reply);
        }
    );

    fastify.get(
        '/matches/user/:userId',
        {
            schema: {
                description: 'Get match history for a specific user',
                tags: ['Game'],
                security: [{ bearerAuth: [] }],
                params: {
                    type: 'object',
                    properties: {
                        userId: { type: 'string' },
                    },
                    required: ['userId'],
                },
            },
        },
        async (req: FastifyRequest<UserMatchHistoryRequest>, reply: FastifyReply) => {
            const getMatchHistoryQuery = new GetMatchHistoryQuery(fastify);
            const userId = parseInt(req.params.userId);
            const request = {
                userId: isNaN(userId) ? undefined : userId,
                limit: req.query?.limit,
                offset: req.query?.offset,
            };
            return handleCommand(getMatchHistoryQuery, request, reply);
        }
    );

    fastify.get(
        '/matches/stats/:userId',
        {
            schema: {
                description: 'Get game statistics for a user',
                tags: ['Game'],
                security: [{ bearerAuth: [] }],
                params: {
                    type: 'object',
                    properties: {
                        userId: { type: 'string' },
                    },
                    required: ['userId'],
                },
            },
        },
        async (req: FastifyRequest<UserStatsRequest>, reply: FastifyReply) => {
            const getUserStatsQuery = new GetUserStatsQuery(fastify);
            const userId = parseInt(req.params.userId);
            const request = {
                userId: isNaN(userId) ? 0 : userId,
            };
            return handleCommand(getUserStatsQuery, request, reply);
        }
    );
}
