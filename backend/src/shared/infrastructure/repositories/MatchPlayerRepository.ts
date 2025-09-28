import { SQLiteConnection } from '@shared/infrastructure/db/SQLiteConnection';

export class MatchPlayerRepository {
    constructor(private connection: SQLiteConnection) {}

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
