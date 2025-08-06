import userRoutes from "@features/users/users.presentation";
import app from "./app";
import fastify from "fastify";

const port: number = 3000;

const server = fastify();

server.register(userRoutes, { prefix: "/users" });

server.listen({ port }, (err, address) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`Server is running at ${address}`);
});
