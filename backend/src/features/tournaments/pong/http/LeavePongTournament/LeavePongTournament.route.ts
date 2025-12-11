import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { LeavePongTournamentCommand } from './LeavePongTournament.command';

interface LeavePongTournamentRequest {
    Params: {
        tournamentId: number;
    };
}

export default async function LeavePongTournamentRoute(fastify: FastifyInstance) {
    fastify.post<LeavePongTournamentRequest>(
        '/tournaments/:tournamentId/leave',
        {
            schema: {
                description: 'Leave a Pong tournament',
                tags: ['Tournament'],
                security: [{ bearerAuth: [] }],
                params: {
                    type: 'object',
                    properties: {
                        tournamentId: {
                            type: 'number',
                            description: 'ID of the tournament to leave',
                        },
                    },
                    required: ['tournamentId'],
                },
                response: {
                    200: {
                        description: 'Successfully left the tournament',
                        type: 'object',
                        properties: {
                            success: { type: 'boolean' },
                        },
                    },
                    400: {
                        description: 'Bad request - unable to leave tournament',
                        type: 'object',
                        properties: {
                            error: { type: 'string' },
                        },
                    },
                    404: {
                        description: 'Tournament not found',
                        type: 'object',
                        properties: {
                            error: { type: 'string' },
                        },
                    },
                },
            },
            preHandler: [fastify.authenticate],
        },
        async (request: FastifyRequest<LeavePongTournamentRequest>, reply: FastifyReply) => {
            const command = new LeavePongTournamentCommand(fastify);

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
