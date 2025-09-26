import { SQLiteConnection } from '@shared/infrastructure/db/SQLiteConnection';
import { MatchPlayer, MatchPlayerWithUser } from '@shared/domain/types/game.types';

export class MatchPlayerRepository {
    constructor(private connection: SQLiteConnection) {}

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
