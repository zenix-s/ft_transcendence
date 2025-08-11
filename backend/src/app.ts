import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import dbPlugin from "@shared/infrastructure/db/db";
import usersRoutes from "@features/Users/Users.presentation";

async function App(fastify: FastifyInstance) {
    fastify.setErrorHandler(
        (error: Error, req: FastifyRequest, res: FastifyReply) => {
            fastify.log.error(error);

            if (error.message.includes("Database")) {
                res.status(503).send({
                    statusCode: 503,
                    error: "Service Unavailable",
                    message: "Database connection error",
                });
                return;
            }

            res.status(500).send({
                statusCode: 500,
                error: "Internal Server Error",
                message: "An unexpected error occurred.",
            });
        },
    );

    await fastify.register(dbPlugin);

    await fastify.register(usersRoutes, { prefix: "/users" });
}

export default fp(App);
