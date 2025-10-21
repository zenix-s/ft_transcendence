export interface GameInvitation {
    fromUserId: number;
    fromUsername: string;
    toUserId: number;
    gameType: string;
    message: string;
    timestamp: Date;
}

export interface SendGameInvitationNotification {
    fromUserId: number;
    fromUsername: string;
    toUserId: number;
    gameType: string;
    message: string;
}

export enum GameType {
    PONG = 'pong',
}

export const VALID_GAME_TYPES = [GameType.PONG];
