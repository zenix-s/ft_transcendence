import { CONSTANTES_APP } from '@shared/constants/ApplicationConstants';
import {
    GAME_STATUS,
    GameStatus,
    COUNTDOWN_TYPES,
    COUNTDOWN_CONFIG,
    GAME_STATUS_UTILS,
} from '@shared/constants/GameConstants';
import { User } from '@shared/domain/Entities/User.entity';
import { IMatchSettings, VisualStyle } from '@shared/domain/ValueObjects/MatchSettings.value';
import { CountdownManager } from '../services/CountdownManager';
import { AIOpponent } from './AIOpponent.entity';
import { PongPlayer } from './PongPlayer.entity';
import { PongBall } from './PongBall.entity';

export class PongGame {
    private gameStatus: GameStatus;
    private countdownManager: CountdownManager;
    private player1?: PongPlayer;
    private player2?: PongPlayer;
    private ball: PongBall;
    private lastUpdate: number;
    private gameTimer: number;
    private winnerScore: number;
    private maxGameTime?: number;
    private isAIMode: boolean;
    private aiDifficulty: number;
    private aiOpponent?: AIOpponent;
    private isCancelled: boolean;
    private visualStyle: VisualStyle;

    constructor(
        winnerScore = 5,
        maxGameTime = 120,
        isPlayer2AI = false,
        aiDifficulty = 0.95,
        visualStyle: VisualStyle = '2d'
    ) {
        this.gameStatus = GAME_STATUS.WAITING_FOR_PLAYERS;
        this.countdownManager = new CountdownManager();
        this.player1 = undefined;
        this.player2 = undefined;
        this.ball = new PongBall();
        this.lastUpdate = Date.now();
        this.gameTimer = 0;
        this.winnerScore = winnerScore;
        this.maxGameTime = maxGameTime;
        this.isAIMode = isPlayer2AI;
        this.aiDifficulty = aiDifficulty;
        this.aiOpponent = undefined;
        this.isCancelled = false;
        this.visualStyle = visualStyle;
    }

    public addPlayer(playerId: number, userData?: User): boolean {
        if (!this.player1) {
            this.player1 = new PongPlayer(playerId, userData);
            if (this.isAIMode && !this.player2) {
                this.player2 = new PongPlayer(1, {
                    id: CONSTANTES_APP.AI_PLAYER.ID,
                    username: CONSTANTES_APP.AI_PLAYER.NAME,
                    email: CONSTANTES_APP.AI_PLAYER.EMAIL,
                });
                this.player2.setReady(true);
                this.aiOpponent = new AIOpponent(this.player2, this.aiDifficulty);
            }
            this.updateGameStatus();
            return true;
        } else if (!this.player2 && !this.isAIMode) {
            this.player2 = new PongPlayer(playerId, userData);
            this.updateGameStatus();
            return true;
        }
        return false;
    }

    public setPlayerReady(playerId: number, ready: boolean): boolean {
        const player = this.getPlayerById(playerId);
        if (!player) return false;

        player.setReady(ready);
        this.updateGameStatus();

        if (
            this.arePlayersReady() &&
            this.gameStatus === GAME_STATUS.WAITING_FOR_READY &&
            !this.countdownManager.hasActiveCountdown()
        ) {
            this.startGameCountdown();
        }

        return true;
    }

    public canStart(): boolean {
        return this.player1 !== undefined && this.player2 !== undefined;
    }

    public arePlayersReady(): boolean {
        if (this.isAIMode) {
            return this.player1?.isReady() === true;
        }
        return this.player1?.isReady() === true && this.player2?.isReady() === true;
    }

    private startGameCountdown(): void {
        this.gameStatus = GAME_STATUS.START_COUNTDOWN;

        this.countdownManager.startCountdown(COUNTDOWN_TYPES.START, {
            duration: COUNTDOWN_CONFIG.START_GAME_DURATION,
            onComplete: () => {
                this.startGame();
            },
        });
    }

