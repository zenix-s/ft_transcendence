export interface IAuthenticatedUser {
    id: number;
    username: string;
    email: string;
    avatar?: string;
}

export interface IJWTPayload {
    id: number;
    username: string;
    email: string;
    iat?: number;
    exp?: number;
}
