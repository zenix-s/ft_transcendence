import type { FastifyInstance, FastifyPluginOptions } from "fastify";

export default async function UserRoutes(
    fastify: FastifyInstance,
    opts: FastifyPluginOptions,
) {
    fastify.get("/", async (request, reply) => {
        return { message: "User route is working" };
    });
}
