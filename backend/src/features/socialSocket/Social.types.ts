export enum SocialActions {
    AUTH = 0,
    LIST_FRIENDS = 1,
}

export const PossibleSocialActions = [SocialActions.AUTH, SocialActions.LIST_FRIENDS];

export interface Friend {
    id: number;
    username: string;
    avatar: string | null;
    is_connected: boolean;
}

export interface SocialWebSocketMessage {
    action: SocialActions;
    token?: string;
}

export interface SocialWebSocketResponse {
    type: string;
    error?: string;
    [key: string]: unknown;
}

export interface AuthSuccessResponse extends SocialWebSocketResponse {
    type: 'authSuccess';
    userId: number;
}

export interface FriendsListResponse extends SocialWebSocketResponse {
    type: 'friendsList';
    friends: Friend[];
}

export interface ErrorResponse extends SocialWebSocketResponse {
    type: 'error';
    error: string;
}

export interface FriendConnectionStatusResponse extends SocialWebSocketResponse {
    type: 'friendConnectionStatus';
    friendId: number;
    username: string;
    isConnected: boolean;
}

export interface GameInvitationResponse extends SocialWebSocketResponse {
    type: 'gameInvitation';
    fromUserId: number;
    fromUsername: string;
    gameType: string;
    message: string;
}
