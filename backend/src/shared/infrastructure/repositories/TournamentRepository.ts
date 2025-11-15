import { Tournament } from '@shared/domain/Entities/Tournament.entity';
import { AbstractRepository } from '../db/AbstractRepository';
import fp from 'fastify-plugin';
import { Result } from '@shared/abstractions/Result';
import { ApplicationError } from '@shared/Errors';

export interface ITournamentRepository {
    createTournament({ tournament }: { tournament: Tournament }): Promise<Result<number>>;
}

class TournamentRepository extends AbstractRepository implements ITournamentRepository {
    async createTournament({ tournament }: { tournament: Tournament }): Promise<Result<number>> {
        await this.run('BEGIN TRANSACTION');

        try {
            // id INTEGER PRIMARY KEY AUTOINCREMENT,
            // name TEXT NOT NULL,
            // match_type_id INTEGER NOT NULL,
            // status TEXT NOT NULL DEFAULT 'upcoming',
            // start_date DATETIME NOT NULL,
            // end_date DATETIME,
            // created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            // FOREIGN KEY (match_type_id) REFERENCES match_types(id),
            // CHECK (status IN (
            //     'upcoming',
            //     'ongoing',
            //     'completed',
            //     'cancelled')
            // )

            const createResult = await this.run(
                `
                    INSERT INTO tournaments (
                        name,
                        match_type_id,
                        status,
                        start_date,
                        end_date,
                        created_at
                    ) VALUES
                    (?, ?, ?, ?, ?, ?)
                `,
                [
                    tournament.name,
                    tournament.matchTypeId,
                    tournament.status,
                    tournament.startDate.toISOString(),
                    tournament.endDate ? tournament.endDate.toISOString() : null,
                    tournament.createdAt.toISOString(),
                ]
            );

            if (createResult.affectedRows <= 0 || !createResult.insertId) {
                await this.run('ROLLBACK');
                return Result.failure(ApplicationError.InsertionError);
            }

            const tournamentId = createResult.insertId;

            await this.run('COMMIT');
            return Result.success(tournamentId);
        } catch (error) {
            await this.run('ROLLBACK');
            throw error;
        }
    }
}

export default fp(
    (fastify) => {
        const repo = new TournamentRepository(fastify.DbConnection);
        fastify.decorate('TournamentRepository', repo);
    },
    {
        name: 'TournamentRepository',
        dependencies: ['DbConnection'],
    }
);
