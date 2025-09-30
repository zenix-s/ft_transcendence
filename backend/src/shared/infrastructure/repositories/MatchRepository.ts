import { Match } from '@shared/domain/entity/Match.entity';
import { MatchRow, MatchPlayerRow } from '@shared/infrastructure/db/types';
import { AbstractRepository } from '@shared/infrastructure/db/AbstractRepository';

export class MatchRepository extends AbstractRepository {
    async findAll(limit = 100, offset = 0): Promise<Match[]> {
        const result = await this.findMany<MatchRow>(
            'SELECT * FROM matches ORDER BY created_at DESC LIMIT ? OFFSET ?',
            [limit, offset]
        );

        const matches: Match[] = [];
        for (const row of result) {
            const players = await this.findMany<MatchPlayerRow>(
                `
                    SELECT
                        mp.user_id,
                        u.username,
                        mp.score,
                        mp.is_winner
                    FROM
                        match_players mp
                        INNER JOIN users u ON mp.user_id = u.id
                    WHERE
                        match_id = ?
                `,
                [row.id]
            );
            matches.push(
                Match.fromDatabase({
                    ...row,
                    players,
                    started_at: row.started_at || undefined,
                    ended_at: row.ended_at || undefined,
                })
            );
        }

        return matches;
    }

    async findById(id: number): Promise<Match | null> {
        const result = await this.findOne<MatchRow>('SELECT * FROM matches WHERE id = ?', [id]);
        if (!result) return null;

        const players = await this.findMany<MatchPlayerRow>(
            'SELECT user_id, score, is_winner FROM match_players WHERE match_id = ?',
            [id]
        );

        return Match.fromDatabase({
            ...result,
            players,
            started_at: result.started_at || undefined,
            ended_at: result.ended_at || undefined,
        });
    }

    async findUserMatches(userId: number): Promise<Match[]> {
        const result = await this.findMany<MatchRow>(
            'SELECT m.* FROM matches m JOIN match_players mp ON m.id = mp.match_id WHERE mp.user_id = ? ORDER BY m.created_at DESC',
            [userId]
        );

        const matches: Match[] = [];
        for (const row of result) {
            const players = await this.findMany<MatchPlayerRow>(
                `
                    SELECT
                        mp.user_id,
                        u.username,
                        mp.score,
                        mp.is_winner
                    FROM
                        match_players mp
                        INNER JOIN users u ON mp.user_id = u.id
                    WHERE
                        match_id = ?
                `,
                [row.id]
            );

            const match = Match.fromDatabase({
                ...row,
                players,
                started_at: row.started_at || undefined,
                ended_at: row.ended_at || undefined,
            });
            matches.push(match);
        }

        return matches;
    }

    async create(match: Match): Promise<Match> {
        await this.run('BEGIN TRANSACTION');

        try {
            const matchData = match.toDatabase();
            const params = [
                matchData.game_type_id,
                matchData.status,
                matchData.started_at ? matchData.started_at.toISOString() : null,
                matchData.ended_at ? matchData.ended_at.toISOString() : null,
                matchData.created_at.toISOString(),
            ];

            const matchResult = await this.run(
                'INSERT INTO matches (game_type_id, status, started_at, ended_at, created_at) VALUES (?, ?, ?, ?, ?)',
                params
            );

            const matchId = matchResult.insertId;
            if (!matchId) throw new Error('Failed to get inserted match ID');

            match.setId(Number(matchId));

            for (const player of match.players) {
                await this.run(
                    'INSERT INTO match_players (match_id, user_id, score, is_winner) VALUES (?, ?, ?, ?)',
                    [matchId, player.userId, player.score, player.isWinner ? 1 : 0]
                );
            }

            await this.run('COMMIT');
            return match;
        } catch (error) {
            await this.run('ROLLBACK');
            throw error;
        }
    }

    async update(match: Match): Promise<Match | null> {
        if (!match.id) throw new Error('Cannot update match without ID');

        await this.run('BEGIN TRANSACTION');
        try {
            const matchData = match.toDatabase();

            await this.run(
                'UPDATE matches SET game_type_id = ?, status = ?, started_at = ?, ended_at = ? WHERE id = ?',
                [
                    matchData.game_type_id,
                    matchData.status,
                    matchData.started_at ? matchData.started_at.toISOString() : null,
                    matchData.ended_at ? matchData.ended_at.toISOString() : null,
                    match.id,
                ]
            );

            await this.run('DELETE FROM match_players WHERE match_id = ?', [match.id]);

            for (const player of match.players) {
                await this.run(
                    'INSERT INTO match_players (match_id, user_id, score, is_winner) VALUES (?, ?, ?, ?)',
                    [match.id, player.userId, player.score, player.isWinner ? 1 : 0]
                );
            }

            await this.run('COMMIT');
            return match;
        } catch (error) {
            await this.run('ROLLBACK');
            throw error;
        }
    }

    async delete(id: number): Promise<boolean> {
        const result = await this.run('DELETE FROM matches WHERE id = ?', [id]);
        return Number(result.affectedRows) > 0;
    }

    async getMatchCount(gameTypeId?: number): Promise<number> {
        const query = gameTypeId
            ? 'SELECT COUNT(*) as count FROM matches WHERE game_type_id = ?'
            : 'SELECT COUNT(*) as count FROM matches';
        const params = gameTypeId ? [gameTypeId] : [];

        const result = await this.findOne<{ count: number }>(query, params);
        return Number(result?.count) || 0;
    }
}
