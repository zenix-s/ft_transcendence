export const Games = new Map<string, PongGame>();

interface PlayerState {
    position: number;
    score: number;
}

export class PongPlayer {
    private playerId: string;
    private state: PlayerState;

    constructor(playerId: string) {
        this.playerId = playerId;
        this.state = {
            position: 0,
            score: 0,
        };
    }

    public moveUp() {
        if (this.state.position < 0 || this.state.position > 100) return;

        this.state.position -= 1;
    }

    public moveDown() {
        if (this.state.position < 0 || this.state.position > 100) return;

        this.state.position += 1;
    }

    public getState(): PlayerState {
        return this.state;
    }
}

interface BallState {
    position: { x: number; y: number };
    velocity: { x: number; y: number };
}

export class PongGame {
    private gameIdentification: string;
    private isRunning: boolean;
    private player1?: PongPlayer;
    private player2?: PongPlayer;
    private ball?: BallState;

    private contador: number;
    private intervalId?: NodeJS.Timeout;
    private lastUpdate: number;

    constructor(gameid: string) {
        this.gameIdentification = gameid;
        this.isRunning = false;
        this.contador = 0;

        this.player1 = undefined;
        this.player2 = undefined;
        this.ball = {
            position: { x: 50, y: 50 },
            velocity: { x: 1, y: 1 },
        };
        this.lastUpdate = Date.now();
    }

    static createGame(): { gameId: string; game: PongGame } {
        let gameId = crypto.randomUUID();
        while (Games.has(gameId)) gameId = crypto.randomUUID();

        const game = new PongGame(gameId);

        return { gameId: gameId, game };
    }

    public addPlayer(player: string) {
        if (!this.player1) {
            this.player1 = new PongPlayer(player);
            return true;
        } else if (!this.player2) {
            this.player2 = new PongPlayer(player);
            return true;
        }
        return false;
    }

    public startGame() {
        if (this.isRunning) return;

        this.isRunning = true;

        if (!this.player1 || !this.player2) {
            this.isRunning = false;
            return;
        }

        this.lastUpdate = Date.now();
        this.gameLoop();
    }

    private gameLoop = () => {
        const now = Date.now();
        const deltaTime = (now - this.lastUpdate) / 1000;
        this.lastUpdate = now;

        this.updateGame(deltaTime);

        if (this.contador > 600) {
            this.isRunning = false;
            Games.delete(this.gameIdentification);
            return;
        }

        if (this.isRunning) {
            setTimeout(this.gameLoop, 16);
        }
    };

    public updateGame = (deltaTime: number) => {
        this.contador += 1;
        if (this.ball) {
            this.ball.position.x += this.ball.velocity.x * deltaTime * 60;
            this.ball.position.y += this.ball.velocity.y * deltaTime * 60;

            if (this.ball.position.y <= 0 || this.ball.position.y >= 100) {
                this.ball.velocity.y = -this.ball.velocity.y;
            }
        }
    };
}
