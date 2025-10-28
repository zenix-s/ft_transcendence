import { Result } from '@shared/abstractions/Result';
import { PongGame } from '../domain/PongGame';
import { GameState } from '../Pong.types';

export interface IPongGameManager {
    /**
     * Crea un nuevo juego activo y lo inicia
     */
    createGame(gameId: number, matchId: number, game: PongGame): Promise<Result<void>>;

    /**
     * Obtiene un juego por su ID
     */
    getGame(gameId: number): Result<PongGame>;

    /**
     * Mueve la paleta de un jugador
     */
    movePaddle(gameId: number, playerId: number, direction: 'up' | 'down'): Result<void>;

    /**
     * Establece el estado de listo de un jugador
     */
    setPlayerReady(gameId: number, playerId: number, isReady: boolean): Result<{ gameStarted: boolean }>;

    /**
     * Agrega un jugador al juego
     */
    addPlayerToGame(gameId: number, playerId: number): Result<void>;

    /**
     * Obtiene el estado actual de un juego
     */
    getGameState(gameId: number): Result<{ gameId: number; state: GameState }>;

    /**
     * Elimina un juego activo y lo detiene
     */
    deleteGame(gameId: number): Result<void>;

    /**
     * Verifica si un juego existe
     */
    gameExists(gameId: number): Result<boolean>;

    /**
     * Obtiene todos los juegos activos
     */
    getAllGames(): Result<Map<number, PongGame>>;

    /**
     * Obtiene el número de juegos activos
     */
    getActiveGameCount(): Result<number>;

    /**
     * Obtiene los IDs de todos los juegos activos
     */
    getActiveGameIds(): Result<number[]>;
}
