import type {
    FastifyInstance,
    FastifyPluginOptions,
    FastifyReply,
    FastifyRequest,
} from "fastify";
import fp from "fastify-plugin";
import userRoutes from "@features/users/users.presentation";
import { DBConnectionFactory } from "@shared/infraestructure/DBConnectionFactory";

async function App(fastify: FastifyInstance, options: FastifyPluginOptions) {
    DBConnectionFactory.stablishConnection()
        .then(() => {
            fastify.log.info("Database connection established successfully.");
        })
        .catch((error) => {
            fastify.log.error(
                "Failed to establish database connection:",
                error,
            );
            throw error;
        });

    fastify.setErrorHandler(
        (error: Error, req: FastifyRequest, res: FastifyReply) => {
            fastify.log.error(error);

            res.status(500).send({
                statusCode: 500,
                error: "Internal Server Error",
                message: "An unexpected error occurred.",
            });
        },
    );

    // Register endpoints
    fastify.register(userRoutes, { prefix: "/users" });
}

export default fp(App);
