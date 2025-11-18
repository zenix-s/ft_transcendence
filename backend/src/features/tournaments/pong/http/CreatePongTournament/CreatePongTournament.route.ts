import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { CreatePongTournamentCommand } from './CreatePongTournament.command';

interface CreatePongTournamentRequest {
    Body: {
        name: string;
        matchSettings?: {
            maxScore: number;
            maxGameTime: number;
        };
    };
}

export default async function CreatePongTournamentRoute(fastify: FastifyInstance) {
    fastify.post<CreatePongTournamentRequest>(
        '',
        {
            schema: {
                description: 'Create a new Pong tournament',
                tags: ['Tournament'],
                security: [{ bearerAuth: [] }],
                body: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            description: 'Name of the tournament',
                        },
                        matchSettings: {
                            type: 'object',
                            properties: {
                                maxScore: {
                                    type: 'number',
                                    minimum: 1,
                                    maximum: 100,
                                    description: 'Maximum score to win a match',
                                },
                                maxGameTime: {
                                    type: 'number',
                                    minimum: 30,
                                    maximum: 600,
                                    description: 'Maximum game duration in seconds',
                                },
                            },
                            required: ['maxScore', 'maxGameTime'],
                        },
                    },
                    required: ['name'],
                },
                response: {
                    201: {
                        description: 'Pong tournament created successfully',
                        type: 'object',
                        properties: {
                            success: { type: 'boolean' },
                            tournamentId: { type: 'number' },
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
        async (request: FastifyRequest<CreatePongTournamentRequest>, reply: FastifyReply) => {
            const command = new CreatePongTournamentCommand(fastify);

            const requestData = {
                name: request.body.name,
                userId: request.user.id,
                matchSettings: request.body.matchSettings,
            };

            return fastify.handleCommand({
                command: command,
                request: requestData,
                reply: reply,
                successStatus: 201,
            });
        }
    );
}
