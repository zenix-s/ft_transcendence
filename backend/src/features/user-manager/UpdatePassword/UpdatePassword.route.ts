import { FastifyInstance } from 'fastify/types/instance';
import { FastifyReply } from 'fastify/types/reply';
import { FastifyRequest } from 'fastify/types/request';
import PasswordUpdateCommand from './UpdatePassword.command';

interface UpdatePasswordRequest {
    Body: {
        password: string;
    };
}

export default async function UpdatePasswordRoute(fastify: FastifyInstance) {
    fastify.patch(
        '/update-password',
        {
            schema: {
                description: 'Update a user password hashing it',
                tags: ['UserManager'],
                security: [{ bearerAuth: [] }],
                body: {
                    type: 'object',
                    required: ['password'],
                    properties: {
                        password: {
                            type: 'string',
                            description: 'New password to update a user',
                        },
                    },
                },
                response: {
                    200: {
                        description: 'password updated successfully',
                        type: 'object',
                        properties: {
                            message: { type: 'string' },
                            user: {
                                type: 'object',
                                properties: {
                                    id: { type: 'number' },
                                    password: { type: 'string' },
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
        async (req: FastifyRequest<UpdatePasswordRequest>, reply: FastifyReply) => {
            const updatePasswordCommand = new PasswordUpdateCommand(fastify);

            const userId = req.user.id;

            const request = {
                userId,
                password: req.body.password,
            };

            return fastify.handleCommand({
                command: updatePasswordCommand,
                request,
                reply,
                successStatus: 200,
            });
        }
    );
}
