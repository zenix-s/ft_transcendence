import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { UserRepository } from './infrastructure/User.repository';
import CreateUserCommand from './application/commands/CreateUser.command';
import LoginCommand from './application/commands/Login.command';
import GetCurrentUserQuery from './application/queries/GetCurrentUser.query';
import { ILoginRequest, IRegisterRequest } from './types/auth.types';

export default async function authRoutes(fastify: FastifyInstance) {
    const userRepository = new UserRepository(fastify.dbConnection);

    // Register endpoint
    fastify.post(
        '/register',
        async (
            req: FastifyRequest<{ Body: IRegisterRequest }>,
            reply: FastifyReply
        ) => {
            const createUserCommand = new CreateUserCommand(
                userRepository,
                fastify
            );

            const validationResult = createUserCommand.validate(req.body);
            if (!validationResult.isSuccess) {
                return reply.status(400).send({
                    error: {
                        code: validationResult.error!.code,
                        message: validationResult.error!.message,
                    },
                });
            }

            const result = await createUserCommand.execute(req.body);
            if (!result.isSuccess) {
                return reply.status(parseInt(result.error!.code)).send({
                    error: {
                        code: result.error!.code,
                        message: result.error!.message,
                    },
                });
            }

            return reply.status(201).send(result.value);
        }
    );

    // Login endpoint
    fastify.post(
        '/login',
        async (
            req: FastifyRequest<{ Body: ILoginRequest }>,
            reply: FastifyReply
        ) => {
            const loginCommand = new LoginCommand(userRepository, fastify);

            const validationResult = loginCommand.validate(req.body);
            if (!validationResult.isSuccess) {
                return reply.status(400).send({
                    error: {
                        code: validationResult.error!.code,
                        message: validationResult.error!.message,
                    },
                });
            }

            const result = await loginCommand.execute(req.body);
            if (!result.isSuccess) {
                return reply.status(parseInt(result.error!.code)).send({
                    error: {
                        code: result.error!.code,
                        message: result.error!.message,
                    },
                });
            }

            return reply.status(200).send(result.value);
        }
    );

    // Get current user endpoint
    fastify.get(
        '/me',
        {
            preHandler: [fastify.authenticate],
        },
        async (req: FastifyRequest, reply: FastifyReply) => {
            const getCurrentUserQuery = new GetCurrentUserQuery(
                userRepository,
                fastify
            );

            const validationResult = getCurrentUserQuery.validate({
                userId: req.user.id,
            });
            if (!validationResult.isSuccess) {
                return reply.status(400).send({
                    error: {
                        code: validationResult.error!.code,
                        message: validationResult.error!.message,
                    },
                });
            }

            const result = await getCurrentUserQuery.execute({
                userId: req.user.id,
            });
            if (!result.isSuccess) {
                return reply.status(parseInt(result.error!.code)).send({
                    error: {
                        code: result.error!.code,
                        message: result.error!.message,
                    },
                });
            }

            return reply.status(200).send(result.value);
        }
    );
}
