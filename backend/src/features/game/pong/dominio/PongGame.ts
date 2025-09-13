interface PlayerState {
    position: number;
    score: number;
    isReady: boolean;
}

export class PongPlayer {
    private playerId: string;
    private state: PlayerState;

    constructor(playerId: string) {
        this.playerId = playerId;
        this.state = {
            position: 50, // Center position
            score: 0,
            isReady: false,
        };
    }

    public moveUp(): void {
        if (this.state.position > 0) {
            this.state.position -= 1;
        }
    }

    public moveDown(): void {
        if (this.state.position < 100) {
            this.state.position += 1;
        }
    }

    public getState(): PlayerState {
        return this.state;
    }

    public getId(): string {
        return this.playerId;
    }

    public incrementScore(): void {
        this.state.score += 1;
    }

    public setReady(ready: boolean): void {
        this.state.isReady = ready;
    }

    public isReady(): boolean {
        return this.state.isReady;
    }
}

interface BallState {
    position: { x: number; y: number };
    velocity: { x: number; y: number };
}

export class PongGame {
    private isRunning: boolean;
    private player1?: PongPlayer;
    private player2?: PongPlayer;
    private ball: BallState;
    private lastUpdate: number;
    private gameTimer: number;

    constructor() {
        this.isRunning = false;
        this.player1 = undefined;
        this.player2 = undefined;
        this.ball = {
            position: { x: 50, y: 50 },
            velocity: { x: 1, y: 1 },
        };
        this.lastUpdate = Date.now();
        this.gameTimer = 0;
    }

    public addPlayer(playerId: string): boolean {
        if (!this.player1) {
            this.player1 = new PongPlayer(playerId);
            return true;
        } else if (!this.player2) {
            this.player2 = new PongPlayer(playerId);
            return true;
        }
        return false;
    }

    public removePlayer(playerId: string): boolean {
        if (this.player1?.getId() === playerId) {
            this.player1 = undefined;
            return true;
        } else if (this.player2?.getId() === playerId) {
            this.player2 = undefined;
            return true;
        }
        return false;
    }

    public setPlayerReady(playerId: string, ready: boolean): boolean {
        const player = this.getPlayerById(playerId);
        if (!player) return false;

        player.setReady(ready);

        // Auto-start the game if both players are ready
        if (this.arePlayersReady() && !this.isRunning) {
            this.start();
        }

        return true;
    }

    public canStart(): boolean {
        return this.player1 !== undefined && this.player2 !== undefined;
    }

    public arePlayersReady(): boolean {
        return this.player1?.isReady() === true && this.player2?.isReady() === true;
    }

    public start(): boolean {
        if (!this.canStart() || this.isRunning || !this.arePlayersReady()) {
            return false;
        }

        this.isRunning = true;
        this.lastUpdate = Date.now();
        return true;
    }

    public stop(): void {
        this.isRunning = false;
    }

    public update(): void {
        if (!this.isRunning) return;

        const now = Date.now();
        const deltaTime = (now - this.lastUpdate) / 1000;
        this.lastUpdate = now;

        this.updateBall(deltaTime);
        this.checkCollisions();
        this.gameTimer += deltaTime;
    }

    private updateBall(deltaTime: number): void {
        this.ball.position.x += this.ball.velocity.x * deltaTime * 60;
        this.ball.position.y += this.ball.velocity.y * deltaTime * 60;

        // Bounce off top and bottom walls
        if (this.ball.position.y <= 0 || this.ball.position.y >= 100) {
            this.ball.velocity.y = -this.ball.velocity.y;
            this.ball.position.y = Math.max(0, Math.min(100, this.ball.position.y));
        }

        // Check for scoring
        if (this.ball.position.x <= 0) {
            this.player2?.incrementScore();
            this.resetBall();
        } else if (this.ball.position.x >= 100) {
            this.player1?.incrementScore();
            this.resetBall();
        }
    }

    private checkCollisions(): void {
        if (!this.player1 || !this.player2) return;

        const player1State = this.player1.getState();
        const player2State = this.player2.getState();

        // Player 1 paddle collision (left side)
        if (this.ball.position.x <= 5 && this.ball.position.x >= 0) {
            if (Math.abs(this.ball.position.y - player1State.position) <= 10) {
                this.ball.velocity.x = Math.abs(this.ball.velocity.x);
                this.ball.position.x = 5;
            }
        }

        // Player 2 paddle collision (right side)
        if (this.ball.position.x >= 95 && this.ball.position.x <= 100) {
            if (Math.abs(this.ball.position.y - player2State.position) <= 10) {
                this.ball.velocity.x = -Math.abs(this.ball.velocity.x);
                this.ball.position.x = 95;
            }
        }
    }

    private resetBall(): void {
        this.ball.position = { x: 50, y: 50 };
        this.ball.velocity = {
            x: Math.random() > 0.5 ? 1 : -1,
            y: (Math.random() - 0.5) * 2,
        };
    }

    public movePlayer(playerId: string, direction: 'up' | 'down'): boolean {
        const player = this.getPlayerById(playerId);
        if (!player) return false;

        if (direction === 'up') {
            player.moveUp();
        } else {
            player.moveDown();
        }
        return true;
    }

    private getPlayerById(playerId: string): PongPlayer | undefined {
        if (this.player1?.getId() === playerId) return this.player1;
        if (this.player2?.getId() === playerId) return this.player2;
        return undefined;
    }

    public getGameState() {
        return {
            isRunning: this.isRunning,
            gameTimer: this.gameTimer,
            player1: this.player1
                ? {
                      id: this.player1.getId(),
                      ...this.player1.getState(),
                  }
                : null,
            player2: this.player2
                ? {
                      id: this.player2.getId(),
                      ...this.player2.getState(),
                  }
                : null,
            ball: this.ball,
            arePlayersReady: this.arePlayersReady(),
        };
    }

    public isGameRunning(): boolean {
        return this.isRunning;
    }

    public getPlayerCount(): number {
        let count = 0;
        if (this.player1) count++;
        if (this.player2) count++;
        return count;
    }

    public hasPlayer(playerId: string): boolean {
        return this.player1?.getId() === playerId || this.player2?.getId() === playerId;
    }
}
