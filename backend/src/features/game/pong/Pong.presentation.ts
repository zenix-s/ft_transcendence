import { WebSocket } from "@fastify/websocket";
import assert from "node:assert";
import { FastifyInstance, FastifyRequest } from "fastify";
// import GetUsersQuery from "./application/query/GetUsers.query";
// import { UserRepository } from "./infrastructure/User.repository";

interface Mensaje {
    accion: string;
    valor: string | number;
}

interface Conversation {
    id: string;
    conversation: string[];
}

function validarMensaje(data: any): data is Mensaje {
    try {
        assert.equal(typeof data, "object");
        assert.notEqual(data, null);
        assert.equal(typeof data.accion, "string");
        assert.ok(
            typeof data.valor === "string" || typeof data.valor === "number",
        );
        return true;
    } catch (error) {
        return false;
    }
}

export default async function gameRoutes(fastify: FastifyInstance) {
    // const userRepository = new UserRepository(fastify.dbConnection);

    // fastify.get("/", async (req, reply) => {
    //     const getUsersQuery = new GetUsersQuery(userRepository);
    //     const result = await getUsersQuery.execute({ page: 1, limit: 10 });
    //     reply.send(result);
    // });
    //

    fastify.get(
        "/",
        { websocket: true },
        (socket: WebSocket, req: FastifyRequest) => {
            // let conversations: Conversation[] = [
            //     {
            //         id: "1",
            //         conversation: [],
            //     },
            //     {
            //         id: "2",
            //         conversation: [],
            //     },
            // ];

            // const conversations: Map<string, string[]> = new Map();

            const conversation: string[] = [];

            socket.on("message", (message) => {
                try {
                    const json = JSON.parse(message.toString());

                    if (validarMensaje(json)) {
                        if (json.accion === "1") {
                            // Agregar mensaje a la conversación
                            conversation.push(json.valor.toString());
                            socket.send("Mensaje enviado correctamente");
                        } else if (json.accion === "2") {
                            // Obtener la conversación completa
                            if (conversation.length > 0) {
                                socket.send(
                                    JSON.stringify({
                                        conversation: conversation,
                                    }),
                                );
                            } else {
                                socket.send(
                                    JSON.stringify({
                                        error: "No hay mensajes en la conversación",
                                    }),
                                );
                            }
                        }
                    } else {
                        socket.send(
                            JSON.stringify({ error: "Formato inválido" }),
                        );
                    }
                } catch (err) {
                    socket.send(JSON.stringify({ error: "JSON inválido" }));
                }
            });
        },
    );
}
