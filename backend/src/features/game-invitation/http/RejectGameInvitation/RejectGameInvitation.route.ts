import { FastifyInstance } from 'fastify/types/instance';
import { FastifyReply } from 'fastify/types/reply';
import RejectGameInvitationCommand from './RejectGameInvitation.command';
import { FastifyRequest } from 'fastify/types/request';

interface RejectGameInvitationRequest {
    Body: {
        gameId: number;
    };
}

export default async function RejectGameInvitationRoute(fastify: FastifyInstance) {
    fastify.post(
        '/reject-invitation',
        {
            schema: {
                description: 'Reject a game invitation',
                tags: ['Game Invitation'],
                security: [{ bearerAuth: [] }],
                body: {
                    type: 'object',
                    required: ['gameId'],
                    properties: {
                        gameId: {
                            type: 'number',
                            description: 'ID of the game to reject invitation for',
                        },
                    },
                },
                response: {
                    200: {
                        description: 'Invitation rejected successfully',
                        type: 'object',
                        properties: {
                            success: { type: 'boolean' },
                            message: {
                                type: 'string',
                                description: 'Success message',
                            },
                        },
                    },
                    400: {
                        description: 'Invalid request parameters',
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
                    422: {
                        description: 'Game type not supported or does not support invitations',
                        type: 'object',
                        properties: {
                            error: { type: 'string' },
                        },
                    },
                },
            },
        },
        async (req: FastifyRequest<RejectGameInvitationRequest>, reply: FastifyReply) => {
            const rejectGameInvitationCommand = new RejectGameInvitationCommand(fastify);
            const userId = req.user?.id;
            const request = {
                userId: userId,
                gameId: req.body.gameId,
            };

            return fastify.handleCommand({
                command: rejectGameInvitationCommand,
                request: request,
                reply: reply,
                successStatus: 200,
            });
        }
    );
}
