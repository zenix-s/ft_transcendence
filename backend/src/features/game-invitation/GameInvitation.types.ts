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
    fromUserAvatar: string | null;
    toUserId: number;
    gameType: string;
    message: string;
}
