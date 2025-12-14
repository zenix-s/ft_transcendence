import { WebSocket } from '@fastify/websocket';
import { WebSocketMessage, WebSocketResponse } from './PongWebSocketService';

export interface IPongService {
    /**
     * Maneja la solicitud de estado del juego
     */
    handleRequestState(gameId?: number): Promise<WebSocketResponse>;

    /**
     * Maneja el movimiento de la paleta del jugador
     */
    handleMovePaddle(
        gameId: number | null,
        playerId: number | null,
        direction: 'up' | 'down'
    ): Promise<WebSocketResponse>;

    /**
     * Maneja cuando un jugador se marca como listo
     */
    handleSetPlayerReady(
        gameId: number | null,
        playerId: number | null
    ): Promise<{ response: WebSocketResponse; gameStarted: boolean }>;

    /**
     * Envía un mensaje WebSocket a un socket específico
     */
    sendMessage(socket: WebSocket, response: WebSocketResponse): void;

    /**
     * Envía un mensaje de error a un WebSocket
     */
    sendError(socket: WebSocket, error: string): void;

    /**
     * Envía un mensaje de autenticación exitosa
     */
    sendAuthSuccess(socket: WebSocket, userId: number): void;

    /**
     * Valida el formato del mensaje WebSocket entrante
     */
    validateMessage(data: unknown): data is WebSocketMessage;
}
