import { WebSocket } from '@fastify/websocket';

export interface WebSocketMessage {
    action: number;
    gameId?: string;
}

export interface ConnectionInfo {
    socket: WebSocket;
    gameId: string;
    playerId: number;
}

export interface WebSocketHandlerResponse {
    response: string;
    gameStarted?: boolean;
}
