/**
 * Base user entity
 */
export interface IUser {
    id: number;
    username: string;
    email: string;
    password: string;
}

/**
 * User without sensitive data (for API responses)
 */
export interface IUserPublic {
    id: number;
    username: string;
    email: string;
}
