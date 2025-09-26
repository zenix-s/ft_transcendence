import { Result } from '@shared/abstractions/Result';
import { PongGame } from '../../domain/PongGame';

export interface IGameRepository {
    createGame(game: PongGame, matchId: number): Promise<Result<number>>;
    getGame(gameId: number): Promise<Result<PongGame>>;
    updateGame(gameId: number, game: PongGame): Promise<Result<void>>;
    deleteGame(gameId: number): Promise<Result<void>>;
    getAllGames(): Promise<Result<Map<number, PongGame>>>;
    exists(gameId: number): Promise<Result<boolean>>;
}
