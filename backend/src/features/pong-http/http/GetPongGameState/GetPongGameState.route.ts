import { FastifyInstance } from 'fastify/types/instance';
import { FastifyReply } from 'fastify/types/reply';
import { FastifyRequest } from 'fastify/types/request';
import GetGameStateQuery from './GetGameState.query';

interface GameActionRequest {
    Params: {
        gameId: string;
    };
}

export default async function GetGameStateRoute(fastify: FastifyInstance) {
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
                    401: {
                        description: 'Unauthorized - Invalid token or player not authorized',
                        type: 'object',
                        properties: {
                            error: { type: 'string' },
                        },
                    },
                    403: {
                        description: 'Forbidden - Action not allowed or player not in game',
                        type: 'object',
                        properties: {
                            error: { type: 'string' },
                        },
                    },
                    404: {
                        description: 'Game not found',
                        type: 'object',
                        properties: {
                            error: { type: 'string' },
                        },
                    },
                    409: {
                        description: 'Conflict - Game full or match in progress',
                        type: 'object',
                        properties: {
                            error: { type: 'string' },
                        },
                    },
                    410: {
                        description: 'Game already finished',
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
        async (req: FastifyRequest<GameActionRequest>, reply: FastifyReply) => {
            const request = {
                gameId: parseInt(req.params.gameId),
            };
            const getGameStateQuery = new GetGameStateQuery(fastify);

            return fastify.handleCommand({
                command: getGameStateQuery,
                request: request,
                reply: reply,
                successStatus: 200,
            });
        }
    );
}
