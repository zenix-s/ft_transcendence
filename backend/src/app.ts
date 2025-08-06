import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import fp from "fastify-plugin";
import userRoutes from "@features/users/users.presentation";

async function App(fastify: FastifyInstance, options: FastifyPluginOptions) {
    fastify.register(userRoutes, { prefix: "/users" });
}

export default fp(App);
