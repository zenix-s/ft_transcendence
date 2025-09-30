import { UserStatsRow } from '@shared/infrastructure/db/types';
import { AbstractRepository } from '@shared/infrastructure/db/AbstractRepository';

export class MatchPlayerRepository extends AbstractRepository {
    async getUserStats(userId: number): Promise<{
        totalMatches: number;
        wins: number;
        losses: number;
        winRate: number;
        totalScore: number;
    }> {
        const stats = await this.findOne<UserStatsRow>(
            `SELECT
                COUNT(*) as totalMatches,
                IFNULL(SUM(CASE WHEN is_winner = 1 THEN 1 ELSE 0 END), 0) as wins,
                IFNULL(SUM(score), 0) as totalScore
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
