import { Result } from '@shared/abstractions/Result';
import { ICommand } from '@shared/application/abstractions/ICommand.interface';
import { ApplicationError } from '@shared/Errors';
import { FastifyInstance } from 'fastify';
import { Tournament } from '@shared/domain/Entities/Tournament.entity';
import { TournamentParticipant } from '@shared/domain/Entities/TournamentParticipant.entity';

export interface TournamentParticipantResponse {
    userId: number;
    username: string;
    status: string;
    role: string;
    score: number;
}

export interface TournamentDetailResponse {
    id: number;
    name: string;
    matchTypeId: number;
    status: string;
    createdAt: string;
    participants: TournamentParticipantResponse[];
    participantCount: number;
    matchSettings: {
        maxScore: number;
        maxGameTime: number;
    };
}

export interface IGetPongTournamentDetailRequest {
    id: number;
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

    private participantToResponse(participant: TournamentParticipant): TournamentParticipantResponse {
        return {
            userId: participant.userId,
            username: participant.username || '',
            status: participant.status,
            role: participant.role,
            score: participant.score,
        };
    }

    private tournamentToDetailResponse(tournament: Tournament): TournamentDetailResponse {
        if (!tournament.id) {
            throw new Error('Tournament ID is required');
        }

        return {
            id: tournament.id,
            name: tournament.name,
            matchTypeId: tournament.matchTypeId,
            status: tournament.status,
            createdAt: tournament.createdAt.toISOString(),
            participants: tournament.participants.map((participant) =>
                this.participantToResponse(participant)
            ),
            participantCount: tournament.participantCount,
            matchSettings: tournament.matchSettings.toObject(),
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
            });

            // Paso 3: Manejar el resultado de la consulta
            if (!tournamentResult.isSuccess) {
                return Result.error(tournamentResult.error || ApplicationError.TournamentNotFound);
            }

            // Paso 4: Transformar entidad de dominio a interfaz de respuesta
            const tournament = tournamentResult.value;
            const tournamentResponse = tournament ? this.tournamentToDetailResponse(tournament) : null;

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
