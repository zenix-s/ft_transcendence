import { FastifyInstance } from 'fastify';
import { PongGame } from '../domain/PongGame';

export class ActivePongGame {
    private loop?: NodeJS.Timeout;
    private isEnding = false;
    private lastUpdate = Date.now();
    private gameStartTime = Date.now();
    private readonly GAME_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutos timeout

    constructor(
        public readonly gameId: number,
        public readonly matchId: number,
        public readonly game: PongGame,
        private readonly fastify: FastifyInstance,
        private readonly onGameEnd: (gameId: number) => void
    ) {}

    start(): void {
        if (this.loop) {
            this.stop();
        }

        this.loop = setInterval(() => {
            this.processTick();
        }, 16);
    }

    stop(): void {
        if (this.loop) {
            clearInterval(this.loop);
            this.loop = undefined;
        }
    }

    isActive(): boolean {
        return this.loop !== undefined;
    }

    updateLastActivity(): void {
        this.lastUpdate = Date.now();
    }

    private processTick(): void {
        try {
            // Verificar si el juego fue cancelado
            if (this.game.getIsCancelled()) {
                if (!this.isEnding) {
                    this.isEnding = true;
                    this.cancelMatch();
                }
                this.stop();
                this.onGameEnd(this.gameId);
                return;
            }

            // Solo eliminar el juego si está terminado, no si simplemente no está corriendo
            if (this.game.isGameOver()) {
                if (!this.isEnding) {
                    this.isEnding = true;
                    this.saveMatchHistory();
                }
                this.stop();
                this.onGameEnd(this.gameId);
                return;
            }

            // Si el juego no está corriendo pero no está terminado, verificar timeout
            if (!this.game.isGameRunning()) {
                // Si el juego ha estado esperando por más del timeout, cancelarlo y actualizar match
                if (Date.now() - this.gameStartTime > this.GAME_TIMEOUT_MS) {
                    this.cancelMatchDueToTimeout();
                    this.stop();
                    this.onGameEnd(this.gameId);
                }
                return;
            }

            this.game.update();
            this.lastUpdate = Date.now();

            // Verificar si el juego terminó después de la actualización
            if (this.game.isGameOver() && !this.isEnding) {
                this.isEnding = true;
                this.saveMatchHistory();
                this.stop();
                this.onGameEnd(this.gameId);
            }
        } catch (error) {
            this.fastify.log.error(error, `Error processing game tick for game ${this.gameId}`);
            this.stop();
            this.onGameEnd(this.gameId);
        }
    }

    private async cancelMatchDueToTimeout(): Promise<void> {
        try {
            const match = await this.fastify.MatchRepository.findById({ id: this.matchId });

            if (!match) {
                this.fastify.log.error(`Match with ID ${this.matchId} not found for timeout cancellation`);
                return;
            }

            match.cancel();

            const updatedMatch = await this.fastify.MatchRepository.update({ match });
            if (!updatedMatch) {
                this.fastify.log.error(`Failed to update match ${this.matchId} status to cancelled`);
            }
        } catch (error) {
            this.fastify.log.error(error, `Error cancelling match ${this.matchId} due to timeout`);
        }
    }

    private async cancelMatch(): Promise<void> {
        try {
            const match = await this.fastify.MatchRepository.findById({ id: this.matchId });

            if (!match) {
                this.fastify.log.error(`Match with ID ${this.matchId} not found for cancellation`);
                return;
            }

            match.cancel();

            const updatedMatch = await this.fastify.MatchRepository.update({ match });
            if (!updatedMatch) {
                this.fastify.log.error(`Failed to update match ${this.matchId} status to cancelled`);
            }
        } catch (error) {
            this.fastify.log.error(error, `Error cancelling match ${this.matchId}`);
        }
    }

    private async saveMatchHistory(): Promise<void> {
        try {
            const gameState = this.game.getGameState();
            const match = await this.fastify.MatchRepository.findById({ id: this.matchId });

            if (!match) {
                this.fastify.log.error(`Match with ID ${this.matchId} not found`);
                return;
            }

            const winnerIds: number[] = [];
            const finalScores: Record<number, number> = {};

            if (gameState.player1 && gameState.player2) {
                const player1Id = Number(gameState.player1.id);
                const player2Id = Number(gameState.player2.id);

                finalScores[player1Id] = gameState.player1.score;
                finalScores[player2Id] = gameState.player2.score;

                if (gameState.player1.score > gameState.player2.score) {
                    winnerIds.push(player1Id);
                } else if (gameState.player2.score > gameState.player1.score) {
                    winnerIds.push(player2Id);
                }
            }

            const matchEnded = match.end(winnerIds, finalScores);
            if (!matchEnded) {
                this.fastify.log.error(
                    `Failed to end match ${this.matchId} for game ${this.gameId} - match not in progress`
                );
                return;
            }

            const updatedMatch = await this.fastify.MatchRepository.update({ match });
            if (!updatedMatch) {
                this.fastify.log.error(`Failed to update match ${this.matchId} for game ${this.gameId}`);
            }
        } catch (error) {
            this.fastify.log.error(error, `Error saving match history for game ${this.gameId}`);
        }
    }
}
