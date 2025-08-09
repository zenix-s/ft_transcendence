import userRoutes from "@features/users/users.presentation";
import app from "./app";
import fastify from "fastify";

const port: number = 3000;

const server = fastify();

const start = async () => {
    try {
        await server.register(app);
        await server.listen({ port });
        console.log(`Server is running at http://localhost:${port}`);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

await start();