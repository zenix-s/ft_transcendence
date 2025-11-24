import { WebSocket } from '@fastify/websocket';
import { FastifyInstance } from 'fastify';

export enum TournamentSocketActions {
    AUTH = 'auth',
    TOURNAMENT_STARTED = 'tournamentStarted',
    TOURNAMENT_ENDED = 'tournamentEnded',
    TOURNAMENT_STATE_UPDATED = 'tournamentStateUpdated',
    MATCH_CREATED = 'matchCreated',
    MATCH_RESULT = 'matchResult',
    NEW_ROUND_STARTED = 'newRoundStarted',
    TOURNAMENT_WON = 'tournamentWon',
    ERROR = 'error',
}

export interface TournamentWebSocketMessage {
    action: TournamentSocketActions;
    tournamentId?: number;
    userId?: number;
    targetUserId?: number;
    matchId?: number;
    opponentId?: number | null;
    isAgainstAI?: boolean;
    roundNumber?: number;
    payload?: unknown;
    token?: string;
    error?: string;
}

export class TournamentWebSocketService {
    private connections: Map<number, WebSocket[]> = new Map<number, WebSocket[]>();

    constructor(private readonly fastify: FastifyInstance) {}

    addConnection(userId: number, socket: WebSocket) {
        if (!this.connections.has(userId)) {
            this.connections.set(userId, []);
        }
        const sockets = this.connections.get(userId);
        if (sockets) {
            sockets.push(socket);
        }
    }

    removeConnection(userId: number, socket: WebSocket) {
        if (!this.connections.has(userId)) return;
        const socketsArray = this.connections.get(userId);
        if (!socketsArray) return;
        const sockets = socketsArray.filter((s) => s !== socket);
        if (sockets.length === 0) {
            this.connections.delete(userId);
        } else {
            this.connections.set(userId, sockets);
        }
    }

    async broadcastToTournament(tournamentId: number, message: TournamentWebSocketMessage) {
        try {
            // Obtener el torneo con sus participantes
            const tournamentResult = await this.fastify.TournamentRepository.findById({ id: tournamentId });
            if (!tournamentResult.isSuccess || !tournamentResult.value) {
                return;
            }

            const tournament = tournamentResult.value;
            const participantIds = tournament.participantIds;

            // Enviar mensaje a cada participante conectado
            participantIds.forEach((userId) => {
                this.sendToUser(userId, message);
            });
        } catch (error) {
            this.fastify.log.error(error, 'Error broadcasting to tournament');
        }
    }

    sendToUser(userId: number, message: TournamentWebSocketMessage) {
        const sockets = this.connections.get(userId);
        if (!sockets) return;
        sockets.forEach((socket) => {
            if (socket.readyState === socket.OPEN) {
                socket.send(JSON.stringify(message));
            }
        });
    }

    sendError(socket: WebSocket, error: string) {
        socket.send(
            JSON.stringify({
                action: TournamentSocketActions.ERROR,
                error,
            })
        );
    }

    validateMessage(data: unknown): boolean {
        return (
            typeof data === 'object' &&
            data !== null &&
            'action' in data &&
            typeof (data as { action: unknown }).action === 'string'
        );
    }

    async authenticateUser(token: string): Promise<{ isSuccess: boolean; value?: number }> {
        try {
            const decoded = await this.fastify.jwt.verify(token);
            if (typeof decoded === 'object' && decoded !== null && 'id' in decoded) {
                return { isSuccess: true, value: decoded.id as number };
            }
            return { isSuccess: false };
        } catch {
            return { isSuccess: false };
        }
    }

    sendAuthSuccess(socket: WebSocket, userId: number) {
        socket.send(
            JSON.stringify({
                action: TournamentSocketActions.AUTH,
                userId,
            })
        );
    }

    notifyTournamentStarted(tournamentId: number) {
        this.broadcastToTournament(tournamentId, {
            action: TournamentSocketActions.TOURNAMENT_STARTED,
            tournamentId,
            payload: { message: 'El torneo ha comenzado.' },
        });
    }

    notifyTournamentEnded(tournamentId: number) {
        this.broadcastToTournament(tournamentId, {
            action: TournamentSocketActions.TOURNAMENT_ENDED,
            tournamentId,
            payload: { message: 'El torneo ha finalizado.' },
        });
    }

