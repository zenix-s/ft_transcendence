import { Result } from '@shared/abstractions/Result';
import { ICommand } from '@shared/application/abstractions/ICommand.interface';
import { ApplicationError } from '@shared/Errors';
import { FastifyInstance } from 'fastify';
import { TournamentParticipant } from '@shared/domain/Entities/TournamentParticipant.entity';
import { PongTournamentAggregate } from '../../services/IPongTournamentManager';

export interface TournamentParticipantResponse {
    userId: number;
    username: string;
    status: string;
    role: string;
    score: number;
    isCurrentPlayer: boolean;
    remainingMatches: number;
}

export interface TournamentDetailResponse {
    id: number;
    name: string;
    matchTypeId: number;
    status: string;
    createdAt: string;
    isRegistered: boolean;
    participants: TournamentParticipantResponse[];
    participantCount: number;
    maxMatchesPerPair: number;
    matchSettings: {
        maxScore: number;
        maxGameTime: number;
        visualStyle: string;
    };
}

export interface IGetPongTournamentDetailRequest {
    id: number;
    userId: number;
}

export interface IGetPongTournamentDetailResponse {
    tournament: TournamentDetailResponse | null;
}

export class GetPongTournamentDetailCommand
    implements ICommand<IGetPongTournamentDetailRequest, IGetPongTournamentDetailResponse>
{
    constructor(private readonly fastify: FastifyInstance) {}

    validate(request?: IGetPongTournamentDetailRequest | undefined): Result<void> {
        if (!request) return Result.error(ApplicationError.InvalidRequest);

        // Validar que el ID esté presente y sea un número válido
        if (!request.id || typeof request.id !== 'number' || request.id <= 0) {
            return Result.error(ApplicationError.InvalidRequest);
        }

        return Result.success(undefined);
    }

    private participantToResponse(
        participant: TournamentParticipant,
        currentUserId: number,
        remainingMatches: number
    ): TournamentParticipantResponse {
        return {
            userId: participant.userId,
            username: participant.username || '',
            status: participant.status,
            role: participant.role,
            score: participant.score,
            isCurrentPlayer: participant.userId === currentUserId,
            remainingMatches,
        };
    }

    private async tournamentToDetailResponse(
        aggregate: PongTournamentAggregate,
        currentUserId: number
    ): Promise<TournamentDetailResponse> {
        if (!aggregate.tournament.id) {
            throw new Error('Tournament ID is required');
        }

        // Obtener el torneo activo para calcular partidas restantes
        const activeTournament = this.fastify.PongTournamentManager.getActiveTournament(
            aggregate.tournament.id
        );
        const maxMatchesPerPair = aggregate.tournament.maxMatchesPerPair;

        const participantsWithRemainingMatches = aggregate.tournament.participants.map((participant) => {
            let remainingMatches = maxMatchesPerPair;

            // Si hay torneo activo y el participante no es el usuario actual, calcular partidas restantes
            if (activeTournament && participant.userId !== currentUserId) {
                const matchesPlayed = activeTournament.getMatchCountBetween(
                    currentUserId,
                    participant.userId
                );
                remainingMatches = Math.max(0, maxMatchesPerPair - matchesPlayed);
            } else if (participant.userId === currentUserId) {
                // Para el usuario actual, no puede jugar contra sí mismo
                remainingMatches = 0;
            }

            return this.participantToResponse(participant, currentUserId, remainingMatches);
        });

        return {
            id: aggregate.tournament.id,
            name: aggregate.tournament.name,
            matchTypeId: aggregate.tournament.matchTypeId,
            status: aggregate.tournament.status,
            createdAt: aggregate.tournament.createdAt.toISOString(),
            isRegistered: aggregate.isRegistered,
            participants: participantsWithRemainingMatches,
            participantCount: aggregate.tournament.participantCount,
            maxMatchesPerPair,
            matchSettings: aggregate.tournament.matchSettings.toObject(),
        };
    }

    async execute(
        request?: IGetPongTournamentDetailRequest | undefined
    ): Promise<Result<IGetPongTournamentDetailResponse>> {
        try {
            // Paso 1: Validar que la solicitud
            if (!request) return Result.error(ApplicationError.BadRequest);

            // Paso 2: Obtener tournament por ID usando el PongTournamentManager
            const tournamentResult = await this.fastify.PongTournamentManager.getTournamentById({
                id: request.id,
                userId: request.userId,
            });

            // Paso 3: Manejar el resultado de la consulta
            if (!tournamentResult.isSuccess) {
                return Result.error(tournamentResult.error || ApplicationError.TournamentNotFound);
            }

            // Paso 4: Transformar entidad de dominio a interfaz de respuesta
            const tournament = tournamentResult.value;
            const tournamentResponse = tournament
                ? await this.tournamentToDetailResponse(tournament, request.userId)
                : null;

            return Result.success({
                tournament: tournamentResponse,
            });
        } catch (error: unknown) {
            return this.fastify.handleError<IGetPongTournamentDetailResponse>({
                code: ApplicationError.InternalServerError,
                error,
            });
        }
    }
}
