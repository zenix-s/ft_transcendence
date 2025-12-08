export interface GameOptions {
    maxPoints: number;
    maxTime: number;
    gameMode: string;
}

export const Actions = {
    AUTH: 0,
    REQUEST_STATE: 1,
    MOVE_DOWN: 2,
    MOVE_UP: 3,
    SET_READY: 4,
    MODIFY_SETTINGS: 5,
    LEAVE_GAME: 6,
} as const;

export const GameDifficulty = {
    EASY: 6,
    NORMAL: 8,
    HARD: 10,
};
