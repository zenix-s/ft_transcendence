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
import { AIOpponent } from './AIOpponent';

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
        if (this.state.position > 10) {
            this.state.position -= 1;
        }
    }

    public moveDown(): void {
        if (this.state.position < 90) {
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

    public resetPosition(): void {
        this.state.position = 50;
    }
}

interface BallState {
    position: { x: number; y: number };
    velocity: { x: number; y: number };
}

export class PongGame {
    private gameStatus: GameStatus;
    private countdownManager: CountdownManager;
    private player1?: PongPlayer;
    private player2?: PongPlayer;
    private ball: BallState;
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
        this.ball = {
            position: { x: 50, y: 50 },
            velocity: this.generateInitialBallVelocity(),
        };
        this.lastUpdate = Date.now();
        this.gameTimer = 0;
        this.winnerScore = winnerScore;
        this.maxGameTime = maxGameTime;
        this.isAIMode = isPlayer2AI;
        this.aiDifficulty = aiDifficulty;
        this.aiOpponent = undefined; // Created when player2 is added
        this.isCancelled = false;
        this.visualStyle = visualStyle;
    }

    public addPlayer(playerId: number, userData?: User): boolean {
        if (!this.player1) {
            this.player1 = new PongPlayer(playerId, userData);
            if (this.isAIMode && !this.player2) {
                // Create AI player
                this.player2 = new PongPlayer(1, {
                    id: CONSTANTES_APP.AI_PLAYER.ID,
                    username: CONSTANTES_APP.AI_PLAYER.NAME,
                    email: CONSTANTES_APP.AI_PLAYER.EMAIL,
                });
                this.player2.setReady(true);
                // Create AI controller for player2
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

        // Si ambos están listos y no hay countdown activo, iniciar countdown de inicio
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

        // Siempre actualizar countdowns
        this.countdownManager.update(deltaTime);

        // Solo actualizar lógica del juego si está en estado PLAYING
        if (this.gameStatus !== GAME_STATUS.PLAYING) {
            // No hacer nada más si hay un countdown activo o el juego terminó
            if (
                GAME_STATUS_UTILS.isCountdownState(this.gameStatus) ||
                GAME_STATUS_UTILS.isEndedState(this.gameStatus)
            ) {
                return;
            }
            // Solo actualizar estado si está en estado de espera
            if (GAME_STATUS_UTILS.isWaitingState(this.gameStatus)) {
                this.updateGameStatus();
            }
            return;
        }

        // AI controls player2 directly
        if (this.aiOpponent && this.player1) {
            const enemyY = this.player1.getState().position;
            this.aiOpponent.update(this.ball, enemyY);
        }

        this.updateBall(deltaTime);
        this.checkCollisions();
        this.gameTimer += deltaTime;
        this.checkWinConditions();
    }

    private onGoalScored(scorer: PongPlayer | undefined): void {
        if (!scorer) return;

        scorer.incrementScore();
        this.gameStatus = GAME_STATUS.GOAL_SCORED;

        // Verificar si el juego terminó
        if (this.checkWinConditions()) {
            return; // El juego terminó
        }

        this.resetPlayerPositions();
        this.resetBall();

        // Si el juego continúa, iniciar countdown para reanudar
        this.startGoalCountdown();
    }

    private updateGameStatus(): void {
        // No cambiar estado si está en countdown o jugando
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
        // Solo mover la pelota si no hay countdown activo
        if (this.countdownManager.hasActiveCountdown()) {
            return;
        }

        // Aplicar resistencia al aire muy sutil para ralentizar la pelota gradualmente
        const currentSpeed = Math.sqrt(
            this.ball.velocity.x * this.ball.velocity.x + this.ball.velocity.y * this.ball.velocity.y
        );

        if (currentSpeed > 1.8) {
            // Solo aplicar resistencia si hay velocidad alta
            const airResistance = 0.9975; // Resistencia moderada para velocidades altas
            this.ball.velocity.x *= airResistance;
            this.ball.velocity.y *= airResistance;
        }

        this.ball.position.x += this.ball.velocity.x * deltaTime * 60;
        this.ball.position.y += this.ball.velocity.y * deltaTime * 60;

        if (this.ball.position.y <= 0 || this.ball.position.y >= 100) {
            this.ball.velocity.y = -this.ball.velocity.y;
            this.ball.position.y = Math.max(0, Math.min(100, this.ball.position.y));
        }

        if (this.ball.position.x <= 0) {
            this.onGoalScored(this.player2);
        } else if (this.ball.position.x >= 100) {
            this.onGoalScored(this.player1);
        }
    }

    private checkCollisions(): void {
        if (!this.player1 || !this.player2) return;

        const player1State = this.player1.getState();
        const player2State = this.player2.getState();

        // Colisión con pala del jugador 1 (izquierda)
        if (this.ball.position.x <= 5 && this.ball.position.x >= 0) {
            if (Math.abs(this.ball.position.y - player1State.position) <= 10) {
                // Calcular qué parte de la pala tocó la pelota (-1 superior, 0 centro, 1 inferior)
                const contactPoint = (this.ball.position.y - player1State.position) / 10;

                // Aumentar velocidad moderadamente en cada golpe (máximo 2.2x)
                const currentSpeed = Math.sqrt(
                    this.ball.velocity.x * this.ball.velocity.x + this.ball.velocity.y * this.ball.velocity.y
                );
                const speedMultiplier = Math.min(2.2, currentSpeed * 1.06);

                // Aplicar ángulo basado en el punto de contacto
                const maxAngleModifier = 0.4;

                this.ball.velocity.x = speedMultiplier * Math.cos(contactPoint * 0.3);
                this.ball.velocity.y = this.ball.velocity.y * 0.8 + contactPoint * maxAngleModifier;

                // Limitar velocidad Y para mantener jugabilidad
                this.ball.velocity.y = Math.max(-0.6, Math.min(0.6, this.ball.velocity.y));

                this.ball.position.x = 5;
            }
        }

        // Colisión con pala del jugador 2 (derecha)
        if (this.ball.position.x >= 95 && this.ball.position.x <= 100) {
            if (Math.abs(this.ball.position.y - player2State.position) <= 10) {
                // Calcular qué parte de la pala tocó la pelota (-1 superior, 0 centro, 1 inferior)
                const contactPoint = (this.ball.position.y - player2State.position) / 10;

                // Aumentar velocidad moderadamente en cada golpe (máximo 2.2x)
                const currentSpeed = Math.sqrt(
                    this.ball.velocity.x * this.ball.velocity.x + this.ball.velocity.y * this.ball.velocity.y
                );
                const speedMultiplier = Math.min(2.2, currentSpeed * 1.06);

                // Aplicar ángulo basado en el punto de contacto
                const maxAngleModifier = 0.4;

                this.ball.velocity.x = -speedMultiplier * Math.cos(contactPoint * 0.3);
                this.ball.velocity.y = this.ball.velocity.y * 0.8 + contactPoint * maxAngleModifier;

                // Limitar velocidad Y para mantener jugabilidad
                this.ball.velocity.y = Math.max(-0.6, Math.min(0.6, this.ball.velocity.y));

                this.ball.position.x = 95;
            }
        }
    }

    private generateInitialBallVelocity(): { x: number; y: number } {
        // Generate an initial velocity with a small random angle and a consistent speed.
        // Direction is chosen randomly towards player1 (negative x) or player2 (positive x).
        // Angle is limited to avoid too-steep trajectories at game start.
        const MAX_ANGLE_DEG = 20; // Max deviation from horizontal in degrees
        const angleDeg = (Math.random() * 2 - 1) * MAX_ANGLE_DEG; // random between -MAX..+MAX
        const angleRad = (angleDeg * Math.PI) / 180;
        const speed = 0.8; // base speed magnitude (kept compatible with previous behavior)

        // Randomly choose initial lateral direction: 1 => right (towards player2), -1 => left (towards player1)
        const lateralDirection = Math.random() > 0.5 ? 1 : -1;

        const vx = lateralDirection * Math.cos(angleRad) * speed;
        const vy = Math.sin(angleRad) * speed;

        return { x: vx, y: vy };
    }

    private resetBall(): void {
        this.ball.position = { x: 50, y: 50 };
        this.ball.velocity = this.generateInitialBallVelocity();
    }

    private resetPlayerPositions(): void {
        if (this.player1) {
            this.player1.resetPosition();
        }
        if (this.player2) {
            this.player2.resetPosition();
        }
        // Reset AI target position to match player2's reset position
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
        // Solo actualizar estado si no estamos en countdown o jugando
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
            ball: this.ball,
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
        // Solo permitir modificación si el juego no ha empezado
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

    public removePlayer(playerId: number): boolean {
        const player = this.getPlayerById(playerId);
        if (!player) return false;

        // Si el juego ya empezó, no permitir abandonar (debe usar cancelGame)
        if (this.gameStatus === GAME_STATUS.PLAYING) {
            return false;
        }

        // Remover el jugador
        if (this.player1?.getId() === playerId) {
            this.player1 = undefined;
        } else if (this.player2?.getId() === playerId) {
            this.player2 = undefined;
        }

        // Si no quedan jugadores humanos, cancelar el juego
        if (!this.player1 && (!this.player2 || this.isAIMode)) {
            this.isCancelled = true;
        }

        return true;
    }

    public cancelGame(playerId: number): boolean {
        const player = this.getPlayerById(playerId);
        if (!player) return false;

        if (this.gameStatus === GAME_STATUS.PLAYING) {
            // Si está en curso, dar victoria al oponente
            if (this.player1?.getId() === playerId && this.player2) {
                // Player1 abandona, player2 gana
                for (let i = this.player2.getState().score; i < this.winnerScore; i++) {
                    this.player2.incrementScore();
                }
            } else if (this.player2?.getId() === playerId && this.player1) {
                // Player2 abandona, player1 gana
                for (let i = this.player1.getState().score; i < this.winnerScore; i++) {
                    this.player1.incrementScore();
                }
            }
            this.gameStatus = GAME_STATUS.GAME_OVER;
        } else {
            // Si no ha empezado, cancelar
            this.isCancelled = true;
        }

        return true;
    }

    public getIsCancelled(): boolean {
        return this.isCancelled;
    }
}
