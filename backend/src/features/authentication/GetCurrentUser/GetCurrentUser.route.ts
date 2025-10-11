import { FastifyInstance } from 'fastify/types/instance';
import { FastifyReply } from 'fastify/types/reply';
import { FastifyRequest } from 'fastify/types/request';
import GetCurrentUserQuery from './GetCurrentUser.application';

export default async function GetCurrentUserRoute(fastify: FastifyInstance) {
    fastify.get(
        '/me',
        {
            preHandler: [fastify.authenticate],
            schema: {
                description: 'Get current authenticated user profile',
                tags: ['Authentication'],
                security: [{ bearerAuth: [] }],
                response: {
                    200: {
                        description: 'User profile retrieved successfully',
                        type: 'object',
                        properties: {
                            user: {
                                type: 'object',
                                properties: {
                                    id: {
                                        type: 'number',
                                    },
                                    username: {
                                        type: 'string',
                                    },
                                    email: {
                                        type: 'string',
                                    },
                                    avatar: {
                                        type: 'string',
                                        nullable: true,
                                        description: 'URL of the user avatar',
                                    },
                                },
                            },
                        },
                    },
                    400: {
                        description: 'Invalid request',
                        type: 'object',
                        properties: {
                            error: {
                                type: 'string',
                            },
                        },
                    },
                    401: {
                        description: 'Unauthorized - Missing or invalid token',
                        type: 'object',
                        properties: {
                            error: {
                                type: 'string',
                            },
                        },
                    },
                    404: {
                        description: 'User not found',
                        type: 'object',
                        properties: {
                            error: {
                                type: 'string',
                            },
                        },
                    },
                },
            },
        },
        async (req: FastifyRequest, reply: FastifyReply) => {
            const getCurrentUserQuery = new GetCurrentUserQuery(fastify);

            return fastify.handleCommand({
                command: getCurrentUserQuery,
                request: { userId: req.user.id },
                reply,
                successStatus: 200,
            });
        }
    );
}
