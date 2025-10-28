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
