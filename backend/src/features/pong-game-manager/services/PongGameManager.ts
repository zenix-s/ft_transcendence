import { FastifyInstance } from 'fastify';
import { Result } from '@shared/abstractions/Result';
import { PongGame } from '../domain/PongGame';
import { ActivePongGame } from './ActivePongGame';
import { ApplicationError } from '@shared/Errors';
import { IPongGameManager } from './IPongGameManager.interface';
import { GameState, GameSettings } from '../Pong.types';

export class PongGameManager implements IPongGameManager {
    private activeGames = new Map<number, ActivePongGame>();

    constructor(private readonly fastify: FastifyInstance) {
        this.setupProcessHandlers();
    }

    async createGame(gameId: number, matchId: number, game: PongGame): Promise<Result<void>> {
        try {
            this.deleteGame(gameId);

            const activeGame = new ActivePongGame(gameId, matchId, game, this.fastify, (id: number) =>
                this.onGameEnd(id)
            );

            activeGame.start();
            this.activeGames.set(gameId, activeGame);

            return Result.success(undefined);
        } catch (error) {
            return this.fastify.handleError({
                code: ApplicationError.InternalServerError,
                error,
            });
        }
    }

    async createTournamentMatch(
        gameId: number,
        matchId: number,
        game: PongGame,
        onMatchEnd: (matchId: number, winnerId: number, loserId: number) => Promise<void>
    ): Promise<Result<void>> {
        try {
            this.deleteGame(gameId);

            const activeGame = new ActivePongGame(
                gameId,
                matchId,
                game,
                this.fastify,
                (id: number) => this.onGameEnd(id),
                true, // isTournamentMatch
                // onMatchEnd // onTournamentMatchEnd callback
                async (mId: number, winnerId: number, loserId: number) => {
                    await onMatchEnd(mId, winnerId, loserId);
                    this.onGameEnd(gameId);
                }
            );

            activeGame.start();
            this.activeGames.set(gameId, activeGame);

            return Result.success(undefined);
        } catch (error) {
            return this.fastify.handleError({
                code: ApplicationError.InternalServerError,
                error,
            });
        }
    }

    getGame(gameId: number): Result<PongGame> {
        const activeGame = this.activeGames.get(gameId);
        if (!activeGame) {
            return Result.error(ApplicationError.GameNotFound);
        }
        return Result.success(activeGame.game);
    }

    movePaddle(gameId: number, playerId: number, direction: 'up' | 'down'): Result<void> {
        const activeGame = this.activeGames.get(gameId);
        if (!activeGame) {
            return Result.error(ApplicationError.GameNotFound);
        }

        const moved = activeGame.game.movePlayer(playerId, direction);
        if (!moved) {
            return Result.error(ApplicationError.PlayerNotInGame);
        }

        return Result.success(undefined);
    }

    setPlayerReady(gameId: number, playerId: number, isReady: boolean): Result<{ gameStarted: boolean }> {
        const activeGame = this.activeGames.get(gameId);
        if (!activeGame) {
            return Result.error(ApplicationError.GameNotFound);
        }

        const success = activeGame.game.setPlayerReady(playerId, isReady);
        if (!success) {
            return Result.error(ApplicationError.PlayerNotInGame);
        }

        const gameStarted = activeGame.game.isGameRunning();
        return Result.success({ gameStarted });
    }

    async addPlayerToGame(gameId: number, playerId: number): Promise<Result<void>> {
        try {
            // Paso 1: Validar que el juego existe en memoria
            const activeGame = this.activeGames.get(gameId);
            if (!activeGame) {
                return Result.error(ApplicationError.GameNotFound);
            }

            // Paso 2: Obtener los datos del usuario desde la base de datos
            const userResult = await this.fastify.UserRepository.getUser({ id: playerId });
            if (!userResult.isSuccess || !userResult.value) {
                return Result.error(userResult.error || ApplicationError.UserNotFound);
            }

            // Paso 3: Agregar el jugador al juego en memoria
            const added = activeGame.game.addPlayer(playerId, userResult.value);
            if (!added) {
                return Result.error(ApplicationError.GameFull);
            }

            // Paso 4: Obtener la entidad Match de la base de datos
            const match = await this.fastify.MatchRepository.findById({ id: activeGame.matchId });
            if (!match) {
                return Result.error(ApplicationError.MatchNotFound);
            }

            // Paso 5: Agregar el jugador a la entidad Match y guardar en base de datos
            const playerAddedToMatch = match.addPlayer(playerId);
            if (playerAddedToMatch) {
                await this.fastify.MatchRepository.update({ match });
            }

            // Paso 6: Determinar si el juego puede iniciarse
            const canGameStart = activeGame.game.canStart(); // Verifica si hay player1 y player2 (incluyendo AI)
            const canMatchStart = match.canStart(); // Verifica si status es PENDING y hay jugadores

            // Paso 7: Iniciar el match automáticamente si se cumplen las condiciones
            if (canGameStart && canMatchStart) {
                // En single player: se inicia cuando el jugador humano se une (AI ya está listo)
                // En multiplayer: se inicia cuando ambos jugadores humanos se han unido
                const started = match.start();
                if (started) {
                    await this.fastify.MatchRepository.update({ match });
                }
            }

            return Result.success(undefined);
        } catch (error) {
            return this.fastify.handleError({
                code: ApplicationError.InternalServerError,
                error,
            });
        }
    }

