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

            const validationResult = createUserCommand.validate(req.body);
            if (!validationResult.isSuccess) {
                return reply.status(400).send({
                    error: validationResult.error,
                });
            }

            const result = await createUserCommand.execute(req.body);
            if (!result.isSuccess) {
                return reply.status(409).send({ error: result.error });
            }

            return reply.status(201).send(result.value);
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

            const validationResult = loginCommand.validate(req.body);
            if (!validationResult.isSuccess) {
                return reply.status(400).send({
                    error: validationResult.error,
                });
            }

            const result = await loginCommand.execute(req.body);
            if (!result.isSuccess) {
                return reply.status(401).send({
                    error: result.error,
                });
            }

            return reply.status(200).send(result.value);
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

            const validationResult = getCurrentUserQuery.validate({
                userId: req.user.id,
            });
            if (!validationResult.isSuccess) {
                return reply.status(400).send({
                    error: validationResult.error,
                });
            }

            const result = await getCurrentUserQuery.execute({
                userId: req.user.id,
            });
            if (!result.isSuccess) {
                return reply.status(404).send({
                    error: result.error,
                });
            }

            return reply.status(200).send(result.value);
        }
    );
}
