import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { CreatePongTournamentCommand } from './CreatePongTournament.command';

interface CreatePongTournamentRequest {
    Body: {
        name: string;
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
