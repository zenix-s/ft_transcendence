import { FastifyInstance, FastifyReply } from 'fastify';
import GetUsersQuery from './application/query/GetUsers.query';
import { UserRepository } from './infrastructure/User.repository';
import { FastifyRequest } from 'fastify/types/request';
import CreateUserCommand from './application/command/CreaetUser.Command';

export default async function usersRoutes(fastify: FastifyInstance) {
    const userRepository = new UserRepository(fastify.dbConnection);

    fastify.get('/', async (req, reply) => {
        const getUsersQuery = new GetUsersQuery(userRepository);
        const { page, limit } = req.query as { page?: number; limit?: number };

        const validationResult = getUsersQuery.validate({ page, limit });
        if (!validationResult.isSuccess) {
            return reply.status(400).send({
                error: {
                    code: validationResult.error!.code,
                    message: validationResult.error!.message,
                },
            });
        }

        const result = await getUsersQuery.execute({
            page: page || 1,
            limit: limit || 10,
        });
        if (!result.isSuccess) {
            return reply.status(parseInt(result.error!.code)).send({
                error: {
                    code: result.error!.code,
                    message: result.error!.message,
                },
            });
        }

        reply.send(result.value);
    });

    fastify.post('/', async (req: FastifyRequest, reply: FastifyReply) => {
        const createUserCommand = new CreateUserCommand(userRepository);
        const requestBody = req.body as {
            username: string;
            email: string;
            password: string;
        };

        const validationResult = createUserCommand.validate(requestBody);
        if (!validationResult.isSuccess) {
            return reply.status(400).send({
                error: {
                    code: validationResult.error!.code,
                    message: validationResult.error!.message,
                },
            });
        }

        const result = await createUserCommand.execute(requestBody);
        if (!result.isSuccess) {
            return reply.status(parseInt(result.error!.code)).send({
                error: {
                    code: result.error!.code,
                    message: result.error!.message,
                },
            });
        }

        reply.status(result.value!.statusCode).send(result.value);
    });
}
