import { FastifyInstance } from 'fastify/types/instance';
import { FastifyReply } from 'fastify/types/reply';
import SendGameInvitationCommand from './SendGameInvitation.command.js';
import { FastifyRequest } from 'fastify/types/request';

interface SendGameInvitationRequest {
    Body: {
        toUserId: number;
        gameType?: string;
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
                    required: ['toUserId'],
                    properties: {
                        toUserId: {
                            type: 'number',
                            description: 'ID of the user to invite',
                        },
                        gameType: {
                            type: 'string',
                            description: 'Type of game to invite to',
                            default: 'pong',
                            enum: ['pong'],
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
                            message: { type: 'string' },
                            toUserId: { type: 'number' },
                            toUsername: { type: 'string' },
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
                },
            },
        },
        async (req: FastifyRequest<SendGameInvitationRequest>, reply: FastifyReply) => {
            const sendGameInvitationCommand = new SendGameInvitationCommand(fastify);
            const userId = req.user?.id;
            const request = {
                fromUserId: userId,
                toUserId: req.body.toUserId,
                gameType: req.body.gameType || 'pong',
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
