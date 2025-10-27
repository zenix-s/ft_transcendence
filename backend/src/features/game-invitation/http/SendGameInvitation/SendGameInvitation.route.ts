import { FastifyInstance } from 'fastify/types/instance';
import { FastifyReply } from 'fastify/types/reply';
import SendGameInvitationCommand from './SendGameInvitation.command.js';
import { FastifyRequest } from 'fastify/types/request';

interface SendGameInvitationRequest {
    Body: {
        username: string;
        gameId: number;
        message?: string;
    };
}

export default async function SendGameInvitationRoute(fastify: FastifyInstance) {
    fastify.post(
        '/send-invitation',
        {
            schema: {
                description: 'Send a game invitation to a user',
                tags: ['Game Invitation'],
                security: [{ bearerAuth: [] }],
                body: {
                    type: 'object',
                    required: ['username', 'gameId'],
                    properties: {
                        username: {
                            type: 'string',
                            description: 'Username of the user to invite',
                        },
                        gameId: {
                            type: 'number',
                            description: 'ID of the game to invite to',
                        },
                        message: {
                            type: 'string',
                            description: 'Optional custom message',
                            maxLength: 200,
                        },
                    },
                },
                response: {
                    200: {
                        description: 'Invitation sent successfully',
                        type: 'object',
                        properties: {
                            success: { type: 'boolean' },
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
                        description: 'User not found',
                        type: 'object',
                        properties: {
                            error: { type: 'string' },
                        },
                    },
                    409: {
                        description: 'User not connected',
                        type: 'object',
                        properties: {
                            error: { type: 'string' },
                        },
                    },
                    422: {
                        description: 'Game type does not support invitations',
                        type: 'object',
                        properties: {
                            error: { type: 'string' },
                        },
                    },
                },
            },
        },
        async (req: FastifyRequest<SendGameInvitationRequest>, reply: FastifyReply) => {
            const sendGameInvitationCommand = new SendGameInvitationCommand(fastify);
            const userId = req.user?.id;
            const request = {
                fromUserId: userId,
                username: req.body.username,
                gameId: req.body.gameId,
                message: req.body.message,
            };

            return fastify.handleCommand({
                command: sendGameInvitationCommand,
                request: request,
                reply: reply,
                successStatus: 200,
            });
        }
    );
}
