export interface GameStateMessage {
    type: 'gameState';
    gameId: number;
    state: GameState;
}

interface GameState {
    gameStatus: string;
    gameTimer: number;
    player1: PlayerState;
    player2: PlayerState;
    ball: BallState;
    arePlayersReady: boolean;
    gameRules: GameRules;
    isGameOver: boolean;
    winner: Winner | null;
    isSinglePlayer: boolean;
    isCancelled: boolean;
    countdownInfo: CountdownInfo;
}

interface PlayerState {
    id: string;
    username: string;
    position: number;
    score: number;
    isReady: boolean;
}

interface BallState {
    position: {
        x: number;
        y: number;
    };
    velocity: {
        x: number;
        y: number;
    };
}

interface GameRules {
    winnerScore: number;
    maxGameTime: number;
    difficulty: number;
    visualStyle: string;
}

interface Winner {
    id: string;
    username: string;
    score: number;
}

interface CountdownInfo {
    type: string | null;
    remainingTime: number;
    isActive: boolean;
}

export interface message {
    action: number;
    gameId: number;
    token: string | null;
}

export interface ErrorMessage {
    type: 'error';
    error: string;
}

export interface events {
    keyMove: (event: KeyboardEvent) => void;
    keyStop: (event: KeyboardEvent) => void;
    buttonUpPressed: (event: Event) => void;
    buttonUpReleased: (event: Event) => void;
    buttonDownPressed: (event: Event) => void;
    buttonDownReleased: (event: Event) => void;
    handleResize: () => void;
}
