import { FastifyInstance } from 'fastify';
import { PongGame } from '../domain/PongGame.entity';

export class ActivePongGame {
    private loop?: NodeJS.Timeout;
    private isEnding = false;
    private gameStartTime = Date.now();
    private readonly GAME_TIMEOUT_MS = 1 * 60 * 1000; // 5 minutos timeout

    constructor(
        public readonly matchId: number,
        public readonly game: PongGame,
        private readonly fastify: FastifyInstance,
        // Callback async - se ejecuta DESPUÉS de guardar el match
        private readonly onGameEnd: (matchId: number) => Promise<void>
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

    private processTick(): void {
        try {
            // Paso 1: Verificar si el juego ha sido cancelado
            if (this.game.getIsCancelled()) {
                if (!this.isEnding) {
                    this.isEnding = true;
                    // No esperar aquí, pero envolver en Promise
                    this.handleGameEnd(() => this.cancelMatch());
                }
                return;
            }

            // Paso 2: Verificar si el juego ha terminado
            if (this.game.isGameOver()) {
                if (!this.isEnding) {
                    this.isEnding = true;
                    // No esperar aquí, pero envolver en Promise
                    this.handleGameEnd(() => this.saveMatchHistory());
                }
                return;
            }

            // Paso 3: Actualizar el juego
            this.game.update();

            // Paso 4: Verificar timeout si el juego no ha comenzado
            if (this.game.isTimeoutWindow()) {
                if (Date.now() - this.gameStartTime > this.GAME_TIMEOUT_MS) {
                    this.handleGameEnd(() => this.cancelMatchDueToTimeout());
                    return;
                }
            }

            // Paso 5: Verificar nuevamente si el juego ha terminado después de la actualización
            if (this.game.isGameOver() && !this.isEnding) {
                this.isEnding = true;
                this.handleGameEnd(() => this.saveMatchHistory());
            }
        } catch (error) {
            this.fastify.log.error(error, `Error processing game tick for game ${this.matchId}`);
            this.stop();
            // Llamar callback de error sin guardar
            this.onGameEnd(this.matchId).catch((err) => {
                this.fastify.log.error(err, 'Error in onGameEnd callback');
            });
        }
    }

    /**
     * Maneja el fin del juego de manera asíncrona pero sin bloquear el tick
     * 1. Detiene el loop
     * 2. Guarda el estado del match
     * 3. Llama al callback onGameEnd
     */
    private handleGameEnd(saveFunction: () => Promise<void>): void {
        this.stop();

        // Ejecutar de manera asíncrona pero sin bloquear
        (async () => {
            try {
                // PRIMERO: Guardar el estado del match
                await saveFunction();

                // SEGUNDO: Llamar al callback (que procesará el resultado del torneo)
                await this.onGameEnd(this.matchId);
            } catch (error) {
                this.fastify.log.error(error, `Error handling game end for game ${this.matchId}`);
            }
        })();
    }

    private async cancelMatchDueToTimeout(): Promise<void> {
        try {
            const match = await this.fastify.MatchRepository.findById({ id: this.matchId });

            if (!match) {
                this.fastify.log.error(`Match with ID ${this.matchId} not found for timeout cancellation`);
                return;
            }

            // Verificar el estado isReady de los jugadores para determinar ganador
            const gameState = this.game.getGameState();
            const player1Ready = gameState.player1?.isReady || false;
            const player2Ready = gameState.player2?.isReady || false;

            const winnerIds: number[] = [];
            const finalScores: Record<number, number> = {};

            // Si solo un jugador está listo, ese jugador gana
            if (player1Ready && !player2Ready && gameState.player1) {
                winnerIds.push(Number(gameState.player1.id));
                finalScores[Number(gameState.player1.id)] = this.game.getGameRules().winnerScore;
                finalScores[Number(gameState.player2?.id || 0)] = 0;
            } else if (!player1Ready && player2Ready && gameState.player2) {
                winnerIds.push(Number(gameState.player2.id));
                finalScores[Number(gameState.player2.id)] = this.game.getGameRules().winnerScore;
                finalScores[Number(gameState.player1?.id || 0)] = 0;
            } else {
                // Si ninguno está listo o ambos están listos, cancelar sin ganador
                finalScores[Number(gameState.player1?.id || 0)] = 0;
                finalScores[Number(gameState.player2?.id || 0)] = 0;
            }

            if (winnerIds.length > 0) {
                // Hay un ganador por timeout - marcar como completado
                const matchEnded = match.end(winnerIds, finalScores);
                if (!matchEnded) {
                    this.fastify.log.error(`Failed to end match ${this.matchId} with timeout winner`);
                    match.cancel();
                }
            } else {
                // No hay ganador - cancelar match
                match.cancel();
            }

            // CRÍTICO: Guardar el match ANTES de retornar
            const updatedMatch = await this.fastify.MatchRepository.update({ match });
            if (!updatedMatch) {
                this.fastify.log.error(`Failed to update match ${this.matchId} status after timeout`);
            }
        } catch (error) {
            this.fastify.log.error(error, `Error handling match ${this.matchId} timeout`);
            throw error; // Re-lanzar para que handleGameEnd lo capture
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

            // CRÍTICO: Guardar el match ANTES de retornar
            const updatedMatch = await this.fastify.MatchRepository.update({ match });
            if (!updatedMatch) {
                this.fastify.log.error(`Failed to update match ${this.matchId} status to cancelled`);
            }
        } catch (error) {
            this.fastify.log.error(error, `Error cancelling match ${this.matchId}`);
            throw error; // Re-lanzar para que handleGameEnd lo capture
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
                    `Failed to end match ${this.matchId} for game ${this.matchId} - match not in progress`
                );
                return;
            }

            // CRÍTICO: Guardar el match ANTES de retornar
            const updatedMatch = await this.fastify.MatchRepository.update({ match });
            if (!updatedMatch) {
                this.fastify.log.error(`Failed to update match ${this.matchId} for game ${this.matchId}`);
            }
        } catch (error) {
            this.fastify.log.error(error, `Error saving match history for game ${this.matchId}`);
            throw error; // Re-lanzar para que handleGameEnd lo capture
        }
    }
}
