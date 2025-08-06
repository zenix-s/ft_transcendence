import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import CreateUserCommand from "./createUser/createUser.handler";

export default async function UserRoutes(
    fastify: FastifyInstance,
    opts: FastifyPluginOptions,
) {
    fastify.get("/", async (request, reply) => {
        const command = new CreateUserCommand();
        const response = await command.execute({
            email: "sergio@gmail.com",
            username: "sergio",
        });
        reply.send(response);
    });
}
