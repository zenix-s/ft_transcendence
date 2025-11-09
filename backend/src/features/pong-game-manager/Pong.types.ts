import { GameStatus, CountdownType } from '@shared/constants/GameConstants';

export enum Actions {
    AUTH,
    REQUEST_STATE,
    MOVE_UP,
    MOVE_DOWN,
    SET_READY,
    MODIFY_SETTINGS,
    LEAVE_GAME,
}

export const PossibleActions: Actions[] = [
    Actions.AUTH,
    Actions.REQUEST_STATE,
    Actions.MOVE_UP,
    Actions.MOVE_DOWN,
    Actions.SET_READY,
    Actions.MODIFY_SETTINGS,
    Actions.LEAVE_GAME,
];

/**
 * Información del countdown actual
 */
export interface CountdownInfo {
    type: CountdownType | null;
    remainingTime: number; // segundos restantes
    isActive: boolean;
}

/**
 * Configuración para iniciar un countdown
 */
export interface CountdownConfig {
    duration: number; // en segundos
    onComplete: () => void;
    onTick?: (remainingTime: number) => void;
}

/**
 * Estado de un jugador
 */
export interface PlayerState {
    id: string;
    username: string;
    position: number;
    score: number;
    isReady: boolean;
}

/**
 * Estado de la pelota
 */
export interface BallState {
    position: { x: number; y: number };
    velocity: { x: number; y: number };
}

/**
 * Reglas del juego
 */
export interface GameRules {
    winnerScore: number;
    maxGameTime: number | undefined;
    difficulty?: number;
}

/**
 * Estado completo del juego
 */
export interface GameState {
    gameStatus: GameStatus;
    gameTimer: number;
    player1: PlayerState | null;
    player2: PlayerState | null;
    ball: BallState;
    arePlayersReady: boolean;
    gameRules: GameRules;
    isGameOver: boolean;
    winner: string | null;
    isSinglePlayer: boolean;
    isCancelled?: boolean;
    countdownInfo: CountdownInfo;
}

/**
 * Configuración del juego
 */
export interface GameSettings {
    winnerScore?: number;
    maxGameTime?: number;
    difficulty?: number;
}
