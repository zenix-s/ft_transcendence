import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import {
    GetCompletedPongTournamentsCommand,
    IGetCompletedPongTournamentsRequest,
} from './GetCompletedPongTournaments.command';

interface GetCompletedPongTournamentsRequest {
    Querystring: {
        limit?: number;
        offset?: number;
        onlyRegistered?: boolean;
    };
}

export default async function GetCompletedPongTournamentsRoute(fastify: FastifyInstance) {
    fastify.get<GetCompletedPongTournamentsRequest>(
        '/completed',
        {
            schema: {
                description: 'Get completed Pong tournaments history',
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
                        onlyRegistered: {
                            type: 'boolean',
                            default: false,
                            description: 'Return only tournaments where user was registered',
                        },
                    },
                },
                response: {
                    200: {
                        description: 'Completed Pong tournaments retrieved successfully',
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
                                        isRegistered: { type: 'boolean' },
                                        userRole: { type: 'string' },
                                        matchSettings: {
                                            type: 'object',
                                            properties: {
                                                maxScore: { type: 'number' },
                                                maxGameTime: { type: 'number' },
                                                visualStyle: { type: 'string', enum: ['2d', '3d'] },
                                            },
                                            required: ['maxScore', 'maxGameTime', 'visualStyle'],
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
        async (request: FastifyRequest<GetCompletedPongTournamentsRequest>, reply: FastifyReply) => {
            const command = new GetCompletedPongTournamentsCommand(fastify);

            const requestData: IGetCompletedPongTournamentsRequest = {
                limit: request.query.limit,
                offset: request.query.offset,
                onlyRegistered: request.query.onlyRegistered,
                userId: request.user.id,
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
