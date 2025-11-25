import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { StartTournamentCommand, IStartTournamentRequest } from './StartTournament.command';

interface StartTournamentRouteRequest {
    Params: {
        tournamentId: number;
    };
}

export default async function StartTournamentRoute(fastify: FastifyInstance) {
    fastify.post<StartTournamentRouteRequest>(
        '/tournaments/:tournamentId/start',
        {
            schema: {
                description: 'Start a Pong tournament (admin only)',
                tags: ['Tournament'],
                security: [{ bearerAuth: [] }],
                params: {
                    type: 'object',
                    properties: {
                        tournamentId: {
                            type: 'number',
                            description: 'ID of the tournament to start',
                        },
                    },
                    required: ['tournamentId'],
                },
                response: {
                    200: {
                        description: 'Tournament started successfully',
                        type: 'object',
                        properties: {
                            success: { type: 'boolean' },
                            message: { type: 'string' },
                        },
                    },
                    400: {
                        description: 'Bad request - unable to start tournament',
                        type: 'object',
                        properties: {
                            error: { type: 'string' },
                        },
                    },
                    403: {
                        description: 'Forbidden - not authorized',
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
        },
        async (request: FastifyRequest<StartTournamentRouteRequest>, reply: FastifyReply) => {
            const command = new StartTournamentCommand(fastify);

            const requestData: IStartTournamentRequest = {
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
