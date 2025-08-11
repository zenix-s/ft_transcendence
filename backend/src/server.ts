import userRoutes from "@features/Users/Users.presentation";
import app from "./app";
import fastify from "fastify";
import { loadEnvFile } from "node:process";

const port: number = 3000;

const server = fastify();

const start = async () => {
    loadEnvFile();

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