    private startGoalCountdown(): void {
        this.gameStatus = GAME_STATUS.GOAL_COUNTDOWN;

        this.countdownManager.startCountdown(COUNTDOWN_TYPES.GOAL, {
            duration: COUNTDOWN_CONFIG.GOAL_RESUME_DURATION,
            onComplete: () => {
                this.resumeAfterGoal();
            },
        });
    }

    private startGame(): void {
        if (!this.canStart()) {
            return;
        }

        this.gameStatus = GAME_STATUS.PLAYING;
        this.lastUpdate = Date.now();
    }

    private resumeAfterGoal(): void {
        this.gameStatus = GAME_STATUS.PLAYING;
        this.lastUpdate = Date.now();
    }

    public stop(): void {
        this.gameStatus = GAME_STATUS.GAME_OVER;
        this.countdownManager.cancelAllCountdowns();
    }

    public update(): void {
        const now = Date.now();
        const deltaTime = (now - this.lastUpdate) / 1000;
        this.lastUpdate = now;

        this.countdownManager.update(deltaTime);

        if (this.gameStatus !== GAME_STATUS.PLAYING) {
            if (
                GAME_STATUS_UTILS.isCountdownState(this.gameStatus) ||
                GAME_STATUS_UTILS.isEndedState(this.gameStatus)
            ) {
                return;
            }
            if (GAME_STATUS_UTILS.isWaitingState(this.gameStatus)) {
                this.updateGameStatus();
            }
            return;
        }

        if (this.aiOpponent && this.player1) {
            const enemyY = this.player1.getState().position;
            this.aiOpponent.update(this.ball.getState(), enemyY);
        }

        this.updateBall(deltaTime);
        this.checkCollisions();
        this.checkGoals();
        this.gameTimer += deltaTime;
        this.checkWinConditions();
    }

    private onGoalScored(scorer: PongPlayer | undefined): void {
        if (!scorer) return;

        scorer.incrementScore();
        this.gameStatus = GAME_STATUS.GOAL_SCORED;

        if (this.checkWinConditions()) {
            return;
        }

        this.resetPlayerPositions();
        this.ball.reset();

        this.startGoalCountdown();
    }

    private updateGameStatus(): void {
        if (
            GAME_STATUS_UTILS.isCountdownState(this.gameStatus) ||
            this.gameStatus === GAME_STATUS.PLAYING ||
            this.gameStatus === GAME_STATUS.GOAL_SCORED
        ) {
            return;
        }

        if (this.isCancelled) {
            this.gameStatus = GAME_STATUS.CANCELLED;
        } else if (this.isGameOver()) {
            this.gameStatus = GAME_STATUS.GAME_OVER;
        } else if (this.getPlayerCount() < 2) {
            this.gameStatus = GAME_STATUS.WAITING_FOR_PLAYERS;
        } else if (!this.arePlayersReady()) {
            this.gameStatus = GAME_STATUS.WAITING_FOR_READY;
        }
    }

    private updateBall(deltaTime: number): void {
        if (this.countdownManager.hasActiveCountdown()) {
            return;
        }

        this.ball.update(deltaTime);
    }

    private checkCollisions(): void {
        if (!this.player1 || !this.player2) return;

        const ballPos = this.ball.getPosition();
        const player1State = this.player1.getState();
        const player2State = this.player2.getState();

        if (ballPos.x <= 5 && ballPos.x >= 0) {
            if (Math.abs(ballPos.y - player1State.position) <= 10) {
                const contactPoint = (ballPos.y - player1State.position) / 10;
                this.ball.reflectFromPaddle(contactPoint, true);
            }
        }

        if (ballPos.x >= 95 && ballPos.x <= 100) {
            if (Math.abs(ballPos.y - player2State.position) <= 10) {
                const contactPoint = (ballPos.y - player2State.position) / 10;
                this.ball.reflectFromPaddle(contactPoint, false);
            }
        }
    }

    private checkGoals(): void {
        const ballPos = this.ball.getPosition();

        if (ballPos.x <= 0) {
            this.onGoalScored(this.player2);
        } else if (ballPos.x >= 100) {
            this.onGoalScored(this.player1);
        }
    }