    notifyMatchResult(tournamentId: number, matchId: number, winnerId: number, loserId: number) {
        this.broadcastToTournament(tournamentId, {
            action: TournamentSocketActions.MATCH_RESULT,
            tournamentId,
            matchId,
            payload: { winnerId, loserId, message: 'Resultado de partida registrado.' },
        });
    }

    notifyTournamentStateUpdated(tournamentId: number) {
        this.broadcastToTournament(tournamentId, {
            action: TournamentSocketActions.TOURNAMENT_STATE_UPDATED,
            tournamentId,
            payload: { message: 'El estado del torneo ha sido actualizado.' },
        });
    }

    notifyMatchCreated(
        tournamentId: number,
        userId: number,
        matchId: number,
        opponentId: number | null,
        isAgainstAI: boolean,
        roundNumber: number
    ) {
        this.sendToUser(userId, {
            action: TournamentSocketActions.MATCH_CREATED,
            tournamentId,
            matchId,
            opponentId,
            isAgainstAI,
            roundNumber,
            payload: {
                message: `Tu partida de la ronda ${roundNumber} ha sido creada.`,
            },
        });
    }

    notifyNewRoundStarted(tournamentId: number, roundNumber: number) {
        this.broadcastToTournament(tournamentId, {
            action: TournamentSocketActions.NEW_ROUND_STARTED,
            tournamentId,
            roundNumber,
            payload: {
                message: `Comienza la ronda ${roundNumber}.`,
            },
        });
    }

    notifyTournamentWon(tournamentId: number, winnerId: number) {
        this.sendToUser(winnerId, {
            action: TournamentSocketActions.TOURNAMENT_WON,
            tournamentId,
            userId: winnerId,
            payload: {
                message: '¡Felicidades! Has ganado el torneo.',
            },
        });
    }
}

export default async function tournamentWebSocketRoutes(fastify: FastifyInstance) {
    const webSocketService = fastify.TournamentWebSocketService;

    fastify.get(
        '/',
        {
            websocket: true,
            schema: {
                description: 'WebSocket endpoint for tournament events',
                tags: ['Tournament'],
                security: [{ bearerAuth: [] }],
            },
        },
        (socket: WebSocket) => {
            let currentUserId: number | null = null;
            let isAuthenticated = false;

            socket.on('message', async (message) => {
                try {
                    const data = JSON.parse(message.toString());

                    if (!webSocketService.validateMessage(data)) {
                        webSocketService.sendError(socket, 'invalidFormat');
                        return;
                    }

                    const { action, token } = data as TournamentWebSocketMessage;

                    if (!(Object.values(TournamentSocketActions) as string[]).includes(action)) {
                        webSocketService.sendError(socket, 'unknownAction');
                        return;
                    }

                    if (action === TournamentSocketActions.AUTH) {
                        if (!token) {
                            webSocketService.sendError(socket, 'missingToken');
                            return;
                        }
                        const authResult = await webSocketService.authenticateUser(token);
                        if (!authResult.isSuccess || typeof authResult.value !== 'number') {
                            webSocketService.sendError(socket, 'invalidToken');
                            socket.close();
                            return;
                        }
                        isAuthenticated = true;
                        currentUserId = authResult.value;
                        webSocketService.addConnection(currentUserId, socket);
                        webSocketService.sendAuthSuccess(socket, currentUserId);
                        return;
                    }

                    if (!isAuthenticated || !currentUserId) {
                        webSocketService.sendError(socket, 'notAuthenticated');
                        socket.close();
                        return;
                    }

                    // Aquí se pueden manejar otros eventos como desafíos, resultados, etc.
                    // Los eventos principales se manejan desde los comandos HTTP
                } catch (err) {
                    fastify.log.error(err, 'WebSocket message error');
                    webSocketService.sendError(socket, 'serverError');
                }
            });

            socket.on('close', () => {
                if (currentUserId) {
                    webSocketService.removeConnection(currentUserId, socket);
                }
            });

            socket.on('error', (error) => {
                fastify.log.error(error, 'WebSocket connection error');
            });
        }
    );
}
