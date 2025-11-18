import { Result } from '@shared/abstractions/Result';
import { Tournament } from '@shared/domain/Entities/Tournament.entity';
import { TournamentParticipant } from '@shared/domain/Entities/TournamentParticipant.entity';
import MatchType from '@shared/domain/ValueObjects/MatchType.value';
import { ApplicationError } from '@shared/Errors';
import { FastifyInstance } from 'fastify';

export class ActivePongTournament {
    private tournamentId: number | null;

    constructor(private readonly fastify: FastifyInstance) {
        this.tournamentId = null;
    }

    async initialize({
        name,
        creatorUserId,
    }: {
        name: string;
        creatorUserId: number;
    }): Promise<Result<number>> {
        // Paso 1: Crear la entidad de torneo
        const tournamentEntity = Tournament.create({
            name: name,
            matchTypeId: MatchType.TOURNAMENT_PONG.id,
            createdAt: new Date(),
        });

        // Paso 2: Crear el torneo en la base de datos
        const createResult = await this.fastify.TournamentRepository.createTournament({
            tournament: tournamentEntity,
        });

        if (!createResult.isSuccess || !createResult.value) {
            return Result.failure(createResult.error || ApplicationError.InsertionError);
        }

        this.tournamentId = createResult.value;

        // Paso 3: Crear participante admin para el creador del torneo
        const creatorParticipant = TournamentParticipant.create({
            tournamentId: this.tournamentId,
            userId: creatorUserId,
            role: TournamentParticipant.ROLE.ADMIN,
        });

        // Paso 4: Añadir creador como admin al torneo
        const addSuccess = tournamentEntity.addParticipant(creatorParticipant);
        if (!addSuccess) {
            return Result.error(ApplicationError.ParticipantAdditionError);
        }

        // Paso 5: Establecer el ID del torneo en la entidad
        tournamentEntity.setId(this.tournamentId);

        // Paso 6: Actualizar el torneo en la base de datos con el admin
        const updateResult = await this.fastify.TournamentRepository.update({
            tournament: tournamentEntity,
        });

        if (!updateResult.isSuccess) {
            return Result.error(updateResult.error || ApplicationError.UpdateError);
        }

        return Result.success(this.tournamentId);
    }

    async addParticipant({ userId }: { userId: number }): Promise<Result<void>> {
        try {
            // Paso 1: Validar que el torneo esté inicializado
            if (this.tournamentId === null) {
                return Result.error(ApplicationError.TournamentNotInitialized);
            }

            // Paso 2: Recuperar la instancia completa del torneo desde la base de datos
            const tournamentResult = await this.fastify.TournamentRepository.findById({
                id: this.tournamentId,
            });

            if (!tournamentResult.isSuccess || !tournamentResult.value) {
                return Result.error(tournamentResult.error || ApplicationError.TournamentNotFound);
            }

            const tournament = tournamentResult.value;

            // Paso 3: Verificar si el usuario ya es participante
            const existingParticipant = tournament.getParticipant(userId);
            if (existingParticipant) {
                // Si es admin, cambiar a admin-participant
                if (existingParticipant.role === TournamentParticipant.ROLE.ADMIN) {
                    // Remover entrada de admin actual
                    tournament.removeParticipant(userId);

                    // Añadir como admin-participant
                    const adminParticipant = TournamentParticipant.create({
                        tournamentId: this.tournamentId,
                        userId: userId,
                        role: TournamentParticipant.ROLE.ADMIN_PARTICIPANT,
                    });

                    const addSuccess = tournament.addParticipant(adminParticipant);
                    if (!addSuccess) {
                        return Result.error(ApplicationError.ParticipantAdditionError);
                    }

                    // Actualizar torneo en base de datos
                    const updateResult = await this.fastify.TournamentRepository.update({
                        tournament: tournament,
                    });

                    if (!updateResult.isSuccess) {
                        return Result.error(updateResult.error || ApplicationError.UpdateError);
                    }

                    return Result.success(undefined);
                } else {
                    return Result.error(ApplicationError.ParticipantAlreadyExists);
                }
            }

            // Paso 4: Crear nuevo participante con rol normal
            const participant = TournamentParticipant.create({
                tournamentId: this.tournamentId,
                userId: userId,
                role: TournamentParticipant.ROLE.PARTICIPANT,
            });

            // Paso 5: Añadir participante a la entidad de dominio
            const addSuccess = tournament.addParticipant(participant);
            if (!addSuccess) {
                return Result.error(ApplicationError.ParticipantAlreadyExists);
            }

            // Paso 6: Persistir cambios en la base de datos
            const updateResult = await this.fastify.TournamentRepository.update({
                tournament: tournament,
            });

            if (!updateResult.isSuccess) {
                return Result.error(updateResult.error || ApplicationError.UpdateError);
            }

            return Result.success(undefined);
        } catch (error) {
            return this.fastify.handleError({
                code: ApplicationError.ParticipantAdditionError,
                error,
            });
        }
    }

    getTournamentId(): number | null {
        return this.tournamentId;
    }
}
