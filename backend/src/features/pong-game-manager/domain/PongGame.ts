import { CONSTANTES_DB } from '@shared/constants/ApplicationConstants';
import { User } from '@shared/domain/entity/User.entity';

interface PlayerState {
    position: number;
    score: number;
    isReady: boolean;
}

export class PongPlayer {
    private playerId: number;
    private userData: User | null;
    private state: PlayerState;

    constructor(playerId: number, userData?: User) {
        this.playerId = playerId;
        this.userData = userData || null;
        this.state = {
            position: 50,
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

    public getId(): number {
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

    public getUsername(): string {
        return this.userData?.username || `Player ${this.playerId}`;
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
    private winnerScore: number;
    private maxGameTime?: number;
    private isPlayer2AI: boolean;
    private aiDifficulty: number;

    constructor(winnerScore = 5, maxGameTime = 120, isPlayer2AI = false, aiDifficulty = 0.95) {
        this.isRunning = false;
        this.player1 = undefined;
        this.player2 = undefined;
        this.ball = {
            position: { x: 50, y: 50 },
            velocity: { x: 0.7, y: 0.7 },
        };
        this.lastUpdate = Date.now();
        this.gameTimer = 0;
        this.winnerScore = winnerScore;
        this.maxGameTime = maxGameTime;
        this.isPlayer2AI = isPlayer2AI;
        this.aiDifficulty = aiDifficulty;
    }

    public addPlayer(playerId: number, userData?: User): boolean {
        if (!this.player1) {
            this.player1 = new PongPlayer(playerId, userData);
            if (this.isPlayer2AI && !this.player2) {
                this.player2 = new PongPlayer(1, {
                    id: CONSTANTES_DB.AI_PLAYER.ID,
                    username: CONSTANTES_DB.AI_PLAYER.NAME,
                    email: CONSTANTES_DB.AI_PLAYER.EMAIL,
                });
                this.player2.setReady(true);
            }
            return true;
        } else if (!this.player2 && !this.isPlayer2AI) {
            this.player2 = new PongPlayer(playerId, userData);
            return true;
        }
        return false;
    }

    public setPlayerReady(playerId: number, ready: boolean): boolean {
        const player = this.getPlayerById(playerId);
        if (!player) return false;

        player.setReady(ready);

        if (this.arePlayersReady() && !this.isRunning) {
            this.start();
        }

        return true;
    }

    public canStart(): boolean {
        return this.player1 !== undefined && this.player2 !== undefined;
    }

    public arePlayersReady(): boolean {
        if (this.isPlayer2AI) {
            return this.player1?.isReady() === true;
        }
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

        if (this.isPlayer2AI && this.player2) {
            this.updateAI();
        }

        this.updateBall(deltaTime);
        this.checkCollisions();
        this.gameTimer += deltaTime;
        this.checkWinConditions();
    }

    private updateAI(): void {
        if (!this.player2 || !this.isPlayer2AI) return;

        const player2State = this.player2.getState();
        const ballY = this.ball.position.y;
        const paddleY = player2State.position;

        const diff = ballY - paddleY;
        const threshold = 2;

        if (Math.abs(diff) > threshold) {
            const moveSpeed = this.aiDifficulty;

            if (diff > 0) {
                const newPosition = Math.min(100, paddleY + moveSpeed);
                for (let i = 0; i < Math.ceil(moveSpeed); i++) {
                    if (player2State.position < newPosition) {
                        this.player2.moveDown();
                    }
                }
            } else {
                const newPosition = Math.max(0, paddleY - moveSpeed);
                for (let i = 0; i < Math.ceil(moveSpeed); i++) {
                    if (player2State.position > newPosition) {
                        this.player2.moveUp();
                    }
                }
            }
        }
    }

    private updateBall(deltaTime: number): void {
        this.ball.position.x += this.ball.velocity.x * deltaTime * 60;
        this.ball.position.y += this.ball.velocity.y * deltaTime * 60;

        if (this.ball.position.y <= 0 || this.ball.position.y >= 100) {
            this.ball.velocity.y = -this.ball.velocity.y;
            this.ball.position.y = Math.max(0, Math.min(100, this.ball.position.y));
        }

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

        if (this.ball.position.x <= 5 && this.ball.position.x >= 0) {
            if (Math.abs(this.ball.position.y - player1State.position) <= 10) {
                this.ball.velocity.x = Math.abs(this.ball.velocity.x);
                this.ball.position.x = 5;
            }
        }

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

    public movePlayer(playerId: number, direction: 'up' | 'down'): boolean {
        const player = this.getPlayerById(playerId);
        if (!player) return false;

        if (direction === 'up') {
            player.moveUp();
        } else {
            player.moveDown();
        }
        return true;
    }

    private getPlayerById(playerId: number): PongPlayer | undefined {
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
                      id: this.player1.getId().toString(),
                      username: this.player1.getUsername(),
                      ...this.player1.getState(),
                  }
                : null,
            player2: this.player2
                ? {
                      id: this.player2.getId().toString(),
                      username: this.player2.getUsername(),
                      ...this.player2.getState(),
                  }
                : null,
            ball: this.ball,
            arePlayersReady: this.arePlayersReady(),
            gameRules: this.getGameRules(),
            isGameOver: this.isGameOver(),
            winner: this.isGameOver() ? this.getWinner() : null,
            isSinglePlayer: this.isPlayer2AI,
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

    public hasPlayer(playerId: number): boolean {
        return this.player1?.getId() === playerId || this.player2?.getId() === playerId;
    }

    private checkWinConditions(): void {
        if (!this.player1 || !this.player2) return;

        const player1State = this.player1.getState();
        const player2State = this.player2.getState();

        if (player1State.score >= this.winnerScore || player2State.score >= this.winnerScore) {
            this.stop();
            return;
        }

        if (this.maxGameTime && this.gameTimer >= this.maxGameTime) {
            this.stop();
            return;
        }
    }

    public getWinner(): string | null {
        if (!this.player1 || !this.player2) return null;

        const player1State = this.player1.getState();
        const player2State = this.player2.getState();

        if (player1State.score > player2State.score) {
            return this.player1.getId().toString();
        } else if (player2State.score > player1State.score) {
            return this.player2.getId().toString();
        }

        return null;
    }

    public isGameOver(): boolean {
        if (!this.player1 || !this.player2) return false;

        const player1State = this.player1.getState();
        const player2State = this.player2.getState();

        if (player1State.score >= this.winnerScore || player2State.score >= this.winnerScore) {
            return true;
        }

        if (this.maxGameTime && this.gameTimer >= this.maxGameTime) {
            return true;
        }

        return false;
    }

    public getGameRules() {
        return {
            winnerScore: this.winnerScore,
            maxGameTime: this.maxGameTime,
        };
    }

    public isSinglePlayerMode(): boolean {
        return this.isPlayer2AI;
    }
}
