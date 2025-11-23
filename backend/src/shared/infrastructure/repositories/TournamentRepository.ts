import { Tournament, TournamentStatus } from '@shared/domain/Entities/Tournament.entity';
import { TournamentParticipant } from '@shared/domain/Entities/TournamentParticipant.entity';
import { TournamentRound, ITournamentMatchup } from '@shared/domain/Entities/TournamentRound.entity';
import { AbstractRepository } from '../db/AbstractRepository';
import fp from 'fastify-plugin';
import { Result } from '@shared/abstractions/Result';
import { ApplicationError } from '@shared/Errors';
import { TournamentDbModel } from '@shared/infrastructure/db/models/Tournament.dbmodel';
import { TournamentParticipantDbModel } from '@shared/infrastructure/db/models/TournamentParticipant.dbmodel';

// Añadido para manejar maxMatchesPerPair
const DEFAULT_MAX_MATCHES_PER_PAIR = 3;

export interface ITournamentRepository {
    createTournament({ tournament }: { tournament: Tournament }): Promise<Result<number>>;
    findTournaments(params: {
        limit?: number;
        offset?: number;
        status?: TournamentStatus[];
    }): Promise<Result<Tournament[]>>;
    findTournamentsBasic(params: {
        limit?: number;
        offset?: number;
        status?: TournamentStatus[];
    }): Promise<Result<Tournament[]>>;
    findById({ id }: { id: number }): Promise<Result<Tournament | null>>;
    update({ tournament }: { tournament: Tournament }): Promise<Result<Tournament>>;
    isUserAdminOfActiveTournament({ userId }: { userId: number }): Promise<Result<boolean>>;
}

