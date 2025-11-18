import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { JoinPongTournamentCommand } from './JoinPongTournament.command';

interface JoinPongTournamentRequest {
    Params: {
        tournamentId: number;
    };
}

export default async function JoinPongTournamentRoute(fastify: FastifyInstance) {
    fastify.post<JoinPongTournamentRequest>(
        '/tournaments/:tournamentId/join',
        {
            schema: {
                description: 'Join a Pong tournament',
                tags: ['Tournament'],
                security: [{ bearerAuth: [] }],
                params: {
                    type: 'object',
                    properties: {
                        tournamentId: {
                            type: 'number',
                            description: 'ID of the tournament to join',
                        },
                    },
                    required: ['tournamentId'],
                },
                response: {
                    200: {
                        description: 'Successfully joined the tournament',
                        type: 'object',
                        properties: {
                            success: { type: 'boolean' },
                            message: { type: 'string' },
                        },
                    },
                    400: {
                        description: 'Bad request - unable to join tournament',
                        type: 'object',
                        properties: {
                            error: { type: 'string' },
                        },
                    },
                },
            },
            preHandler: [fastify.authenticate],
        },
        async (request: FastifyRequest<JoinPongTournamentRequest>, reply: FastifyReply) => {
            const command = new JoinPongTournamentCommand(fastify);

            const requestData = {
                tournamentId: request.params.tournamentId,
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
