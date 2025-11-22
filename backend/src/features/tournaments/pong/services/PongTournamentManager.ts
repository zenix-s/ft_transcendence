import { Result } from '@shared/abstractions/Result';
import { IPongTournamentManager, PongTournamentAggregate } from './IPongTournamentManager';
import { FastifyInstance } from 'fastify';
import { ActivePongTournament } from './ActivePongTournament';
import { ApplicationError } from '@shared/Errors';
import { Tournament } from '@shared/domain/Entities/Tournament.entity';
import { IMatchSettings } from '@shared/domain/ValueObjects/MatchSettings.value';

export class PongTournamentManager implements IPongTournamentManager {
    private tournaments = new Map<number, ActivePongTournament>();

    constructor(private readonly fastify: FastifyInstance) {}

    async getActiveTournamentsWithIsRegisteredFlag({
        userId,
        limit,
        offset,
    }: {
        userId: number;
        limit?: number;
        offset?: number;
    }): Promise<Result<PongTournamentAggregate[]>> {
        try {
            // Paso 1: Obtener torneos activos
            const activeTournamentsResult = await this.getActiveTournaments({ limit, offset });

            if (!activeTournamentsResult.isSuccess) {
                return Result.error(
                    activeTournamentsResult.error || ApplicationError.DatabaseServiceUnavailable
                );
            }

            const activeTournaments = activeTournamentsResult.value || [];

            // Paso 2: Verificar si el usuario está registrado en cada torneo
            const tournamentsWithRegistrationFlag: PongTournamentAggregate[] = [];

            for (const tournament of activeTournaments) {
                const isRegistered = tournament.isUserRegistered(userId);

                tournamentsWithRegistrationFlag.push({
                    tournament,
                    isRegistered: isRegistered,
                });
            }

            return Result.success(tournamentsWithRegistrationFlag);
        } catch (error) {
            return this.fastify.handleError({
                code: ApplicationError.DatabaseServiceUnavailable,
                error,
            });
        }
    }

    async createTournamnet({
        name,
        creatorUserId,
        matchSettings,
    }: {
        name: string;
        creatorUserId: number;
        matchSettings?: IMatchSettings;
    }): Promise<Result<number>> {
        try {
            // Paso 1: Verificar si el usuario ya es admin de un torneo activo
            const isAdminResult = await this.fastify.TournamentRepository.isUserAdminOfActiveTournament({
                userId: creatorUserId,
            });

            if (!isAdminResult.isSuccess) {
                return Result.error(isAdminResult.error || ApplicationError.DatabaseServiceUnavailable);
            }

            if (isAdminResult.value) {
                return Result.error(ApplicationError.UserAlreadyAdminOfActiveTournament);
            }

            // Paso 2: Crear nueva instancia de torneo activo
            const activePongTournament = new ActivePongTournament(this.fastify);
            const tournamentInitializeResult = await activePongTournament.initialize({
                name,
                creatorUserId,
                matchSettings,
            });

            // Paso 3: Manejar el resultado de la inicialización
            if (!tournamentInitializeResult.isSuccess || !tournamentInitializeResult.value) {
                return Result.error(
                    tournamentInitializeResult.error || ApplicationError.TournamentCreationError
                );
            }

            // Paso 4: Registrar el torneo en el manager
            this.tournaments.set(tournamentInitializeResult.value, activePongTournament);

            return Result.success(tournamentInitializeResult.value);
        } catch (error) {
            return this.fastify.handleError({
                code: ApplicationError.TournamentCreationError,
                error,
            });
        }
    }

    async addParticipant({
        tournamentId,
        userId,
    }: {
        tournamentId: number;
        userId: number;
    }): Promise<Result<void>> {
        try {
            // Paso 1: Buscar el torneo activo
            const activeTournament = this.tournaments.get(tournamentId);
            if (!activeTournament) {
                return Result.error(ApplicationError.TournamentNotFound);
            }

            // Paso 2: Añadir participante al torneo
            const addParticipantResult = await activeTournament.addParticipant({ userId });

            // Paso 3: Manejar el resultado de la adición
            if (!addParticipantResult.isSuccess) {
                return Result.error(addParticipantResult.error || ApplicationError.ParticipantAdditionError);
            }

            return Result.success(undefined);
        } catch (error) {
            return this.fastify.handleError({
                code: ApplicationError.ParticipantAdditionError,
                error,
            });
        }
    }

    async getActiveTournaments(params: { limit?: number; offset?: number }): Promise<Result<Tournament[]>> {
        try {
            // Paso 1: Buscar torneos activos usando el repository
            const activeTournamentsResult = await this.fastify.TournamentRepository.findTournaments({
                status: [Tournament.STATUS.UPCOMING, Tournament.STATUS.ONGOING],
                limit: params.limit,
                offset: params.offset,
            });

            // Paso 2: Manejar el resultado de la consulta
            if (!activeTournamentsResult.isSuccess) {
                return Result.error(
                    activeTournamentsResult.error || ApplicationError.DatabaseServiceUnavailable
                );
            }

            return Result.success(activeTournamentsResult.value || []);
        } catch (error) {
            return this.fastify.handleError({
                code: ApplicationError.DatabaseServiceUnavailable,
                error,
            });
        }
    }

    async getActiveTournamentsBasic(params: {
        limit?: number;
        offset?: number;
    }): Promise<Result<Tournament[]>> {
        try {
            // Paso 1: Buscar torneos activos usando el repository básico
            const activeTournamentsResult = await this.fastify.TournamentRepository.findTournamentsBasic({
                status: [Tournament.STATUS.UPCOMING, Tournament.STATUS.ONGOING],
                limit: params.limit,
                offset: params.offset,
            });

            // Paso 2: Manejar el resultado de la consulta
            if (!activeTournamentsResult.isSuccess) {
                return Result.error(
                    activeTournamentsResult.error || ApplicationError.DatabaseServiceUnavailable
                );
            }

            return Result.success(activeTournamentsResult.value || []);
        } catch (error) {
            return this.fastify.handleError({
                code: ApplicationError.DatabaseServiceUnavailable,
                error,
            });
        }
    }

    async getTournamentById({
        id,
        userId,
    }: {
        id: number;
        userId: number;
    }): Promise<Result<PongTournamentAggregate>> {
        try {
            // Paso 1: Buscar tournament por ID usando el repository
            const tournamentResult = await this.fastify.TournamentRepository.findById({ id });

            // Paso 2: Manejar el resultado de la consulta
            if (!tournamentResult.isSuccess || !tournamentResult.value) {
                return Result.error(tournamentResult.error || ApplicationError.DatabaseServiceUnavailable);
            }

            return Result.success({
                tournament: tournamentResult.value,
                isRegistered: tournamentResult.value.isUserRegistered(userId),
            });
        } catch (error) {
            return this.fastify.handleError({
                code: ApplicationError.DatabaseServiceUnavailable,
                error,
            });
        }
    }

    async isUserAdminOfActiveTournament({ userId }: { userId: number }): Promise<Result<boolean>> {
        try {
            // Paso 1: Verificar si el usuario es admin de un torneo activo
            const isAdminResult = await this.fastify.TournamentRepository.isUserAdminOfActiveTournament({
                userId,
            });

            // Paso 2: Manejar el resultado de la verificación
            if (!isAdminResult.isSuccess) {
                return Result.error(isAdminResult.error || ApplicationError.DatabaseServiceUnavailable);
            }

            return Result.success(isAdminResult.value || false);
        } catch (error) {
            return this.fastify.handleError({
                code: ApplicationError.DatabaseServiceUnavailable,
                error,
            });
        }
    }
}
