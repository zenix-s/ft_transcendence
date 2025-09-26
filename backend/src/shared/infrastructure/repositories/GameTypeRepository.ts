import { SQLiteConnection } from '@shared/infrastructure/db/SQLiteConnection';
import { GameType } from '@shared/domain/types/game.types';

export class GameTypeRepository {
    constructor(private connection: SQLiteConnection) {}

    async findAll(): Promise<GameType[]> {
        const result = await this.connection.selectMany<GameType>(
            'SELECT * FROM game_types ORDER BY created_at DESC'
        );
        return result;
    }

    async findById(id: number): Promise<GameType | null> {
        const result = await this.connection.selectOne<GameType>('SELECT * FROM game_types WHERE id = ?', [
            id,
        ]);
        return result;
    }

    async findByName(name: string): Promise<GameType | null> {
        const result = await this.connection.selectOne<GameType>('SELECT * FROM game_types WHERE name = ?', [
            name,
        ]);
        return result;
    }

    async create(gameType: Omit<GameType, 'id' | 'created_at'>): Promise<GameType> {
        const result = await this.connection.execute(
            `INSERT INTO game_types (name, display_name, min_players, max_players)
             VALUES (?, ?, ?, ?)`,
            [gameType.name, gameType.display_name, gameType.min_players, gameType.max_players]
        );

        const insertedId = result.insertId;
        if (!insertedId) {
            throw new Error('Failed to get inserted ID');
        }

        const created = await this.findById(insertedId);
        if (!created) {
            throw new Error('Failed to create game type');
        }
        return created;
    }

    async update(
        id: number,
        gameType: Partial<Omit<GameType, 'id' | 'created_at'>>
    ): Promise<GameType | null> {
        const fields: string[] = [];
        const values: unknown[] = [];

        if (gameType.name !== undefined) {
            fields.push('name = ?');
            values.push(gameType.name);
        }
        if (gameType.display_name !== undefined) {
            fields.push('display_name = ?');
            values.push(gameType.display_name);
        }
        if (gameType.min_players !== undefined) {
            fields.push('min_players = ?');
            values.push(gameType.min_players);
        }
        if (gameType.max_players !== undefined) {
            fields.push('max_players = ?');
            values.push(gameType.max_players);
        }

        if (fields.length === 0) {
            return await this.findById(id);
        }

        values.push(id);
        await this.connection.execute(`UPDATE game_types SET ${fields.join(', ')} WHERE id = ?`, values);

        return await this.findById(id);
    }

    async delete(id: number): Promise<boolean> {
        const result = await this.connection.execute('DELETE FROM game_types WHERE id = ?', [id]);
        return Number(result.affectedRows) > 0;
    }
}
