import { WebSocket } from '@fastify/websocket';

export interface WebSocketMessage {
    action: number;
    userId?: string;
    gameId?: string;
}

export interface ConnectionInfo {
    socket: WebSocket;
    gameId: string;
    playerId: string;
}

export interface WebSocketHandlerResponse {
    response: string;
    gameStarted?: boolean;
}