class TournamentRepository extends AbstractRepository implements ITournamentRepository {
    /**
     * Mapea un modelo de base de datos a una entidad Tournament
     * @param dbModel - Modelo de base de datos del torneo
     * @param participants - Lista opcional de participantes
     * @param participantCountOverride - Conteo opcional de participantes
     * @returns Tournament entity
     */
    private mapFromDatabase(
        dbModel: TournamentDbModel,
        participants: TournamentParticipant[] = [],
        participantCountOverride?: number
    ): Tournament {
        const tournament = Tournament.fromDatabase({
            id: dbModel.id,
            name: dbModel.name,
            match_type_id: dbModel.match_type_id,
            status: dbModel.status,
            created_at: dbModel.created_at,
            match_settings: dbModel.match_settings,
            participants,
            participantCountOverride,
            // Nuevo: maxMatchesPerPair desde dbModel, fallback a default si no existe
            max_matches_per_pair:
                typeof dbModel.max_matches_per_pair === 'number'
                    ? dbModel.max_matches_per_pair
                    : DEFAULT_MAX_MATCHES_PER_PAIR,
        });

        // Restaurar rondas desde JSON
        if (dbModel.rounds_data) {
            try {
                const roundsData = JSON.parse(dbModel.rounds_data);
                if (Array.isArray(roundsData)) {
                    roundsData.forEach((roundData: { roundNumber: number; matchups: unknown[] }) => {
                        const round = new TournamentRound({
                            roundNumber: roundData.roundNumber,
                            matchups: roundData.matchups as ITournamentMatchup[],
                        });
                        tournament.addRound(round);
                    });
                }
            } catch {
                // Error silencioso - el torneo continuará sin rondas previas
            }
        }

        // Restaurar número de ronda actual
        if (typeof dbModel.current_round_number === 'number') {
            tournament.setCurrentRoundNumber(dbModel.current_round_number);
        }

        return tournament;
    }
    async createTournament({ tournament }: { tournament: Tournament }): Promise<Result<number>> {
        await this.run('BEGIN TRANSACTION');

        try {
            const createResult = await this.run(
                `
                    INSERT INTO tournaments (
                        name,
                        match_type_id,
                        status,
                        match_settings,
                        created_at,
                        max_matches_per_pair,
                        rounds_data,
                        current_round_number
                    ) VALUES
                    (?, ?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    tournament.name,
                    tournament.matchTypeId,
                    tournament.status,
                    tournament.matchSettings.toJSON(),
                    tournament.createdAt.toISOString(),
                    typeof tournament.maxMatchesPerPair === 'number'
                        ? tournament.maxMatchesPerPair
                        : DEFAULT_MAX_MATCHES_PER_PAIR,
                    JSON.stringify(tournament.rounds.map((r) => r.toJSON())),
                    tournament.currentRoundNumber,
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
                // Buscar participantes del torneo con username
                const participants = await this.findMany<TournamentParticipantDbModel & { username: string }>(
                    `
                        SELECT
                            tp.id,
                            tp.tournament_id,
                            tp.user_id,
                            tp.status,
                            tp.role,
                            tp.score,
                            u.username
                        FROM
                            tournament_participants tp
                        JOIN
                            users u ON tp.user_id = u.id
                        WHERE
                            tp.tournament_id = ?
                    `,
                    [row.id]
                );

                const tournamentParticipants = participants.map((p) =>
                    TournamentParticipant.fromDatabase({
                        id: p.id,
                        tournament_id: p.tournament_id,
                        user_id: p.user_id,
                        status: p.status,
                        role: p.role,
                        score: p.score,
                        username: p.username,
                    })
                );

                tournaments.push(this.mapFromDatabase(row, tournamentParticipants));
            }

            return Result.success(tournaments);
        } catch {
            return Result.error(ApplicationError.DatabaseServiceUnavailable);
        }
    }

    async findTournamentsBasic({
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
                statusCondition = `WHERE t.status IN (${statusPlaceholders})`;
                params = [...status];
            }

            params.push(limit, offset);

            // Query optimizada que solo cuenta participantes sin cargarlos
            const result = await this.findMany<TournamentDbModel & { participant_count: number }>(
                `
                    SELECT
                        t.*,
                        COALESCE(COUNT(tp.id), 0) as participant_count
                    FROM
                        tournaments t
                    LEFT JOIN
                        tournament_participants tp ON t.id = tp.tournament_id
                    ${statusCondition}
                    GROUP BY
                        t.id
                    ORDER BY
                        t.created_at DESC
                    LIMIT ? OFFSET ?
                `,
                params
            );

            const tournaments: Tournament[] = result.map((row) => {
                return this.mapFromDatabase(row, [], row.participant_count);
            });

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

            // Buscar participantes del torneo con username
            const participants = await this.findMany<TournamentParticipantDbModel & { username: string }>(
                `
                    SELECT
                        tp.id,
                        tp.tournament_id,
                        tp.user_id,
                        tp.status,
                        tp.role,
                        tp.score,
                        u.username
                    FROM
                        tournament_participants tp
                    JOIN
                        users u ON tp.user_id = u.id
                    WHERE
                        tp.tournament_id = ?
                `,
                [id]
            );

            const tournamentParticipants = participants.map((p) =>
                TournamentParticipant.fromDatabase({
                    id: p.id,
                    tournament_id: p.tournament_id,
                    user_id: p.user_id,
                    status: p.status,
                    role: p.role,
                    score: p.score,
                    username: p.username,
                })
            );

            const tournament = this.mapFromDatabase(result, tournamentParticipants);

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
                        status = ?,
                        match_settings = ?,
                        rounds_data = ?,
                        current_round_number = ?
                    WHERE
                        id = ?
                `,
                [
                    tournamentData.name,
                    tournamentData.match_type_id,
                    tournamentData.status,
                    tournamentData.match_settings,
                    JSON.stringify(tournament.rounds.map((r) => r.toJSON())),
                    tournament.currentRoundNumber,
                    tournament.id,
                ]
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
                            role,
                            score
                        ) VALUES (?, ?, ?, ?, ?)
                    `,
                    [
                        participantData.tournament_id,
                        participantData.user_id,
                        participantData.status,
                        participantData.role,
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

    async isUserAdminOfActiveTournament({ userId }: { userId: number }): Promise<Result<boolean>> {
        try {
            const result = await this.findOne<{ count: number }>(
                `
                    SELECT COUNT(*) as count
                    FROM tournaments t
                    INNER JOIN tournament_participants tp ON t.id = tp.tournament_id
                    WHERE tp.user_id = ?
                    AND tp.role IN ('${TournamentParticipant.ROLE.ADMIN}', '${TournamentParticipant.ROLE.ADMIN_PARTICIPANT}')
                    AND t.status IN ('${Tournament.STATUS.UPCOMING}', '${Tournament.STATUS.ONGOING}')
                `,
                [userId]
            );

            const isAdmin = (result?.count || 0) > 0;
            return Result.success(isAdmin);
        } catch {
            return Result.error(ApplicationError.DatabaseServiceUnavailable);
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
