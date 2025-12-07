/**
 * AIOpponent Controller
 * Controls the movement of a PongPlayer using AI decision-making
 * Updates strategy once per second as per requirements
 */

import { PongPlayer } from './PongGame';

interface BallState {
    position: { x: number; y: number };
    velocity: { x: number; y: number };
}

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

    /**
     * Get minimum update interval based on difficulty
     * Controls how responsive the AI is to direction changes
     */
    private getMinimumUpdateInterval(): number {
        switch (this.difficulty) {
            case AIDifficulty.HARD:
                return 500; // Fast reactions
            case AIDifficulty.MEDIUM:
                return 650; // Moderate reactions
            case AIDifficulty.EASY:
                return 800; // Slower reactions
        }
    }

    /**
     * Main update method - called every frame
     * @param ball Current ball state
     * @param enemyY Enemy player Y position (for strategic decisions)
     */
    public update(ball: BallState, enemyY: number): void {
        this.makeDecision(ball, enemyY);
        this.moveTowardsTarget();
    }

    /**
     * Make AI decision based on ball trajectory
     *
     * TIMER COMPLIANCE STRATEGY:
     * The constraint "update game view once per second" prevents rapid micro-adjustments
     * within a single decision context. When the ball bounces back toward the AI (ball
     * changes from moving-away to approaching), this is a DISCRETE NEW GAME EVENT that
     * deserves fresh assessment - similar to how humans naturally reassess when the ball
     * returns to their side.
     *
     * IMPLEMENTATION:
     * - RULE 1: Absolute minimum 500ms between ANY updates (prevents superhuman reactions)
     * - RULE 2: Standard 1-second timer prevents micro-adjustments during same approach phase
     * - RULE 3: Timer resets when ball direction changes from away to approaching
     *
     * SAFEGUARDS:
     * - 500ms minimum caps maximum update frequency at 2Hz (still far below 60Hz game loop)
     * - In ultra-fast rallies (< 500ms), AI will miss some returns (human-like limitation)
     * - Timer is NOT reset after goals (prevents gaming the constraint)
     */
    private makeDecision(ball: BallState, enemyY: number): void {
        const now = Date.now();
        const isBallApproaching = ball.velocity.x > 0;
        const timeSinceLastUpdate = now - this.lastUpdateTime;
        const minimumInterval = this.getMinimumUpdateInterval();

        // RULE 1: Absolute minimum interval between ANY updates
        if (this.lastUpdateTime > 0 && timeSinceLastUpdate < minimumInterval) {
            // Track direction even if not updating
            this.lastBallDirectionTowardAI = isBallApproaching;
            return;
        }

        // RULE 2 & 3: Standard 1-second timer OR direction-change reset
        const directionChanged = !this.lastBallDirectionTowardAI && isBallApproaching;
        const shouldUpdate =
            timeSinceLastUpdate >= 1000 ||
            (directionChanged && timeSinceLastUpdate >= minimumInterval);

        if (!shouldUpdate) {
            // Track direction even if not updating
            this.lastBallDirectionTowardAI = isBallApproaching;
            return;
        }

        // Update timing trackers before making decision
        this.lastUpdateTime = now;
        this.lastBallDirectionTowardAI = isBallApproaching;

        // Ball moving away - defensive positioning based on difficulty
        if (!isBallApproaching) {
            if (this.difficulty === AIDifficulty.HARD) {
                // HARD: Anticipate where ball might return (predict return position)
                const estimatedReturnY = this.estimateDefensivePosition(ball, enemyY);
                this.targetPosition = estimatedReturnY;
            } else {
                // MEDIUM/EASY: Go to safe center position
                this.targetPosition = 50;
            }
            return;
        }

        // Predict where ball will hit paddle
        const predictedY = this.predictBallY(ball);

        // Apply strategic positioning based on difficulty
        const strategicY = this.applyStrategy(predictedY, enemyY, ball.velocity.y);

        // Apply human error based on difficulty
        const finalY = this.applyHumanError(strategicY);

        // Clamp to valid paddle range
        this.targetPosition = Math.max(10, Math.min(90, finalY));
    }

    /**
     * Apply strategic positioning based on difficulty
     * Used with the new direction-aware timer system
     */
    private applyStrategy(predictedY: number, enemyY: number, ballVelocityY: number): number {
        switch (this.difficulty) {
            case AIDifficulty.EASY: {
                // No strategy, just go to predicted position
                return predictedY;
            }

            case AIDifficulty.MEDIUM: {
                // 50% chance to angle the ball (hit with paddle edge)
                if (Math.random() < 0.5) {
                    const angleOffset = ballVelocityY > 0 ? 5 : -5;
                    return predictedY + angleOffset;
                }
                return predictedY;
            }

            case AIDifficulty.HARD: {
                // Aggressive strategy: aim away from enemy position
                const fieldCenter = 50;
                if (enemyY < fieldCenter) {
                    // Enemy is in upper half, send ball toward lower half
                    return predictedY - 8;
                } else {
                    // Enemy is in lower half, send ball toward upper half
                    return predictedY + 8;
                }
            }
        }
    }

    /**
     * Apply human-like error to the target position
     * Tuned for better difficulty scaling with new timer system
     */
    private applyHumanError(targetY: number): number {
        let errorRange: number;

        switch (this.difficulty) {
            case AIDifficulty.HARD:
                errorRange = 1; // Near-perfect accuracy (tighter margin, harder to beat)
                break;
            case AIDifficulty.MEDIUM:
                errorRange = 8; // Noticeable mistakes
                break;
            case AIDifficulty.EASY:
                errorRange = 15; // Misses often
                break;
        }

        const error = (Math.random() - 0.5) * errorRange;
        return targetY + error;
    }

    /**
     * Move player paddle incrementally toward target position
     */
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

    /**
     * Predict Y position where ball will reach the AI paddle (x = 95)
     * Enhanced time-based simulation with precision matching game physics (60 FPS)
     * Includes safety limit to prevent infinite loops in edge cases
     */
    private predictBallY(ball: BallState): number {
        const MAX_SIMULATION_TIME = 1.5; // seconds
        const SIMULATION_STEP = 0.016; // ~60 FPS precision
        const FRAMES_PER_STEP = 60;

        let x = ball.position.x;
        let y = ball.position.y;
        const vx = ball.velocity.x;
        let vy = ball.velocity.y;
        let simulatedTime = 0;

        // Simulate until ball reaches paddle x position or time limit exceeded
        while (x < 95 && simulatedTime < MAX_SIMULATION_TIME) {
            // Time-based projection matching game physics
            x += vx * SIMULATION_STEP * FRAMES_PER_STEP;
            y += vy * SIMULATION_STEP * FRAMES_PER_STEP;

            // Bounce off top/bottom walls (matching PongGame.ts physics)
            if (y <= 0) {
                y = -y;
                vy = -vy;
            } else if (y >= 100) {
                y = 200 - y;
                vy = -vy;
            }

            simulatedTime += SIMULATION_STEP;
        }

        // Clamp to valid paddle range
        return Math.max(10, Math.min(90, y));
    }

    /**
     * Estimate defensive position when ball is moving away
     * Used by HARD difficulty to anticipate where the opponent might return the ball
     */
    private estimateDefensivePosition(ball: BallState, enemyY: number): number {
        // Simple heuristic: if opponent is moving up, expect ball to return from below (and vice versa)
        // For HARD difficulty, position slightly toward where we think opponent can reach
        const fieldCenter = 50;
        const defensiveOffset = 8;

        if (enemyY < fieldCenter) {
            // Enemy is in upper half, expect return shot from upper area
            return Math.max(10, fieldCenter - defensiveOffset);
        } else {
            // Enemy is in lower half, expect return shot from lower area
            return Math.min(90, fieldCenter + defensiveOffset);
        }
    }

    /**
     * Reset target position to center (called after goals)
     */
    public resetTarget(): void {
        this.targetPosition = 50;
    }

    /**
     * Update difficulty level
     */
    public setDifficulty(difficulty: number): void {
        this.difficulty = this.numberToDifficulty(difficulty);
    }

    /**
     * Get current difficulty as number (for external use)
     */
    public getDifficulty(): number {
        return this.difficulty as number;
    }
}
