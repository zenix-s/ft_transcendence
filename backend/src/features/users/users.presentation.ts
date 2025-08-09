import type {
    FastifyInstance,
    FastifyPluginOptions,
    FastifyReply,
    FastifyRequest,
} from "fastify";
import CreateUserCommand from "./createUser/createUser.handler";
import GetUsersQuery, { IGetUsersRequest } from "./getUsers/getUsers.handler";

export default async function UserRoutes(
    fastify: FastifyInstance,
    opts: FastifyPluginOptions,
) {
    fastify.post("/", async (request, reply) => {
        const command = new CreateUserCommand();
        const response = await command.execute({
            email: "sergio@gmail.com",
            username: "sergio",
        });
        reply.send(response);
    });

    fastify.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
        const query = new GetUsersQuery();
        console.log("Request received:", request.query);
        const response = await query.execute({
            page: 1,
            limit: 10,
        } as IGetUsersRequest);
        reply.send(response);
    });
}
