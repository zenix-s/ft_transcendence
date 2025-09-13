import { Result } from '@shared/abstractions/Result';
import { PongGame } from '../../dominio/PongGame';

export interface IGameRepository {
    createGame(game: PongGame): Promise<Result<string>>;
    getGame(gameId: string): Promise<Result<PongGame>>;
    updateGame(gameId: string, game: PongGame): Promise<Result<void>>;
    deleteGame(gameId: string): Promise<Result<void>>;
    getAllGames(): Promise<Result<Map<string, PongGame>>>;
    exists(gameId: string): Promise<Result<boolean>>;
}
