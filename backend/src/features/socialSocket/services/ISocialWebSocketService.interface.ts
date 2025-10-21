import { WebSocket } from '@fastify/websocket';
import { Result } from '@shared/abstractions/Result';
import { Friend, SocialWebSocketMessage, SocialWebSocketResponse } from '../Social.types';
import { SendGameInvitationNotification } from '@features/game-invitation/GameInvitation.types';

export interface ISocialWebSocketService {
    /**
     * Autentica un usuario usando token JWT
     */
    authenticateUser(token: string): Promise<Result<number>>;

    /**
     * Obtiene la lista de amigos de un usuario específico
     */
    getFriendsList(userId: number): Promise<Result<Friend[]>>;

    /**
     * Actualiza el estado de conexión del usuario en la base de datos
     */
    updateUserConnectionStatus(userId: number, isConnected: boolean): Promise<Result<void>>;

    /**
     * Agrega una conexión WebSocket activa para un usuario
     */
    addActiveConnection(userId: number, socket: WebSocket): void;

    /**
     * Elimina una conexión WebSocket activa para un usuario
     */
    removeActiveConnection(userId: number): void;

    /**
     * Notifica a los amigos sobre el cambio de estado de conexión del usuario
     */
    notifyFriendsConnectionStatus(userId: number, isConnected: boolean): Promise<void>;

    /**
     * Envía una notificación de invitación de juego a un usuario
     */
    sendGameInvitation(notification: SendGameInvitationNotification): Promise<Result<void>>;

    /**
     * Envía un mensaje WebSocket a un socket específico
     */
    sendMessage(socket: WebSocket, response: SocialWebSocketResponse): void;

    /**
     * Envía un mensaje de error a un WebSocket
     */
    sendError(socket: WebSocket, error: string): void;

    /**
     * Envía un mensaje de autenticación exitosa
     */
    sendAuthSuccess(socket: WebSocket, userId: number): void;

    /**
     * Envía la lista de amigos a un WebSocket
     */
    sendFriendsList(socket: WebSocket, friends: Friend[]): void;

    /**
     * Envía una actualización del estado de conexión de un amigo
     */
    sendFriendConnectionStatus(
        socket: WebSocket,
        friendId: number,
        username: string,
        isConnected: boolean
    ): void;

    /**
     * Valida el formato del mensaje WebSocket entrante
     */
    validateMessage(data: unknown): data is SocialWebSocketMessage;
}
