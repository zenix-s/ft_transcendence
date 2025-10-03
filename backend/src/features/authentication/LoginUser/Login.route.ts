import { FastifyInstance } from 'fastify/types/instance';
import { FastifyRequest } from 'fastify/types/request';
import LoginCommand, { ILoginRequest } from './Login.command';
import { FastifyReply } from 'fastify/types/reply';

export default async function LoginRoute(fastify: FastifyInstance) {
    fastify.post(
        '/login',
        {
            schema: {
                description: 'Authenticate user and receive JWT token',
                tags: ['Authentication'],
                body: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'User email address',
                        },
                        password: {
                            type: 'string',
                            description: 'User password',
                        },
                    },
                },
                response: {
                    200: {
                        description: 'Successfully authenticated',
                        type: 'object',
                        properties: {
                            message: {
                                type: 'string',
                            },
                            token: {
                                type: 'string',
                                description: 'JWT authentication token',
                            },
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
                                },
                            },
                        },
                    },
                    400: {
                        description: 'Invalid request data',
                        type: 'object',
                        properties: {
                            error: {
                                type: 'string',
                            },
                        },
                    },
                    401: {
                        description: 'Invalid credentials',
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
        async (req: FastifyRequest<{ Body: ILoginRequest }>, reply: FastifyReply) => {
            const loginCommand = new LoginCommand(fastify);

            console.debug('step: 01');

            return fastify.handleCommand({
                command: loginCommand,
                request: req.body,
                reply: reply,
                successStatus: 200,
            });
        }
    );
}