    private resetPlayerPositions(): void {
        if (this.player1) {
            this.player1.resetPosition();
        }
        if (this.player2) {
            this.player2.resetPosition();
        }
        if (this.aiOpponent) {
            this.aiOpponent.resetTarget();
        }
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
        if (
            !GAME_STATUS_UTILS.isCountdownState(this.gameStatus) &&
            this.gameStatus !== GAME_STATUS.PLAYING &&
            this.gameStatus !== GAME_STATUS.GOAL_SCORED
        ) {
            this.updateGameStatus();
        }

        return {
            gameStatus: this.gameStatus,
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
            ball: this.ball.getState(),
            arePlayersReady: this.arePlayersReady(),
            gameRules: this.getGameRules(),
            isGameOver: this.isGameOver(),
            winner: this.isGameOver() ? this.getWinner() : null,
            isSinglePlayer: this.isAIMode,
            isCancelled: this.isCancelled,
            countdownInfo: this.countdownManager.getActiveCountdown(),
        };
    }

    public isGameRunning(): boolean {
        return this.gameStatus === GAME_STATUS.PLAYING;
    }

    public isTimeoutWindow(): boolean {
        return (
            this.gameStatus === GAME_STATUS.WAITING_FOR_PLAYERS ||
            this.gameStatus === GAME_STATUS.WAITING_FOR_READY
        );
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

    private checkWinConditions(): boolean {
        if (!this.player1 || !this.player2) return false;

        const player1State = this.player1.getState();
        const player2State = this.player2.getState();

        if (player1State.score >= this.winnerScore || player2State.score >= this.winnerScore) {
            this.stop();
            return true;
        }

        if (this.maxGameTime && this.gameTimer >= this.maxGameTime) {
            this.stop();
            return true;
        }

        return false;
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
        if (this.gameStatus === GAME_STATUS.GAME_OVER) {
            return true;
        }

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
            difficulty: this.aiDifficulty,
            visualStyle: this.visualStyle,
        };
    }

    public getMatchSettings(): IMatchSettings {
        return {
            maxScore: this.winnerScore,
            maxGameTime: this.maxGameTime ?? 0,
            visualStyle: this.visualStyle,
        };
    }

    public isSinglePlayerMode(): boolean {
        return this.isAIMode;
    }

    public modifySettings(settings: {
        winnerScore?: number;
        maxGameTime?: number;
        difficulty?: number;
        visualStyle?: VisualStyle;
    }): boolean {
        if (this.gameStatus === GAME_STATUS.PLAYING) {
            return false;
        }

        if (settings.winnerScore !== undefined && settings.winnerScore > 0) {
            this.winnerScore = settings.winnerScore;
        }

        if (settings.maxGameTime !== undefined && settings.maxGameTime > 0) {
            this.maxGameTime = settings.maxGameTime;
        }

        if (settings.difficulty !== undefined && settings.difficulty >= 0.6 && settings.difficulty <= 1.0) {
            this.aiDifficulty = settings.difficulty;
            if (this.aiOpponent) {
                this.aiOpponent.setDifficulty(settings.difficulty);
            }
        }

        if (settings.visualStyle !== undefined) {
            this.visualStyle = settings.visualStyle;
        }

        return true;
    }

    public cancelGame(playerId: number): boolean {
        const player = this.getPlayerById(playerId);
        if (!player) return false;

        if (this.gameStatus === GAME_STATUS.PLAYING) {
            if (this.player1?.getId() === playerId && this.player2) {
                for (let i = this.player2.getState().score; i < this.winnerScore; i++) {
                    this.player2.incrementScore();
                }
            } else if (this.player2?.getId() === playerId && this.player1) {
                for (let i = this.player1.getState().score; i < this.winnerScore; i++) {
                    this.player1.incrementScore();
                }
            }
            this.gameStatus = GAME_STATUS.GAME_OVER;
        } else {
            this.isCancelled = true;
        }

        return true;
    }

    public getIsCancelled(): boolean {
        return this.isCancelled;
    }
}
