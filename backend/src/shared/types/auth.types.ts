/**
 * User in JWT payload
 */
export interface IAuthenticatedUser {
    id: number;
    username: string;
    email: string;
}

/**
 * JWT payload
 */
export interface IJWTPayload {
    id: number;
    username: string;
    email: string;
    iat?: number;
    exp?: number;
}
