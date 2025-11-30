import { Result } from '@shared/abstractions/Result';
import { ICommand } from '@shared/application/abstractions/ICommand.interface';
import { ApplicationError } from '@shared/Errors';
import { FastifyInstance } from 'fastify';
import { PongTournamentAggregate } from '../../services/IPongTournamentManager';

export interface TournamentBasicResponse {
    id: number;
    name: string;
    matchTypeId: number;
    status: string;
    createdAt: string;
    participantCount: number;
    isRegistered: boolean;
    userRole?: string;
    matchSettings: {
        maxScore: number;
        maxGameTime: number;
        visualStyle: string;
    };
}

export interface IGetCompletedPongTournamentsRequest {
    limit?: number;
    offset?: number;
    userId: number;
    onlyRegistered?: boolean;
}

export interface IGetCompletedPongTournamentsResponse {
    tournaments: TournamentBasicResponse[];
    total: number;
}

export class GetCompletedPongTournamentsCommand
    implements ICommand<IGetCompletedPongTournamentsRequest, IGetCompletedPongTournamentsResponse>
{
    constructor(private readonly fastify: FastifyInstance) {}

    validate(request?: IGetCompletedPongTournamentsRequest | undefined): Result<void> {
        if (!request) return Result.success(undefined);

        // Validar límite
        if (request.limit !== undefined && (request.limit < 1 || request.limit > 100)) {
            return Result.error(ApplicationError.InvalidRequest);
        }

        // Validar offset
        if (request.offset !== undefined && request.offset < 0) {
            return Result.error(ApplicationError.InvalidRequest);
        }

        return Result.success(undefined);
    }

    private tournamentToBasicResponse(tournament: PongTournamentAggregate): TournamentBasicResponse {
        if (!tournament.tournament.id) {
            throw new Error('Tournament ID is required');
        }

        return {
            id: tournament.tournament.id,
            name: tournament.tournament.name,
            matchTypeId: tournament.tournament.matchTypeId,
            status: tournament.tournament.status,
            createdAt: tournament.tournament.createdAt.toISOString(),
            participantCount: tournament.tournament.participantCount,
            isRegistered: tournament.isRegistered,
            userRole: tournament.userRole,
            matchSettings: tournament.tournament.matchSettings.toObject(),
        };
    }

    async execute(
        request?: IGetCompletedPongTournamentsRequest | undefined
    ): Promise<Result<IGetCompletedPongTournamentsResponse>> {
        try {
            if (!request) {
                return Result.error(ApplicationError.InvalidRequest);
            }

            // Paso 1: Obtener torneos completados usando el PongTournamentManager
            const completedTournamentsResult =
                await this.fastify.PongTournamentManager.getCompletedTournamentsWithIsRegisteredFlag({
                    userId: request.userId,
                    limit: request.limit,
                    offset: request.offset,
                    onlyRegistered: request.onlyRegistered,
                });

            // Paso 2: Manejar el resultado de la consulta
            if (!completedTournamentsResult.isSuccess) {
                return Result.error(
                    completedTournamentsResult.error || ApplicationError.DatabaseServiceUnavailable
                );
            }

            // Paso 3: Transformar entidades de dominio a interfaces de respuesta
            const tournaments = completedTournamentsResult.value || [];
            const tournamentResponses = tournaments.map((tournament) =>
                this.tournamentToBasicResponse(tournament)
            );

            return Result.success({
                tournaments: tournamentResponses,
                total: tournamentResponses.length,
            });
        } catch (error: unknown) {
            return this.fastify.handleError<IGetCompletedPongTournamentsResponse>({
                code: ApplicationError.InternalServerError,
                error,
            });
        }
    }
}
