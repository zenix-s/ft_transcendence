import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { GetActivePongTournamentsCommand } from './GetActivePongTournaments.command';

interface GetActivePongTournamentsRequest {
    Querystring: {
        limit?: number;
        offset?: number;
    };
}

export default async function GetActivePongTournamentsRoute(fastify: FastifyInstance) {
    fastify.get<GetActivePongTournamentsRequest>(
        '/active',
        {
            schema: {
                description: 'Get active Pong tournaments',
                tags: ['Tournament'],
                security: [{ bearerAuth: [] }],
                querystring: {
                    type: 'object',
                    properties: {
                        limit: {
                            type: 'integer',
                            minimum: 1,
                            maximum: 100,
                            default: 10,
                            description: 'Maximum number of tournaments to return',
                        },
                        offset: {
                            type: 'integer',
                            minimum: 0,
                            default: 0,
                            description: 'Number of tournaments to skip',
                        },
                    },
                },
                response: {
                    200: {
                        description: 'Active Pong tournaments retrieved successfully',
                        type: 'object',
                        properties: {
                            tournaments: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        id: { type: 'number' },
                                        name: { type: 'string' },
                                        matchTypeId: { type: 'number' },
                                        status: { type: 'string' },
                                        createdAt: { type: 'string', format: 'date-time' },
                                        participantCount: { type: 'number' },
                                        matchSettings: {
                                            type: 'object',
                                            properties: {
                                                maxScore: { type: 'number' },
                                                maxGameTime: { type: 'number' },
                                            },
                                            required: ['maxScore', 'maxGameTime'],
                                        },
                                    },
                                    required: [
                                        'id',
                                        'name',
                                        'matchTypeId',
                                        'status',
                                        'createdAt',
                                        'participantCount',
                                        'matchSettings',
                                    ],
                                },
                            },
                            total: { type: 'number' },
                        },
                    },
                    400: {
                        description: 'Invalid request parameters',
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
        async (request: FastifyRequest<GetActivePongTournamentsRequest>, reply: FastifyReply) => {
            const command = new GetActivePongTournamentsCommand(fastify);

            const requestData = {
                limit: request.query.limit,
                offset: request.query.offset,
            };

            return fastify.handleCommand({
                command: command,
                request: requestData,
                reply: reply,
                successStatus: 200,
            });
        }
    );
}
