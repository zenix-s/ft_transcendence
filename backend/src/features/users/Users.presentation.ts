import { FastifyInstance } from "fastify";
import GetUsersQuery from "./application/query/getUsers/GetUsers.handler";
import { UserRepository } from "./infrastructure/User.repository";

export default async function usersRoutes(fastify: FastifyInstance) {
    const userRepository = new UserRepository(fastify.dbConnection);

    fastify.get("/", async (req, reply) => {
        const getUsersQuery = new GetUsersQuery(userRepository);
        const result = await getUsersQuery.execute({ page: 1, limit: 10 });
        reply.send(result);
    });
}
