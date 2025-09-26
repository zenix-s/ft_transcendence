import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import CreateGameCommand from '../application/mediators/CreateGame.command';
import JoinGameCommand from '../application/mediators/JoinGame.command';
import GetGameStateQuery from '../application/mediators/GetGameState.query';
import { handleCommand } from '@shared/utils/http.utils';

interface JoinGameRequest {
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
                            gameId: { type: 'number' },
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
            const userId = req.user?.id;
            const request = {
                winnerScore: req.body?.winnerScore,
                maxGameTime: req.body?.maxGameTime,
                userId: userId,
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
                params: {
                    type: 'object',
                    properties: {
                        gameId: { type: 'string', description: 'Numeric game ID as string in URL' },
                    },
                },
                response: {
                    200: {
                        description: 'Successfully joined game',
                        type: 'object',
                        properties: {
                            message: { type: 'string' },
                            userId: { type: 'number' },
                            gameId: { type: 'number' },
                            alreadyJoined: { type: 'boolean' },
                        },
                    },
                    400: {
                        description: 'Invalid request',
                        type: 'object',
                        properties: {
                            error: { type: 'string' },
                        },
                    },
                },
            },
        },
        async (req: FastifyRequest<JoinGameRequest>, reply: FastifyReply) => {
            const gameIdStr = req.params.gameId;
            const gameId = parseInt(gameIdStr);

            if (isNaN(gameId)) {
                return reply.status(400).send({ error: 'Invalid game ID' });
            }

            // Get authenticated user ID from JWT token
            const userId = req.user?.id;
            const joinGameCommand = new JoinGameCommand(fastify);
            return handleCommand(
                joinGameCommand,
                {
                    gameId,
                    userId: userId,
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
                params: {
                    type: 'object',
                    properties: {
                        gameId: { type: 'string', description: 'Numeric game ID as string in URL' },
                    },
                },
                response: {
                    200: {
                        description: 'Game state retrieved successfully',
                        type: 'object',
                        properties: {
                            gameId: { type: 'number' },
                            state: { type: 'object' },
                        },
                    },
                    400: {
                        description: 'Invalid request',
                        type: 'object',
                        properties: {
                            error: { type: 'string' },
                        },
                    },
                },
            },
        },
        async (req: FastifyRequest<GameActionRequest>, reply: FastifyReply) => {
            const gameIdStr = req.params.gameId;
            const gameId = parseInt(gameIdStr);

            if (isNaN(gameId)) {
                return reply.status(400).send({ error: 'Invalid game ID' });
            }

            const getGameStateQuery = new GetGameStateQuery(fastify);
            return handleCommand(getGameStateQuery, { gameId }, reply);
        }
    );
}
