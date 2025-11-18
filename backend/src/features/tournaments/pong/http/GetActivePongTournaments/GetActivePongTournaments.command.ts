import { Result } from '@shared/abstractions/Result';
import { ICommand } from '@shared/application/abstractions/ICommand.interface';
import { ApplicationError } from '@shared/Errors';
import { FastifyInstance } from 'fastify';
import { Tournament } from '@shared/domain/Entities/Tournament.entity';

export interface TournamentBasicResponse {
    id: number;
    name: string;
    matchTypeId: number;
    status: string;
    createdAt: string;
    participantCount: number;
}

export interface IGetActivePongTournamentsRequest {
    limit?: number;
    offset?: number;
}

export interface IGetActivePongTournamentsResponse {
    tournaments: TournamentBasicResponse[];
    total: number;
}

export class GetActivePongTournamentsCommand
    implements ICommand<IGetActivePongTournamentsRequest, IGetActivePongTournamentsResponse>
{
    constructor(private readonly fastify: FastifyInstance) {}

    validate(request?: IGetActivePongTournamentsRequest | undefined): Result<void> {
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

    private tournamentToBasicResponse(tournament: Tournament): TournamentBasicResponse {
        if (!tournament.id) {
            throw new Error('Tournament ID is required');
        }

        return {
            id: tournament.id,
            name: tournament.name,
            matchTypeId: tournament.matchTypeId,
            status: tournament.status,
            createdAt: tournament.createdAt.toISOString(),
            participantCount: tournament.participantCount,
        };
    }

    async execute(
        request?: IGetActivePongTournamentsRequest | undefined
    ): Promise<Result<IGetActivePongTournamentsResponse>> {
        try {
            const params = {
                limit: request?.limit || 10,
                offset: request?.offset || 0,
            };

            // Obtener torneos activos usando el PongTournamentManager (versión básica)
            const activeTournamentsResult =
                await this.fastify.PongTournamentManager.getActiveTournamentsBasic(params);

            if (!activeTournamentsResult.isSuccess) {
                return Result.error(
                    activeTournamentsResult.error || ApplicationError.DatabaseServiceUnavailable
                );
            }

            const tournaments = activeTournamentsResult.value || [];
            const tournamentResponses = tournaments.map((tournament) =>
                this.tournamentToBasicResponse(tournament)
            );

            return Result.success({
                tournaments: tournamentResponses,
                total: tournamentResponses.length,
            });
        } catch (error: unknown) {
            return this.fastify.handleError<IGetActivePongTournamentsResponse>({
                code: ApplicationError.InternalServerError,
                error,
            });
        }
    }
}
