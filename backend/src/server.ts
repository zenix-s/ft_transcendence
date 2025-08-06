import fastify from "fastify";

const port: number = 3000;

const server = fastify();

server.get("/", async (request, reply) => {
    return { message: "Hola mundo" };
});

server.listen({ port }, (err, address) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`Server is running at ${address}`);
});
