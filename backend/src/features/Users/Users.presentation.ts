import { FastifyInstance } from "fastify";
import GetUsersQuery from "./Application/Queries/getUsers/GetUsers.handler";
import { IUserRepository } from "./Application/Repositories/User.IRepository";
import { UserRepository } from "./Infrastructure/User.repository";

export default async function usersRoutes(fastify: FastifyInstance) {
    const userRepository = new UserRepository(fastify.dbConnection);

    fastify.get("/", async (req, reply) => {
        const getUsersQuery = new GetUsersQuery(userRepository);
        const result = await getUsersQuery.execute({ page: 1, limit: 10 });
        reply.send(result);
    });
}
