import { SQLiteConnection } from '@shared/infrastructure/db/SQLiteConnection';
import {
    Match,
    MatchStatus,
    MatchWithDetails,
    CreateMatchDto,
    EndMatchDto,
} from '@shared/domain/types/game.types';

export class MatchRepository {
    constructor(private connection: SQLiteConnection) {}

    async findAll(limit = 100, offset = 0): Promise<Match[]> {
        const result = await this.connection.selectMany<Match>(
            'SELECT * FROM matches ORDER BY created_at DESC LIMIT ? OFFSET ?',
            [limit, offset]
        );
        return result;
    }

    async findById(id: number): Promise<Match | null> {
        const result = await this.connection.selectOne<Match>('SELECT * FROM matches WHERE id = ?', [id]);
        return result;
    }

    async findWithDetails(matchId: number): Promise<MatchWithDetails | null> {
        const match = await this.findById(matchId);
        if (!match) return null;

        const gameType = await this.connection.selectOne('SELECT * FROM game_types WHERE id = ?', [
            match.game_type_id,
        ]);

        const players = await this.connection.selectMany(
            `SELECT mp.*, u.username
             FROM match_players mp
             JOIN users u ON mp.user_id = u.id
             WHERE mp.match_id = ?`,
            [matchId]
        );

        return {
            ...match,
            game_type: gameType,
            players,
        };
    }

    async findUserMatches(userId: number): Promise<MatchWithDetails[]> {
        const matches = await this.connection.selectMany<Match>(
            `SELECT m.* FROM matches m
             JOIN match_players mp ON m.id = mp.match_id
             WHERE mp.user_id = ?
             ORDER BY m.created_at DESC`,
            [userId]
        );

        const results: MatchWithDetails[] = [];
        for (const match of matches) {
            const details = await this.findWithDetails(match.id);
            if (details) results.push(details);
        }
        return results;
    }

    async create(dto: CreateMatchDto): Promise<Match> {
        await this.connection.execute('BEGIN TRANSACTION');

        try {
            const matchResult = await this.connection.execute(
                `INSERT INTO matches (game_type_id, status)
                 VALUES (?, ?)`,
                [dto.game_type_id, MatchStatus.PENDING]
            );

            const matchId = matchResult.insertId;
            if (!matchId) {
                throw new Error('Failed to get inserted match ID');
            }

            for (const playerId of dto.player_ids) {
                await this.connection.execute(
                    `INSERT INTO match_players (match_id, user_id)
                     VALUES (?, ?)`,
                    [matchId, playerId]
                );
            }

            await this.connection.execute('COMMIT');

            const created = await this.findById(matchId);
            if (!created) {
                throw new Error('Failed to create match');
            }
            return created;
        } catch (error) {
            await this.connection.execute('ROLLBACK');
            throw error;
        }
    }

    async start(matchId: number): Promise<Match | null> {
        await this.connection.execute(
            `UPDATE matches
             SET status = ?, started_at = CURRENT_TIMESTAMP
             WHERE id = ? AND status = ?`,
            [MatchStatus.IN_PROGRESS, matchId, MatchStatus.PENDING]
        );
        return await this.findById(matchId);
    }

    async end(dto: EndMatchDto): Promise<Match | null> {
        await this.connection.execute('BEGIN TRANSACTION');

        try {
            await this.connection.execute(
                `UPDATE matches
                 SET status = ?, ended_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [MatchStatus.COMPLETED, dto.match_id]
            );

            for (const [userId, score] of Object.entries(dto.final_scores)) {
                const isWinner = dto.winner_ids.includes(Number(userId));
                await this.connection.execute(
                    `UPDATE match_players
                     SET score = ?, is_winner = ?
                     WHERE match_id = ? AND user_id = ?`,
                    [score, isWinner ? 1 : 0, dto.match_id, userId]
                );
            }

            await this.connection.execute('COMMIT');
            return await this.findById(dto.match_id);
        } catch (error) {
            await this.connection.execute('ROLLBACK');
            throw error;
        }
    }

    async delete(id: number): Promise<boolean> {
        const result = await this.connection.execute('DELETE FROM matches WHERE id = ?', [id]);
        return Number(result.affectedRows) > 0;
    }

    async getMatchCount(gameTypeId?: number): Promise<number> {
        let query = 'SELECT COUNT(*) as count FROM matches';
        const params: unknown[] = [];

        if (gameTypeId) {
            query += ' WHERE game_type_id = ?';
            params.push(gameTypeId);
        }

        const result = await this.connection.selectOne<{ count: number }>(query, params);
        return result?.count || 0;
    }
}
