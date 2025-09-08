/**
 * Login request
 */
export interface ILoginRequest {
    email: string;
    password: string;
}

/**
 * Register request
 */
export interface IRegisterRequest {
    username: string;
    email: string;
    password: string;
}

/**
 * Auth response
 */
export interface IAuthResponse {
    message: string;
    token: string;
    user: {
        id: number;
        username: string;
        email: string;
    };
}

/**
 * Common auth errors
 */
export const AUTH_ERRORS = {
    INVALID_CREDENTIALS: {
        code: '401',
        message: 'Invalid credentials',
    },
    USER_NOT_FOUND: {
        code: '404',
        message: 'User not found',
    },
    USER_ALREADY_EXISTS: {
        code: '409',
        message: 'User with this email already exists',
    },
} as const;
