import { WebSocket } from '@fastify/websocket';

export interface WebSocketMessage {
    action: number;
    gameId?: number;
}

export interface ConnectionInfo {
    socket: WebSocket;
    gameId: number;
    playerId: number;
}

export interface WebSocketHandlerResponse {
    response: string;
    gameStarted?: boolean;
}
