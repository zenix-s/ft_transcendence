import { FastifyInstance } from 'fastify/types/instance';
import { FastifyReply } from 'fastify/types/reply';
import AcceptGameInvitationCommand from './AcceptGameInvitation.command';
import { FastifyRequest } from 'fastify/types/request';

interface AcceptGameInvitationRequest {
    Body: {
        gameId: number;
        inviterUsername?: string;
    };
}

export default async function AcceptGameInvitationRoute(fastify: FastifyInstance) {
    fastify.post(
        '/accept-invitation',
        {
            schema: {
                description: 'Accept a game invitation',
                tags: ['Game Invitation'],
                security: [{ bearerAuth: [] }],
                body: {
                    type: 'object',
                    required: ['gameId'],
                    properties: {
                        gameId: {
                            type: 'number',
                            description: 'ID of the game to accept invitation for',
                        },
                        inviterUsername: {
                            type: 'string',
                            description: 'Username of the user who sent the invitation (optional)',
                        },
                    },
                },
                response: {
                    200: {
                        description: 'Invitation accepted successfully',
                        type: 'object',
                        properties: {
                            success: { type: 'boolean' },
                            gameType: {
                                type: 'string',
                                description: 'Type of game that was accepted',
                            },
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
                    409: {
                        description: 'Game is full or cannot be joined',
                        type: 'object',
                        properties: {
                            error: { type: 'string' },
                        },
                    },
                    422: {
                        description: 'Game type not supported',
                        type: 'object',
                        properties: {
                            error: { type: 'string' },
                        },
                    },
                },
            },
        },
        async (req: FastifyRequest<AcceptGameInvitationRequest>, reply: FastifyReply) => {
            const acceptGameInvitationCommand = new AcceptGameInvitationCommand(fastify);
            const userId = req.user?.id;
            const request = {
                userId: userId,
                gameId: req.body.gameId,
                inviterUsername: req.body.inviterUsername,
            };

            return fastify.handleCommand({
                command: acceptGameInvitationCommand,
                request: request,
                reply: reply,
                successStatus: 200,
            });
        }
    );
}
