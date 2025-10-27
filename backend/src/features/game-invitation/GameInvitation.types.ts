export interface GameInvitation {
    fromUserId: number;
    fromUsername: string;
    toUserId: number;
    gameId: number;
    message: string;
    timestamp: Date;
}

export interface SendGameInvitationNotification {
    fromUserId: number;
    fromUsername: string;
    fromUserAvatar: string | null;
    toUserId: number;
    gameId: number;
    message: string;
}
