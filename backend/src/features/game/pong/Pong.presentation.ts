import { WebSocket } from '@fastify/websocket';
import assert from 'node:assert';
import { FastifyInstance } from 'fastify';
// import GetUsersQuery from "./application/query/GetUsers.query";
// import { UserRepository } from "./infrastructure/User.repository";

enum Acciones {
    CREAR_JUEGO = 0,
    SOLICITAR_ESTADO = 1,
    EMPEZAR_JUEGO = 2,
    UNIRSE_JUEGO = 3,
    MOVER_ARRIBA = 4,
    MOVER_ABAJO = 5,
    SALIR_JUEGO = 6,
}

const PossibleActions: Acciones[] = [
    Acciones.CREAR_JUEGO,
    Acciones.SOLICITAR_ESTADO,
    Acciones.EMPEZAR_JUEGO,
    Acciones.UNIRSE_JUEGO,
    Acciones.MOVER_ARRIBA,
    Acciones.MOVER_ABAJO,
    Acciones.SALIR_JUEGO,
];

interface Mensaje {
    accion: Acciones;
    userId?: string;
    gameId?: string;
}

class pongPlayer {
    private name: string;
    private score: number = 0;
    private position: number = 0;
    private speed: number = 1;

    constructor(name: string) {
        this.name = name;
    }
}

class pongGame {
    private gameIdent: string = '';
    private isRunning: boolean = false;
    private player1?: pongPlayer;
    private player2?: pongPlayer;

    private contador: number = 0;
    private intervalId?: NodeJS.Timeout;

    constructor(gameid: string) {
        this.gameIdent = gameid;
    }

    static createGame(): { gameId: string; game: pongGame } {
        let gameId = crypto.randomUUID();
        while (Games.has(gameId)) gameId = crypto.randomUUID();

        const game = new pongGame(gameId);

        return { gameId: gameId, game };
    }

    public addPlayer(player: string) {
        if (!this.player1) {
            this.player1 = new pongPlayer(player);
            return true;
        } else if (!this.player2) {
            this.player2 = new pongPlayer(player);
            return true;
        }
        return false;
    }

    public startGame() {
        if (this.isRunning) return;

        this.isRunning = true;

        if (!this.player1 || !this.player2) {
            this.isRunning = false;
            return;
        }

        this.intervalId = setInterval(() => {
            // console.log("Game running between " + this.player1 + " and " + this.player2);
            this.updateGame();

            if (this.contador > 10) {
                this.isRunning = false;
                Games.delete(this.gameIdent);
                clearInterval(this.intervalId);
            }

            console.log('hola mundo');
        }, 1000);
    }

    public updateGame() {
        this.contador += 1;
    }
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

const Games: Map<string, pongGame> = new Map();

export default async function gameRoutes(fastify: FastifyInstance) {
    fastify.get('/', { websocket: true }, (socket: WebSocket) => {
        socket.on('message', (message) => {
            try {
                const json = JSON.parse(message.toString());

                if (!validarMensaje(json)) {
                    socket.send(JSON.stringify({ error: 'Formato inválido' }));
                    return;
                }

                if (json.accion === Acciones.CREAR_JUEGO) {
                    const { gameId, game } = pongGame.createGame();
                    Games.set(gameId, game);
                    socket.send(
                        JSON.stringify({
                            mensaje: `Juego creado con ID: ${gameId}`,
                            gameId: gameId,
                        })
                    );
                }

                if (json.accion === Acciones.EMPEZAR_JUEGO) {
                    if (!json.gameId) {
                        socket.send(
                            JSON.stringify({ error: 'Faltan parámetros' })
                        );
                        return;
                    }
                    const game = Games.get(json.gameId);
                    if (!game) {
                        socket.send(
                            JSON.stringify({ error: 'Juego no encontrado' })
                        );
                        return;
                    }
                    game.startGame();
                    socket.send(
                        JSON.stringify({
                            mensaje: `Juego ${json.gameId} empezado`,
                        })
                    );
                }

                if (json.accion === Acciones.UNIRSE_JUEGO) {
                    if (!json.gameId) {
                        socket.send(
                            JSON.stringify({ error: 'Faltan parámetros' })
                        );
                        return;
                    }
                    const userId = crypto.randomUUID();
                    const game = Games.get(json.gameId);
                    if (!game) {
                        socket.send(
                            JSON.stringify({ error: 'Juego no encontrado' })
                        );
                        return;
                    }
                    const added = game.addPlayer(userId);
                    if (!added) {
                        socket.send(JSON.stringify({ error: 'Juego lleno' }));
                        return;
                    }
                    socket.send(
                        JSON.stringify({
                            mensaje: `Te has unido al juego ${json.gameId}`,
                            userId: userId,
                        })
                    );
                }

                if (json.accion === Acciones.SOLICITAR_ESTADO) {
                    if (!json.gameId) {
                        socket.send(
                            JSON.stringify({ error: 'Faltan parámetros' })
                        );
                        return;
                    }
                    const game = Games.get(json.gameId);
                    if (!game) {
                        socket.send(
                            JSON.stringify({ error: 'Juego no encontrado' })
                        );
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
                    socket.send(
                        JSON.stringify({ error: 'Acción desconocida' })
                    );
                }
            } catch (err) {
                socket.send(JSON.stringify({ error: 'JSON inválido' }));
            }
        });
    });
}
