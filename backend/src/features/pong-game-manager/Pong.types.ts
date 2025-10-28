export enum Actions {
    AUTH,
    REQUEST_STATE,
    MOVE_UP,
    MOVE_DOWN,
    SET_READY,
}

export const PossibleActions: Actions[] = [
    Actions.AUTH,
    Actions.REQUEST_STATE,
    Actions.MOVE_UP,
    Actions.MOVE_DOWN,
    Actions.SET_READY,
];

export interface PlayerState {
    id: string;
    position: number;
    score: number;
    isReady: boolean;
}

export interface BallState {
    position: { x: number; y: number };
    velocity: { x: number; y: number };
}

export interface GameRules {
    winnerScore: number;
    maxGameTime: number | undefined;
}

export interface GameState {
    isRunning: boolean;
    gameTimer: number;
    player1: PlayerState | null;
    player2: PlayerState | null;
    ball: BallState;
    arePlayersReady: boolean;
    gameRules: GameRules;
    isGameOver: boolean;
    winner: string | null;
    isSinglePlayer: boolean;
}
