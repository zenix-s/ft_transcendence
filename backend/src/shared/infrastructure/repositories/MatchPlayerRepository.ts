import { SQLiteConnection } from '@shared/infrastructure/db/SQLiteConnection';
import { MatchPlayer, MatchPlayerWithUser } from '@shared/domain/types/game.types';

export class MatchPlayerRepository {
    constructor(private connection: SQLiteConnection) {}

    async findByMatch(matchId: number): Promise<MatchPlayer[]> {
        const result = await this.connection.selectMany<MatchPlayer>(
            'SELECT * FROM match_players WHERE match_id = ? ORDER BY score DESC',
            [matchId]
        );
        return result;
    }

    async findByMatchWithUsers(matchId: number): Promise<MatchPlayerWithUser[]> {
        const result = await this.connection.selectMany<MatchPlayerWithUser>(
            `SELECT mp.*, u.username
             FROM match_players mp
             JOIN users u ON mp.user_id = u.id
             WHERE mp.match_id = ?
             ORDER BY mp.score DESC`,
            [matchId]
        );
        return result;
    }

    async findByUser(userId: number): Promise<MatchPlayer[]> {
        const result = await this.connection.selectMany<MatchPlayer>(
            'SELECT * FROM match_players WHERE user_id = ? ORDER BY joined_at DESC',
            [userId]
        );
        return result;
    }

    async findByMatchAndUser(matchId: number, userId: number): Promise<MatchPlayer | null> {
        const result = await this.connection.selectOne<MatchPlayer>(
            'SELECT * FROM match_players WHERE match_id = ? AND user_id = ?',
            [matchId, userId]
        );
        return result;
    }

    async add(matchId: number, userId: number): Promise<MatchPlayer> {
        await this.connection.execute(
            `INSERT INTO match_players (match_id, user_id, score, is_winner)
             VALUES (?, ?, 0, 0)`,
            [matchId, userId]
        );

        const inserted = await this.findByMatchAndUser(matchId, userId);
        if (!inserted) {
            throw new Error('Failed to add player to match');
        }
        return inserted;
    }

    async updateScore(matchId: number, userId: number, score: number): Promise<void> {
        await this.connection.execute(
            'UPDATE match_players SET score = ? WHERE match_id = ? AND user_id = ?',
            [score, matchId, userId]
        );
    }

    async setWinner(matchId: number, userId: number): Promise<void> {
        await this.connection.execute(
            'UPDATE match_players SET is_winner = 1 WHERE match_id = ? AND user_id = ?',
            [matchId, userId]
        );
    }

    async setWinners(matchId: number, userIds: number[]): Promise<void> {
        // First, set all players as losers
        await this.connection.execute('UPDATE match_players SET is_winner = 0 WHERE match_id = ?', [matchId]);

        // Then set winners
        if (userIds.length > 0) {
            const placeholders = userIds.map(() => '?').join(',');
            await this.connection.execute(
                `UPDATE match_players SET is_winner = 1
                 WHERE match_id = ? AND user_id IN (${placeholders})`,
                [matchId, ...userIds]
            );
        }
    }

    async remove(matchId: number, userId: number): Promise<boolean> {
        const result = await this.connection.execute(
            'DELETE FROM match_players WHERE match_id = ? AND user_id = ?',
            [matchId, userId]
        );
        return Number(result.affectedRows) > 0;
    }

    async removeAllFromMatch(matchId: number): Promise<boolean> {
        const result = await this.connection.execute('DELETE FROM match_players WHERE match_id = ?', [
            matchId,
        ]);
        return Number(result.affectedRows) > 0;
    }

    async getWinners(matchId: number): Promise<MatchPlayerWithUser[]> {
        const result = await this.connection.selectMany<MatchPlayerWithUser>(
            `SELECT mp.*, u.username
             FROM match_players mp
             JOIN users u ON mp.user_id = u.id
             WHERE mp.match_id = ? AND mp.is_winner = 1
             ORDER BY mp.score DESC`,
            [matchId]
        );
        return result;
    }

    async getUserWinCount(userId: number): Promise<number> {
        const result = await this.connection.selectOne<{ count: number }>(
            'SELECT COUNT(*) as count FROM match_players WHERE user_id = ? AND is_winner = 1',
            [userId]
        );
        return result?.count || 0;
    }

    async getUserMatchCount(userId: number): Promise<number> {
        const result = await this.connection.selectOne<{ count: number }>(
            'SELECT COUNT(*) as count FROM match_players WHERE user_id = ?',
            [userId]
        );
        return result?.count || 0;
    }

    async getUserStats(userId: number): Promise<{
        totalMatches: number;
        wins: number;
        losses: number;
        winRate: number;
        totalScore: number;
    }> {
        const stats = await this.connection.selectOne<{
            totalMatches: number;
            wins: number;
            totalScore: number;
        }>(
            `SELECT
                COUNT(*) as totalMatches,
                SUM(CASE WHEN is_winner = 1 THEN 1 ELSE 0 END) as wins,
                SUM(score) as totalScore
             FROM match_players
             WHERE user_id = ?`,
            [userId]
        );

        const result = stats || { totalMatches: 0, wins: 0, totalScore: 0 };
        const losses = result.totalMatches - result.wins;
        const winRate = result.totalMatches > 0 ? result.wins / result.totalMatches : 0;

        return {
            totalMatches: result.totalMatches,
            wins: result.wins,
            losses,
            winRate,
            totalScore: result.totalScore || 0,
        };
    }
}
