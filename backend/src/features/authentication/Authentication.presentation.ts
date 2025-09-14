import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { UserRepository } from './infrastructure/User.repository';
import CreateUserCommand from './application/mediators/CreateUser.command';
import LoginCommand from './application/mediators/Login.command';
import GetCurrentUserQuery from './application/mediators/GetCurrentUser.query';
import { ILoginRequest } from './application/mediators/Login.command';
import { IRegisterRequest } from './application/mediators/CreateUser.command';

export default async function authRoutes(fastify: FastifyInstance) {
    const userRepository = new UserRepository(fastify.dbConnection);

    fastify.post(
        '/register',
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
                return reply.status(409).send({
                    error: result.error,
                });
            }

            return reply.status(201).send(result.value);
        }
    );

    fastify.post('/login', async (req: FastifyRequest<{ Body: ILoginRequest }>, reply: FastifyReply) => {
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
    });

    fastify.get(
        '/me',
        {
            preHandler: [fastify.authenticate],
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
