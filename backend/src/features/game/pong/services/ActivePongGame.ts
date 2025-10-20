import { FastifyInstance } from 'fastify';
import { PongGame } from '../domain/PongGame';

export class ActivePongGame {
    private loop?: NodeJS.Timeout;
    private isEnding = false;
    private lastUpdate = Date.now();

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

    updateGame(game: PongGame): void {
        Object.assign(this.game, game);
        this.lastUpdate = Date.now();
    }

    private processTick(): void {
        try {
            if (!this.game.isGameRunning() || this.game.isGameOver()) {
                if (this.game.isGameOver() && !this.isEnding) {
                    this.isEnding = true;
                    this.saveMatchHistory();
                }
                this.stop();
                this.onGameEnd(this.gameId);
                return;
            }

            this.game.update();
            this.lastUpdate = Date.now();

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
            } else {
                this.fastify.log.info(`Match history saved for game ${this.gameId}`);
            }
        } catch (error) {
            this.fastify.log.error(error, `Error saving match history for game ${this.gameId}`);
        }
    }
}
