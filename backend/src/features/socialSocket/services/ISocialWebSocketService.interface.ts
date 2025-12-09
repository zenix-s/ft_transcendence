import { WebSocket } from '@fastify/websocket';
import { Result } from '@shared/abstractions/Result';
import {
    Friend,
    SocialWebSocketMessage,
    SocialWebSocketResponse,
    ActiveGameOpponent,
} from '../Social.types';
import { IMatchSettings } from '@shared/domain/ValueObjects/MatchSettings.value';

export interface CheckActiveGameResult {
    hasActiveGame: boolean;
    gameId?: number;
    status?: string;
    opponent?: ActiveGameOpponent;
}

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
     * Verifica si el usuario tiene un juego activo (pending o in_progress)
     */
    checkActiveGame(userId: number): Promise<Result<CheckActiveGameResult>>;

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
    sendGameInvitation({
        fromUserId,
        fromUsername,
        fromUserAvatar,
        toUserId,
        gameId,
        gameTypeName,
        message,
        matchSettings,
    }: {
        fromUserId: number;
        fromUsername: string;
        fromUserAvatar: string | null;
        toUserId: number;
        gameId: number;
        gameTypeName: string;
        message: string;
        matchSettings: IMatchSettings;
    }): Promise<Result<void>>;

    /**
     * Envía una notificación de rechazo de invitación de juego a un usuario
     */
    sendGameInvitationRejection({
        fromUserId,
        fromUsername,
        fromUserAvatar,
        toUserId,
        gameId,
        gameTypeName,
        message,
    }: {
        fromUserId: number;
        fromUsername: string;
        fromUserAvatar: string | null;
        toUserId: number;
        gameId: number;
        gameTypeName: string;
        message: string;
    }): Promise<Result<void>>;

    /**
     * Envía una notificación de aceptación de invitación de juego a un usuario
     */
    sendGameInvitationAcceptance({
        fromUserId,
        fromUsername,
        fromUserAvatar,
        toUserId,
        gameId,
        gameTypeName,
        message,
    }: {
        fromUserId: number;
        fromUsername: string;
        fromUserAvatar: string | null;
        toUserId: number;
        gameId: number;
        gameTypeName: string;
        message: string;
    }): Promise<Result<void>>;

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
     * Envía el resultado de la verificación de juego activo
     */
    sendCheckActiveGameResult(socket: WebSocket, result: CheckActiveGameResult): void;

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
     * Notifica a los amigos sobre cambios en el perfil del usuario (avatar/username)
     */
    notifyFriendsProfileUpdate(userId: number, username: string, avatar: string | null): Promise<void>;

    /**
     * Notifica a los amigos sobre cambios en el perfil del usuario obteniendo datos actualizados de la BD
     */
    notifyFriendsProfileUpdate(userId: number): Promise<void>;

    /**
     * Valida el formato del mensaje WebSocket entrante
     */
    validateMessage(data: unknown): data is SocialWebSocketMessage;
}
