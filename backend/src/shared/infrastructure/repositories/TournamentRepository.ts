import { Tournament, TournamentStatus } from '@shared/domain/Entities/Tournament.entity';
import { TournamentParticipant } from '@shared/domain/Entities/TournamentParticipant.entity';
import { AbstractRepository } from '../db/AbstractRepository';
import fp from 'fastify-plugin';
import { Result } from '@shared/abstractions/Result';
import { ApplicationError } from '@shared/Errors';
import { TournamentDbModel } from '@shared/infrastructure/db/models/Tournament.dbmodel';
import { TournamentParticipantDbModel } from '@shared/infrastructure/db/models/TournamentParticipant.dbmodel';

export interface ITournamentRepository {
    createTournament({ tournament }: { tournament: Tournament }): Promise<Result<number>>;
    findTournaments(params: {
        limit?: number;
        offset?: number;
        status?: TournamentStatus[];
    }): Promise<Result<Tournament[]>>;
    findById({ id }: { id: number }): Promise<Result<Tournament | null>>;
    update({ tournament }: { tournament: Tournament }): Promise<Result<Tournament>>;
}

class TournamentRepository extends AbstractRepository implements ITournamentRepository {
    async createTournament({ tournament }: { tournament: Tournament }): Promise<Result<number>> {
        await this.run('BEGIN TRANSACTION');

        try {
            const createResult = await this.run(
                `
                    INSERT INTO tournaments (
                        name,
                        match_type_id,
                        status,
                        created_at
                    ) VALUES
                    (?, ?, ?, ?)
                `,
                [
                    tournament.name,
                    tournament.matchTypeId,
                    tournament.status,
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

    async findTournaments({
        limit = 100,
        offset = 0,
        status = [],
    }: {
        limit?: number;
        offset?: number;
        status?: TournamentStatus[];
    } = {}): Promise<Result<Tournament[]>> {
        try {
            let statusCondition = '';
            let params: (TournamentStatus | number)[] = [];

            if (status.length > 0) {
                const statusPlaceholders = status.map(() => '?').join(', ');
                statusCondition = `WHERE status IN (${statusPlaceholders})`;
                params = [...status];
            }

            params.push(limit, offset);

            const result = await this.findMany<TournamentDbModel>(
                `
                    SELECT
                        *
                    FROM
                        tournaments
                    ${statusCondition}
                    ORDER BY
                        created_at DESC
                    LIMIT ? OFFSET ?
                `,
                params
            );

            const tournaments: Tournament[] = [];
            for (const row of result) {
                // Buscar participantes del torneo
                const participants = await this.findMany<TournamentParticipantDbModel>(
                    `
                        SELECT
                            *
                        FROM
                            tournament_participants
                        WHERE
                            tournament_id = ?
                    `,
                    [row.id]
                );

                const tournamentParticipants = participants.map((p) => TournamentParticipant.fromDatabase(p));

                tournaments.push(
                    Tournament.fromDatabase({
                        ...row,
                        participants: tournamentParticipants,
                    })
                );
            }

            return Result.success(tournaments);
        } catch {
            return Result.error(ApplicationError.DatabaseServiceUnavailable);
        }
    }

    async findById({ id }: { id: number }): Promise<Result<Tournament | null>> {
        try {
            const result = await this.findOne<TournamentDbModel>(
                `
                    SELECT
                        *
                    FROM
                        tournaments
                    WHERE
                        id = ?
                `,
                [id]
            );

            if (!result) return Result.success(null);

            // Buscar participantes del torneo
            const participants = await this.findMany<TournamentParticipantDbModel>(
                `
                    SELECT
                        *
                    FROM
                        tournament_participants
                    WHERE
                        tournament_id = ?
                `,
                [id]
            );

            const tournamentParticipants = participants.map((p) => TournamentParticipant.fromDatabase(p));

            const tournament = Tournament.fromDatabase({
                ...result,
                participants: tournamentParticipants,
            });

            return Result.success(tournament);
        } catch {
            return Result.error(ApplicationError.DatabaseServiceUnavailable);
        }
    }

    async update({ tournament }: { tournament: Tournament }): Promise<Result<Tournament>> {
        if (!tournament.id) {
            return Result.error(ApplicationError.InvalidRequest);
        }

        await this.run('BEGIN TRANSACTION');

        try {
            const tournamentData = tournament.toDatabase();

            const updateResult = await this.run(
                `
                    UPDATE tournaments
                    SET
                        name = ?,
                        match_type_id = ?,
                        status = ?
                    WHERE
                        id = ?
                `,
                [tournamentData.name, tournamentData.match_type_id, tournamentData.status, tournament.id]
            );

            if (updateResult.affectedRows <= 0) {
                await this.run('ROLLBACK');
                return Result.error(ApplicationError.UpdateError);
            }

            // Eliminar participantes existentes
            await this.run(
                `
                    DELETE FROM tournament_participants
                    WHERE tournament_id = ?
                `,
                [tournament.id]
            );

            // Insertar participantes actualizados
            for (const participant of tournament.participants) {
                const participantData = participant.toDatabase();
                await this.run(
                    `
                        INSERT INTO tournament_participants (
                            tournament_id,
                            user_id,
                            status,
                            score
                        ) VALUES (?, ?, ?, ?)
                    `,
                    [
                        participantData.tournament_id,
                        participantData.user_id,
                        participantData.status,
                        participantData.score,
                    ]
                );
            }

            await this.run('COMMIT');
            return Result.success(tournament);
        } catch {
            await this.run('ROLLBACK');
            return Result.error(ApplicationError.UpdateError);
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
