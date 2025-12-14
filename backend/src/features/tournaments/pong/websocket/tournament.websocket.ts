import { WebSocket } from '@fastify/websocket';
import { FastifyInstance } from 'fastify';

export const TournamentSocketActions = {
    AUTH: 'auth',
    TOURNAMENT_STARTED: 'tournamentStarted',
    TOURNAMENT_ENDED: 'tournamentEnded',
    TOURNAMENT_STATE_UPDATED: 'tournamentStateUpdated',
    TOURNAMENT_LEAVE: 'tournamentLeave',
    MATCH_CREATED: 'matchCreated',
    MATCH_RESULT: 'matchResult',
    NEW_ROUND_STARTED: 'newRoundStarted',
    TOURNAMENT_WON: 'tournamentWon',
    ERROR: 'error',
} as const;

export type TournamentSocketAction = (typeof TournamentSocketActions)[keyof typeof TournamentSocketActions];

export interface TournamentWebSocketMessage {
    action: TournamentSocketAction;
    tournamentId?: number;
    tournamentName?: string;
    userId?: number;
    targetUserId?: number;
    matchId?: number;
    roundNumber?: number;
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

    sendAuthSuccess(socket: WebSocket, userId: number) {
        socket.send(
            JSON.stringify({
                action: TournamentSocketActions.AUTH,
                userId,
            })
        );
    }

    notifyTournamentStarted(tournamentId: number, tournamentName: string) {
        this.broadcastToTournament(tournamentId, {
            action: TournamentSocketActions.TOURNAMENT_STARTED,
            tournamentId,
            tournamentName,
        });
    }

    notifyTournamentEnded(tournamentId: number, tournamentName: string) {
        this.broadcastToTournament(tournamentId, {
            action: TournamentSocketActions.TOURNAMENT_ENDED,
            tournamentId,
            tournamentName,
        });
    }

    notifyMatchResult(tournamentId: number, matchId: number, tournamentName: string) {
        this.broadcastToTournament(tournamentId, {
            action: TournamentSocketActions.MATCH_RESULT,
            tournamentId,
            tournamentName,
            matchId,
        });
    }

    notifyTournamentStateUpdated(tournamentId: number, tournamentName: string) {
        this.broadcastToTournament(tournamentId, {
            action: TournamentSocketActions.TOURNAMENT_STATE_UPDATED,
            tournamentId,
            tournamentName,
        });
    }

    notifyMatchCreated(
        tournamentId: number,
        userId: number,
        matchId: number,
        roundNumber: number,
        tournamentName: string
    ) {
        this.sendToUser(userId, {
            action: TournamentSocketActions.MATCH_CREATED,
            tournamentId,
            tournamentName,
            matchId,
            roundNumber,
        });
    }

    notifyNewRoundStarted(tournamentId: number, roundNumber: number, tournamentName: string) {
        this.broadcastToTournament(tournamentId, {
            action: TournamentSocketActions.NEW_ROUND_STARTED,
            tournamentId,
            tournamentName,
            roundNumber,
        });
    }

    notifyTournamentWon(tournamentId: number, winnerId: number, tournamentName: string) {
        this.sendToUser(winnerId, {
            action: TournamentSocketActions.TOURNAMENT_WON,
            tournamentId,
            tournamentName,
            userId: winnerId,
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
                        const authResult = await fastify.authenticateWs(token);
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
