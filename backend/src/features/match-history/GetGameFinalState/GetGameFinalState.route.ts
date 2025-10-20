import { FastifyInstance } from 'fastify/types/instance';
import { FastifyReply } from 'fastify/types/reply';
import { FastifyRequest } from 'fastify/types/request';
import GetGameFinalStateQuery from './GetGameFinalState.application';

interface GameFinalStateRequest {
    Params: {
        gameId: string;
    };
}

export default async function GetGameFinalStateRoute(fastify: FastifyInstance) {
    fastify.get(
        '/final-state/:gameId',
        {
            schema: {
                description:
                    'Get final state of a completed or cancelled game from match history. Example: GET /match-history/final-state/123',
                tags: ['Match History'],
                security: [{ bearerAuth: [] }],
                params: {
                    type: 'object',
                    properties: {
                        gameId: { type: 'string', description: 'Numeric game ID as string in URL' },
                    },
                    required: ['gameId'],
                },
                response: {
                    200: {
                        description: 'Game final state retrieved successfully',
                        type: 'object',
                        properties: {
                            gameId: { type: 'number' },
                            match: {
                                type: 'object',
                                properties: {
                                    id: { type: 'number' },
                                    status: { type: 'string' },
                                    startedAt: { type: 'string', format: 'date-time' },
                                    endedAt: { type: 'string', format: 'date-time' },
                                    duration: { type: 'number' },
                                    gameRules: {
                                        type: 'object',
                                        properties: {
                                            winnerScore: { type: 'number' },
                                            maxGameTime: { type: 'number' },
                                        },
                                    },
                                    players: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                userId: { type: 'number' },
                                                username: { type: 'string' },
                                                score: { type: 'number' },
                                                isWinner: { type: 'boolean' },
                                            },
                                        },
                                    },
                                    winner: {
                                        type: 'object',
                                        nullable: true,
                                        properties: {
                                            userId: { type: 'number' },
                                            username: { type: 'string' },
                                            score: { type: 'number' },
                                        },
                                    },
                                    finalState: {
                                        type: 'object',
                                        properties: {
                                            isGameOver: { type: 'boolean' },
                                            isCancelled: { type: 'boolean' },
                                            gameTimer: { type: 'number' },
                                            finalScores: {
                                                type: 'object',
                                                properties: {
                                                    player1: { type: 'number' },
                                                    player2: { type: 'number' },
                                                },
                                            },
                                            isSinglePlayer: { type: 'boolean' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    400: {
                        description: 'Invalid request',
                        type: 'object',
                        properties: {
                            error: { type: 'string' },
                        },
                    },
                    401: {
                        description: 'Unauthorized - Invalid token',
                        type: 'object',
                        properties: {
                            error: { type: 'string' },
                        },
                    },
                    404: {
                        description: 'Match not found',
                        type: 'object',
                        properties: {
                            error: { type: 'string' },
                        },
                    },
                    409: {
                        description: 'Match still in progress',
                        type: 'object',
                        properties: {
                            error: { type: 'string' },
                        },
                    },
                    500: {
                        description: 'Internal server error',
                        type: 'object',
                        properties: {
                            error: { type: 'string' },
                        },
                    },
                },
            },
        },
        async (req: FastifyRequest<GameFinalStateRequest>, reply: FastifyReply) => {
            const request = {
                gameId: parseInt(req.params.gameId),
            };
            const getGameFinalStateQuery = new GetGameFinalStateQuery(fastify);

            return fastify.handleCommand({
                command: getGameFinalStateQuery,
                request: request,
                reply: reply,
                successStatus: 200,
            });
        }
    );
}
