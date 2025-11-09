/**
 * Estados posibles del juego Pong
 */
export const GAME_STATUS = {
    WAITING_FOR_PLAYERS: 'waiting_for_players',
    WAITING_FOR_READY: 'waiting_for_ready',
    START_COUNTDOWN: 'start_countdown',
    PLAYING: 'playing',
    GOAL_SCORED: 'goal_scored',
    GOAL_COUNTDOWN: 'goal_countdown',
    PAUSED: 'paused',
    GAME_OVER: 'game_over',
    CANCELLED: 'cancelled'
} as const;

/**
 * Type helper para GameStatus
 */
export type GameStatus = (typeof GAME_STATUS)[keyof typeof GAME_STATUS];

/**
 * Tipos de countdown disponibles
 */
export const COUNTDOWN_TYPES = {
    START: 'start',
    GOAL: 'goal'
} as const;

/**
 * Type helper para CountdownType
 */
export type CountdownType = (typeof COUNTDOWN_TYPES)[keyof typeof COUNTDOWN_TYPES];

/**
 * Configuraciones por defecto para countdowns
 */
export const COUNTDOWN_CONFIG = {
    START_GAME_DURATION: 3, // segundos
    GOAL_RESUME_DURATION: 3, // segundos
} as const;

/**
 * Utilidades para verificar estados
 */
export const GAME_STATUS_UTILS = {
    isWaitingState: (status: GameStatus) =>
        status === GAME_STATUS.WAITING_FOR_PLAYERS || status === GAME_STATUS.WAITING_FOR_READY,

    isCountdownState: (status: GameStatus) =>
        status === GAME_STATUS.START_COUNTDOWN || status === GAME_STATUS.GOAL_COUNTDOWN,

    isActiveGameState: (status: GameStatus) =>
        status === GAME_STATUS.PLAYING,

    isEndedState: (status: GameStatus) =>
        status === GAME_STATUS.GAME_OVER || status === GAME_STATUS.CANCELLED,
} as const;
