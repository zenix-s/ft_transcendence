import { SQLiteConnection } from '@shared/infrastructure/db/SQLiteConnection';
import { Match } from '@shared/domain/entity/Match.entity';

export class MatchRepository {
    constructor(private connection: SQLiteConnection) {}

    async findAll(limit = 100, offset = 0): Promise<Match[]> {
        const result = await this.connection.selectMany(
            'SELECT * FROM matches ORDER BY created_at DESC LIMIT ? OFFSET ?',
            [limit, offset]
        );

        const matches: Match[] = [];
        for (const row of result) {
            const players = await this.connection.selectMany(
                'SELECT user_id, score, is_winner FROM match_players WHERE match_id = ?',
                [row.id]
            );
            matches.push(Match.fromDatabase({ ...row, players }));
        }

        return matches;
    }

    async findById(id: number): Promise<Match | null> {
        const result = await this.connection.selectOne('SELECT * FROM matches WHERE id = ?', [id]);
        if (!result) return null;

        const players = await this.connection.selectMany(
            'SELECT user_id, score, is_winner FROM match_players WHERE match_id = ?',
            [id]
        );

        return Match.fromDatabase({ ...result, players });
    }

    async findUserMatches(userId: number): Promise<Match[]> {
        const result = await this.connection.selectMany(
            'SELECT m.* FROM matches m JOIN match_players mp ON m.id = mp.match_id WHERE mp.user_id = ? ORDER BY m.created_at DESC',
            [userId]
        );

        const matches: Match[] = [];
        for (const row of result) {
            const players = await this.connection.selectMany(
                'SELECT user_id, score, is_winner FROM match_players WHERE match_id = ?',
                [row.id]
            );

            const match = Match.fromDatabase({ ...row, players });
            matches.push(match);
        }

        return matches;
    }

    async create(match: Match): Promise<Match> {
        await this.connection.execute('BEGIN TRANSACTION');

        try {
            const matchData = match.toDatabase();
            const params = [
                matchData.game_type_id,
                matchData.status,
                matchData.started_at ? matchData.started_at.toISOString() : null,
                matchData.ended_at ? matchData.ended_at.toISOString() : null,
                matchData.created_at.toISOString(),
            ];

            const matchResult = await this.connection.execute(
                'INSERT INTO matches (game_type_id, status, started_at, ended_at, created_at) VALUES (?, ?, ?, ?, ?)',
                params
            );

            const matchId = matchResult.insertId;
            if (!matchId) throw new Error('Failed to get inserted match ID');

            match.setId(matchId);

            for (const player of match.players) {
                await this.connection.execute(
                    'INSERT INTO match_players (match_id, user_id, score, is_winner) VALUES (?, ?, ?, ?)',
                    [matchId, player.userId, player.score, player.isWinner ? 1 : 0]
                );
            }

            await this.connection.execute('COMMIT');
            return match;
        } catch (error) {
            await this.connection.execute('ROLLBACK');
            throw error;
        }
    }

    async update(match: Match): Promise<Match | null> {
        if (!match.id) throw new Error('Cannot update match without ID');

        await this.connection.execute('BEGIN TRANSACTION');
        try {
            const matchData = match.toDatabase();

            await this.connection.execute(
                'UPDATE matches SET game_type_id = ?, status = ?, started_at = ?, ended_at = ? WHERE id = ?',
                [
                    matchData.game_type_id,
                    matchData.status,
                    matchData.started_at ? matchData.started_at.toISOString() : null,
                    matchData.ended_at ? matchData.ended_at.toISOString() : null,
                    match.id,
                ]
            );

            await this.connection.execute('DELETE FROM match_players WHERE match_id = ?', [match.id]);

            for (const player of match.players) {
                await this.connection.execute(
                    'INSERT INTO match_players (match_id, user_id, score, is_winner) VALUES (?, ?, ?, ?)',
                    [match.id, player.userId, player.score, player.isWinner ? 1 : 0]
                );
            }

            await this.connection.execute('COMMIT');
            return match;
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
        const query = gameTypeId
            ? 'SELECT COUNT(*) as count FROM matches WHERE game_type_id = ?'
            : 'SELECT COUNT(*) as count FROM matches';
        const params = gameTypeId ? [gameTypeId] : [];

        const result = await this.connection.selectOne(query, params);
        return result?.count || 0;
    }
}
