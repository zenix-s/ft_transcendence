import { WebSocket } from '@fastify/websocket';
import assert from 'node:assert';
import { FastifyInstance } from 'fastify';
import { PossibleActions, Acciones } from './Pong.types';
import { Games, PongGame } from './dominio/PongGame';

interface Mensaje {
    accion: Acciones;
    userId?: string;
    gameId?: string;
}

function validarMensaje(data: any): data is Mensaje {
    try {
        assert.ok(PossibleActions.includes(data.accion));
        if (data.userId) assert.equal(typeof data.userId, 'string');
        if (data.gameId) assert.equal(typeof data.gameId, 'string');

        return true;
    } catch (error) {
        return false;
    }
}

export default async function gameRoutes(fastify: FastifyInstance) {
    // HTTP
    fastify.post('/create', async (request, reply) => {
        const { gameId, game } = PongGame.createGame();
        Games.set(gameId, game);
        return reply.send({
            mensaje: `Juego creado con ID: ${gameId}`,
            gameId: gameId,
        });
    });

    fastify.post('/join/:gameId', async (request, reply) => {
        const { gameId } = request.params as { gameId: string };
        const userId = crypto.randomUUID();
        const game = Games.get(gameId);
        if (!game) {
            return reply.code(404).send({ error: 'Juego no encontrado' });
        }
        const added = game.addPlayer(userId);
        if (!added) {
            return reply.code(400).send({ error: 'Juego lleno' });
        }
        return reply.send({
            mensaje: `Te has unido al juego ${gameId}`,
            userId: userId,
        });
    });

    fastify.post('/start/:gameId', async (request, reply) => {
        const { gameId } = request.params as { gameId: string };
        const game = Games.get(gameId);
        if (!game) {
            return reply.code(404).send({ error: 'Juego no encontrado' });
        }
        game.startGame();
        return reply.send({
            mensaje: `Juego ${gameId} empezado`,
        });
    });

    // WebSocket endpoint
    fastify.get('/', { websocket: true }, (socket: WebSocket) => {
        socket.on('message', (message) => {
            try {
                const json = JSON.parse(message.toString());

                if (!validarMensaje(json)) {
                    socket.send(JSON.stringify({ error: 'Formato inválido' }));
                    return;
                }

                if (json.accion === Acciones.SOLICITAR_ESTADO) {
                    if (!json.gameId) {
                        socket.send(JSON.stringify({ error: 'Faltan parámetros' }));
                        return;
                    }
                    const game = Games.get(json.gameId);
                    if (!game) {
                        socket.send(JSON.stringify({ error: 'Juego no encontrado' }));
                        return;
                    }
                    socket.send(
                        JSON.stringify({
                            mensaje: `Contador de ${json.gameId}: ${game['contador']}`,
                        })
                    );
                }

                if (json.accion === Acciones.MOVER_ARRIBA) {
                    socket.send(
                        JSON.stringify({
                            mensaje: `Arriba`,
                        })
                    );
                }

                if (json.accion === Acciones.MOVER_ABAJO) {
                    socket.send(
                        JSON.stringify({
                            mensaje: `Abajo`,
                        })
                    );
                }

                if (json.accion === Acciones.SALIR_JUEGO) {
                    socket.send(
                        JSON.stringify({
                            mensaje: `Salir`,
                        })
                    );
                }

                if (!PossibleActions.includes(json.accion)) {
                    socket.send(JSON.stringify({ error: 'Acción desconocida' }));
                }
            } catch (err) {
                socket.send(JSON.stringify({ error: 'JSON inválido' }));
            }
        });
    });
}
