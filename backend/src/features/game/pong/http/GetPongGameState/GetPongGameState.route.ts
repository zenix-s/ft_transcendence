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
