import { FastifyInstance } from 'fastify/types/instance';
import { FastifyReply } from 'fastify/types/reply';
import { FastifyRequest } from 'fastify/types/request';
import UsernameUpdateCommand from './UpdateUsername.command';

interface UpdateUserNameRequest {
    Body: {
        username: string;
    };
}

export default async function UpdateUsernameRoute(fastify: FastifyInstance) {
    fastify.patch(
        '/update-username',
        {
            schema: {
                description: 'Update a user name',
                tags: ['UserManager'],
                security: [{ bearerAuth: [] }],
                body: {
                    type: 'object',
                    required: ['username'],
                    properties: {
                        username: {
                            type: 'string',
                            description: 'New user name to update a user',
                        },
                    },
                },
                response: {
                    200: {
                        description: 'username updated successfully',
                        type: 'object',
                        properties: {
                            message: { type: 'string' },
                            user: {
                                type: 'object',
                                properties: {
                                    id: { type: 'number' },
                                    username: { type: 'string' },
                                },
                            },
                        },
                    },
                    400: {
                        description: 'Invalid request data',
                        type: 'object',
                        properties: {
                            error: { type: 'string' },
                        },
                    },
                },
            },
        },
        async (req: FastifyRequest<UpdateUserNameRequest>, reply: FastifyReply) => {
            const updateUsernameCommand = new UsernameUpdateCommand(fastify);

            const userId = req.user.id;

            const request = {
                userId,
                username: req.body.username,
            };

            return fastify.handleCommand({
                command: updateUsernameCommand,
                request,
                reply,
                successStatus: 200,
            });
        }
    );
}
