/**
 * Constantes de tipos de juego disponibles en la aplicación
 * Basado en los tipos de juego definidos en la base de datos
 */
export const GAME_TYPES = {
    PONG: 'pong',
    SINGLE_PLAYER_PONG: 'single_player_pong',
} as const;

/**
 * Type helper para TypeScript
 */
export type GameType = (typeof GAME_TYPES)[keyof typeof GAME_TYPES];

export const CONSTANTES_DB = {
    AI_PLAYER: {
        ID: 1,
        NAME: 'AI_Player',
    },
    MATCH_TYPE: {
        SINGLE_PLAYER_PONG: {
            NAME: 'single_player_pong',
            MIN_PLAYERS: 1,
            MAX_PLAYERS: 1,
            SUPPORTS_INVITATIONS: false,
        },
        PONG: {
            NAME: 'pong',
            MIN_PLAYERS: 2,
            MAX_PLAYERS: 2,
            SUPPORTS_INVITATIONS: true,
        },
    },
} as const;
