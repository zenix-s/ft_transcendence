import { FastifyInstance } from 'fastify';
import { Result } from '@shared/abstractions/Result';
import { IQuery } from '@shared/application/abstractions/IQuery.interface';
import { ApplicationError } from '@shared/Errors';
import { IMatchPlayerRepository } from '@shared/infrastructure/repositories/MatchPlayerRepository';

export interface IGetUserStatsRequest {
    userId: number;
}

export interface IGetUserStatsResponse {
    userId: number;
    totalMatches: number;
    wins: number;
    losses: number;
    winRate: number;
    totalScore: number;
}

export default class GetUserStatsQuery implements IQuery<IGetUserStatsRequest, IGetUserStatsResponse> {
    private readonly matchPlayerRepository: IMatchPlayerRepository;

    constructor(private readonly fastify: FastifyInstance) {
        this.matchPlayerRepository = this.fastify.MatchPlayerRepository;
    }

    validate(request?: IGetUserStatsRequest): Result<void> {
        if (!request) {
            return Result.error(ApplicationError.BadRequest);
        }

        if (!request.userId || request.userId <= 0) {
            return Result.error(ApplicationError.InvalidRequest);
        }

        return Result.success(undefined);
    }

    async execute(request?: IGetUserStatsRequest): Promise<Result<IGetUserStatsResponse>> {
        if (!request) return Result.error(ApplicationError.BadRequest);

        try {
            const { userId } = request;
            const stats = await this.matchPlayerRepository.getUserStats({ userId });

            return Result.success({
                userId,
                ...stats,
            });
        } catch (error) {
            return this.fastify.handleError({
                code: ApplicationError.InternalServerError,
                error,
            });
        }
    }
}
