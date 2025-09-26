import { SQLiteConnection } from '@shared/infrastructure/db/SQLiteConnection';
import { GameType } from '@shared/domain/types/game.types';

export class GameTypeRepository {
    constructor(private connection: SQLiteConnection) {}

    async findByName(name: string): Promise<GameType | null> {
        const result = await this.connection.selectOne<GameType>('SELECT * FROM game_types WHERE name = ?', [
            name,
        ]);
        return result;
    }
}
