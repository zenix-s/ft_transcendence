import { FastifyInstance } from 'fastify/types/instance';
import { FastifyRequest } from 'fastify/types/request';
import CreateUserCommand, { IRegisterRequest } from './CreateUser.command';
import { FastifyReply } from 'fastify/types/reply';

export default async function CreateUserRoute(fastify: FastifyInstance) {
    fastify.post(
        '/register',
        {
            schema: {
                description: 'Register a new user account',
                tags: ['Authentication'],
                body: {
                    type: 'object',
                    required: ['username', 'email', 'password'],
                    properties: {
                        username: {
                            type: 'string',
                            description: 'Unique username for the account',
                        },
                        email: {
                            type: 'string',
                            description: 'Valid email address',
                        },
                        password: {
                            type: 'string',
                            description: 'Strong password for the account',
                        },
                    },
                },
                response: {
                    201: {
                        description: 'User successfully registered',
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
                    409: {
                        description: 'User already exists',
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
        async (req: FastifyRequest<{ Body: IRegisterRequest }>, reply: FastifyReply) => {
            const createUserCommand = new CreateUserCommand(fastify);

            return fastify.handleCommand({
                command: createUserCommand,
                request: req.body,
                reply,
                successStatus: 201,
            });
        }
    );
}