    getGameState(gameId: number): Result<{ gameId: number; state: GameState }> {
        const gameResult = this.getGame(gameId);
        if (!gameResult.isSuccess) {
            return Result.error(gameResult.error || ApplicationError.GameNotFound);
        }
        if (!gameResult.value) {
            return Result.error(ApplicationError.GameNotFound);
        }
        return Result.success({
            gameId,
            state: gameResult.value.getGameState(),
        });
    }

    deleteGame(gameId: number): Result<void> {
        const activeGame = this.activeGames.get(gameId);
        if (!activeGame) {
            return Result.error(ApplicationError.GameNotFound);
        }
        activeGame.stop();
        this.activeGames.delete(gameId);
        return Result.success(undefined);
    }

    gameExists(gameId: number): Result<boolean> {
        return Result.success(this.activeGames.has(gameId));
    }

    getAllGames(): Result<Map<number, PongGame>> {
        const games = new Map<number, PongGame>();
        this.activeGames.forEach((activeGame, gameId) => {
            games.set(gameId, activeGame.game);
        });
        return Result.success(games);
    }

    private onGameEnd(gameId: number): void {
        this.activeGames.delete(gameId);
    }

    private setupProcessHandlers(): void {
        const cleanup = () => {
            this.activeGames.forEach((activeGame) => {
                activeGame.stop();
            });
            this.activeGames.clear();
        };

        process.on('SIGINT', cleanup);
        process.on('SIGTERM', cleanup);
    }

    getActiveGameCount(): Result<number> {
        return Result.success(this.activeGames.size);
    }

    getActiveGameIds(): Result<number[]> {
        return Result.success(Array.from(this.activeGames.keys()));
    }

    modifyGameSettings(gameId: number, playerId: number, settings: GameSettings): Result<void> {
        const activeGame = this.activeGames.get(gameId);
        if (!activeGame) {
            return Result.error(ApplicationError.GameNotFound);
        }

        // Verificar que el jugador esté en el juego
        if (!activeGame.game.hasPlayer(playerId)) {
            return Result.error(ApplicationError.PlayerNotInGame);
        }

        // Verificar que el juego no haya empezado
        if (activeGame.game.isGameRunning()) {
            return Result.error(ApplicationError.GameAlreadyStarted);
        }

        // Modificar las configuraciones
        const success = activeGame.game.modifySettings(settings);
        if (!success) {
            return Result.error(ApplicationError.InvalidRequest);
        }

        return Result.success(undefined);
    }

    leaveGame(gameId: number, playerId: number): Result<void> {
        const activeGame = this.activeGames.get(gameId);
        if (!activeGame) {
            return Result.error(ApplicationError.GameNotFound);
        }

        // Verificar que el jugador esté en el juego
        if (!activeGame.game.hasPlayer(playerId)) {
            return Result.error(ApplicationError.PlayerNotInGame);
        }

        // Llamar a cancelGame (maneja tanto partidas en curso como no iniciadas)
        const success = activeGame.game.cancelGame(playerId);
        if (!success) {
            return Result.error(ApplicationError.InvalidRequest);
        }

        // // Si el juego fue cancelado (no había empezado), eliminarlo de memoria
        // if (activeGame.game.getIsCancelled()) {
        //     activeGame.stop();
        //     this.activeGames.delete(gameId);
        // }
        // Si estaba en curso, el juego terminará normalmente con ganador

        return Result.success(undefined);
    }
}
