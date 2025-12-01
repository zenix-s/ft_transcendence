import { Result } from '@shared/abstractions/Result';
import { IPongTournamentManager, PongTournamentAggregate } from './IPongTournamentManager';
import { FastifyInstance } from 'fastify';
import { ActivePongTournament } from './ActivePongTournament';
import { ApplicationError } from '@shared/Errors';
import { Tournament } from '@shared/domain/Entities/Tournament.entity';
import { IMatchSettings } from '@shared/domain/ValueObjects/MatchSettings.value';

export class PongTournamentManager implements IPongTournamentManager {
    public tournaments = new Map<number, ActivePongTournament>();

    constructor(private readonly fastify: FastifyInstance) {}

    async getActiveTournamentsWithIsRegisteredFlag({
        userId,
        limit,
        offset,
        onlyRegistered,
    }: {
        userId: number;
        limit?: number;
        offset?: number;
        onlyRegistered?: boolean;
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

            // Paso 2: Verificar si el usuario está registrado en cada torneo y obtener su rol
            const tournamentsWithRegistrationFlag: PongTournamentAggregate[] = [];

            for (const tournament of activeTournaments) {
                const isRegistered = tournament.isUserRegistered(userId);

                // Si onlyRegistered es true y el usuario no está registrado, saltar este torneo
                if (onlyRegistered && !isRegistered) {
                    continue;
                }

                // Obtener el rol del usuario si está registrado
                let userRole: string | undefined;
                if (isRegistered) {
                    const participant = tournament.getParticipant(userId);
                    userRole = participant?.role;
                }

                tournamentsWithRegistrationFlag.push({
                    tournament,
                    isRegistered: isRegistered,
                    userRole: userRole,
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

    async removeParticipant({
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

            // Paso 2: Remover participante del torneo
            const removeParticipantResult = await activeTournament.removeParticipant({ userId });

            // Paso 3: Manejar el resultado de la eliminación
            if (!removeParticipantResult.isSuccess) {
                return Result.error(removeParticipantResult.error || ApplicationError.ParticipantNotFound);
            }

            return Result.success(undefined);
        } catch (error) {
            return this.fastify.handleError({
                code: ApplicationError.ParticipantNotFound,
                error,
            });
        }
    }

    async getActiveTournaments(params: { limit?: number; offset?: number }): Promise<Result<Tournament[]>> {
        try {
            // Paso 1: Buscar torneos activos usando el repository
            const activeTournamentsResult = await this.fastify.TournamentRepository.findTournaments({
                status: [Tournament.STATUS.UPCOMING, Tournament.STATUS.ONGOING, Tournament.STATUS.COMPLETED],
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

            // Paso 3: Obtener el rol del usuario si está registrado
            const isRegistered = tournamentResult.value.isUserRegistered(userId);
            let userRole: string | undefined;
            if (isRegistered) {
                const participant = tournamentResult.value.getParticipant(userId);
                userRole = participant?.role;
            }

            return Result.success({
                tournament: tournamentResult.value,
                isRegistered: isRegistered,
                userRole: userRole,
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

    async startTournament({
        tournamentId,
        userId,
    }: {
        tournamentId: number;
        userId: number;
    }): Promise<Result<void>> {
        try {
            // Paso 1: Obtener el torneo activo
            const activeTournament = this.tournaments.get(tournamentId);
            if (!activeTournament) {
                return Result.error(ApplicationError.TournamentNotFound);
            }

            // Paso 2: Llamar al método start del ActivePongTournament
            const startResult = await activeTournament.startTournament({ userId });

            // Paso 3: Manejar el resultado
            if (!startResult.isSuccess) {
                return Result.error(startResult.error || ApplicationError.TournamentStartError);
            }

            return Result.success(undefined);
        } catch (error) {
            return this.fastify.handleError({
                code: ApplicationError.TournamentStartError,
                error,
            });
        }
    }

    removeTournament(tournamentId: number): void {
        this.tournaments.delete(tournamentId);
    }

    async getCompletedTournamentsWithIsRegisteredFlag({
        userId,
        limit,
        offset,
        onlyRegistered,
    }: {
        userId: number;
        limit?: number;
        offset?: number;
        onlyRegistered?: boolean;
    }): Promise<Result<PongTournamentAggregate[]>> {
        try {
            // Paso 1: Obtener torneos completados usando el repository
            const completedTournamentsResult = await this.fastify.TournamentRepository.findTournaments({
                status: [Tournament.STATUS.COMPLETED, Tournament.STATUS.CANCELLED],
                limit,
                offset,
            });

            if (!completedTournamentsResult.isSuccess) {
                return Result.error(
                    completedTournamentsResult.error || ApplicationError.DatabaseServiceUnavailable
                );
            }

            const completedTournaments = completedTournamentsResult.value || [];

            // Paso 2: Verificar si el usuario estuvo registrado en cada torneo y obtener su rol
            const tournamentsWithRegistrationFlag: PongTournamentAggregate[] = [];

            for (const tournament of completedTournaments) {
                const isRegistered = tournament.isUserRegistered(userId);

                // Si onlyRegistered es true y el usuario no estuvo registrado, saltar este torneo
                if (onlyRegistered && !isRegistered) {
                    continue;
                }

                // Obtener el rol del usuario si estuvo registrado
                let userRole: string | undefined;
                if (isRegistered) {
                    const participant = tournament.getParticipant(userId);
                    userRole = participant?.role;
                }

                tournamentsWithRegistrationFlag.push({
                    tournament,
                    isRegistered: isRegistered,
                    userRole: userRole,
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

    getActiveTournament(tournamentId: number): ActivePongTournament | null {
        return this.tournaments.get(tournamentId) || null;
    }
}
