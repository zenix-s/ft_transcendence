import { PongPlayer } from './PongPlayer.entity';
import { BallState } from './PongBall.entity';

export enum AIDifficulty {
    EASY = 0.6,
    MEDIUM = 0.8,
    HARD = 1.0,
}

export class AIOpponent {
    private player: PongPlayer;
    private difficulty: AIDifficulty;
    private targetPosition: number = 50;
    private lastUpdateTime: number = 0;
    private lastBallDirectionTowardAI: boolean = false;

    constructor(player: PongPlayer, difficulty: number = 0.95) {
        this.player = player;
        this.difficulty = this.numberToDifficulty(difficulty);
    }

    private numberToDifficulty(value: number): AIDifficulty {
        if (value >= AIDifficulty.HARD) return AIDifficulty.HARD;
        if (value >= AIDifficulty.MEDIUM) return AIDifficulty.MEDIUM;
        return AIDifficulty.EASY;
    }

    private getMinimumUpdateInterval(): number {
        switch (this.difficulty) {
            case AIDifficulty.HARD:
                return 600;
            case AIDifficulty.MEDIUM:
                return 1000;
            case AIDifficulty.EASY:
                return 1200;
        }
    }

    public update(ball: BallState, enemyY: number): void {
        this.makeDecision(ball, enemyY);
        this.moveTowardsTarget();
    }

    private makeDecision(ball: BallState, enemyY: number): void {
        const now = Date.now();
        const isBallApproaching = ball.velocity.x > 0;
        const timeSinceLastUpdate = now - this.lastUpdateTime;
        const minimumInterval = this.getMinimumUpdateInterval();

        if (this.lastUpdateTime > 0 && timeSinceLastUpdate < minimumInterval) {
            this.lastBallDirectionTowardAI = isBallApproaching;
            return;
        }

        const directionChanged = !this.lastBallDirectionTowardAI && isBallApproaching;
        const shouldUpdate =
            timeSinceLastUpdate >= 1000 || (directionChanged && timeSinceLastUpdate >= minimumInterval);

        if (!shouldUpdate) {
            return;
        }

        this.lastUpdateTime = now;
        this.lastBallDirectionTowardAI = isBallApproaching;

        if (!isBallApproaching) {
            if (this.difficulty === AIDifficulty.HARD) {
                const estimatedReturnY = this.estimateDefensivePosition(ball, enemyY);
                this.targetPosition = estimatedReturnY;
            } else {
                this.targetPosition = 50;
            }
            return;
        }

        const predictedY = this.predictBallY(ball);

        const strategicY = this.applyStrategy(predictedY, enemyY, ball.velocity.y);

        const finalY = this.applyHumanError(strategicY);

        this.targetPosition = Math.max(10, Math.min(90, finalY));
    }

    private applyStrategy(predictedY: number, enemyY: number, ballVelocityY: number): number {
        switch (this.difficulty) {
            case AIDifficulty.EASY: {
                return predictedY;
            }

            case AIDifficulty.MEDIUM: {
                if (Math.random() < 0.5) {
                    const angleOffset = ballVelocityY > 0 ? 5 : -5;
                    return predictedY + angleOffset;
                }
                return predictedY;
            }

            case AIDifficulty.HARD: {
                const fieldCenter = 50;
                if (enemyY < fieldCenter) {
                    return predictedY - 6;
                } else {
                    return predictedY + 6;
                }
            }
        }
    }

    private applyHumanError(targetY: number): number {
        let errorRange: number;

        switch (this.difficulty) {
            case AIDifficulty.HARD:
                errorRange = 1;
                break;
            case AIDifficulty.MEDIUM:
                errorRange = 8;
                break;
            case AIDifficulty.EASY:
                errorRange = 15;
                break;
        }

        const error = (Math.random() - 0.5) * errorRange;
        return targetY + error;
    }

    private moveTowardsTarget(): void {
        const currentPosition = this.player.getState().position;
        const diff = this.targetPosition - currentPosition;

        if (Math.abs(diff) > 1) {
            if (diff > 0) {
                this.player.moveDown();
            } else {
                this.player.moveUp();
            }
        }
    }

    private predictBallY(ball: BallState): number {
        const MAX_SIMULATION_TIME = 1.5; // seconds
        const SIMULATION_STEP = 0.016; // ~60 FPS precision
        const FRAMES_PER_STEP = 60;

        let x = ball.position.x;
        let y = ball.position.y;
        const vx = ball.velocity.x;
        let vy = ball.velocity.y;
        let simulatedTime = 0;

        // Simula hasta que la pelota alcanza la posición x de la paleta o se excede el tiempo
        while (x < 95 && simulatedTime < MAX_SIMULATION_TIME) {
            x += vx * SIMULATION_STEP * FRAMES_PER_STEP;
            y += vy * SIMULATION_STEP * FRAMES_PER_STEP;

            if (y <= 0) {
                y = -y;
                vy = -vy;
            } else if (y >= 100) {
                y = 200 - y;
                vy = -vy;
            }

            simulatedTime += SIMULATION_STEP;
        }

        return Math.max(10, Math.min(90, y));
    }

    private estimateDefensivePosition(ball: BallState, enemyY: number): number {
        const fieldCenter = 50;
        const defensiveOffset = 8;

        if (enemyY < fieldCenter) {
            return Math.max(10, fieldCenter - defensiveOffset);
        } else {
            return Math.min(90, fieldCenter + defensiveOffset);
        }
    }

    public resetTarget(): void {
        this.targetPosition = 50;
    }

    public setDifficulty(difficulty: number): void {
        this.difficulty = this.numberToDifficulty(difficulty);
    }

    public getDifficulty(): number {
        return this.difficulty as number;
    }
}
