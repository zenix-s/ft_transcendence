import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { GetPongTournamentDetailCommand } from './GetPongTournamentDetail.command';

interface GetPongTournamentDetailRequest {
    Params: {
        id: number;
    };
}

export default async function GetPongTournamentDetailRoute(fastify: FastifyInstance) {
    fastify.get<GetPongTournamentDetailRequest>(
        '/:id',
        {
            schema: {
                description: 'Get detailed information of a specific Pong tournament',
                tags: ['Tournament'],
                security: [{ bearerAuth: [] }],
                params: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'number',
                            minimum: 1,
                            description: 'Tournament ID',
                        },
                    },
                    required: ['id'],
                },
                response: {
                    200: {
                        description: 'Pong tournament detail retrieved successfully',
                        type: 'object',
                        properties: {
                            tournament: {
                                type: 'object',
                                properties: {
                                    id: { type: 'number' },
                                    name: { type: 'string' },
                                    matchTypeId: { type: 'number' },
                                    status: { type: 'string' },
                                    createdAt: { type: 'string', format: 'date-time' },
                                    participants: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                userId: { type: 'number' },
                                                username: { type: 'string' },
                                                status: { type: 'string' },
                                                role: { type: 'string' },
                                                score: { type: 'number' },
                                            },
                                            required: ['userId', 'username', 'status', 'role', 'score'],
                                        },
                                    },
                                    participantCount: { type: 'number' },
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
                                    'participants',
                                    'participantCount',
                                    'matchSettings',
                                ],
                            },
                        },
                        required: ['tournament'],
                    },
                    404: {
                        description: 'Tournament not found',
                        type: 'object',
                        properties: {
                            error: { type: 'string' },
                        },
                    },
                    400: {
                        description: 'Invalid tournament ID',
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
        async (request: FastifyRequest<GetPongTournamentDetailRequest>, reply: FastifyReply) => {
            const command = new GetPongTournamentDetailCommand(fastify);

            const requestData = {
                id: request.params.id,
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
