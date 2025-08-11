import userRoutes from "@features/users/Users.presentation";
import app from "./app";
import fastify from "fastify";
import { loadEnvFile } from "node:process";

const port: number = 3000;

const server = fastify({
    logger: {
        file: "logger.txt",
    },
});

const start = async () => {
    loadEnvFile();

    server.addHook("preClose", () => {
        server.log.info("Closed connection");
    });

    const signals = ["SIGTERM", "SIGINT"];

    signals.forEach((signal) => {
        process.once(signal, async () => {
            await server.close();
        });
    });

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
