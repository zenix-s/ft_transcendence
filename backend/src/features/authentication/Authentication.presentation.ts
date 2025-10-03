import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { UserRepository } from '@shared/infrastructure/repositories';
import CreateUserCommand from './application/mediators/CreateUser.command';
import LoginCommand from './application/mediators/Login.command';
import GetCurrentUserQuery from './application/mediators/GetCurrentUser.query';
import { ILoginRequest } from './application/mediators/Login.command';
import { IRegisterRequest } from './application/mediators/CreateUser.command';

export default async function authRoutes(fastify: FastifyInstance) {
    const userRepository = new UserRepository(fastify.dbConnection);

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
            const createUserCommand = new CreateUserCommand(userRepository, fastify);

            return fastify.handleCommand({
                command: createUserCommand,
                request: req.body,
                reply,
                successStatus: 201,
            });
        }
    );

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
            const loginCommand = new LoginCommand(userRepository, fastify);

            return fastify.handleCommand({
                command: loginCommand,
                request: req.body,
                reply: reply,
                successStatus: 200,
            });
        }
    );

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
            const getCurrentUserQuery = new GetCurrentUserQuery(userRepository, fastify);

            return fastify.handleCommand({
                command: getCurrentUserQuery,
                request: { userId: req.user.id },
                reply,
                successStatus: 200,
            });
        }
    );
}
