import { FastifyInstance } from 'fastify';
import { Result } from '@shared/abstractions/Result';
import { IQuery } from '@shared/application/abstractions/IQuery.interface';
import { handleError } from '@shared/utils/error.utils';
import { MatchPlayerRepository } from '@shared/infrastructure/repositories';

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
    private readonly matchPlayerRepository: MatchPlayerRepository;

    constructor(private readonly fastify: FastifyInstance) {
        const dbConnection = this.fastify.dbConnection;
        this.matchPlayerRepository = new MatchPlayerRepository(dbConnection);
    }

    validate(request?: IGetUserStatsRequest): Result<void> {
        if (!request) {
            return Result.error('invalidRequest');
        }

        if (!request.userId || request.userId <= 0) {
            return Result.error('invalidUserId');
        }

        return Result.success(undefined);
    }

    async execute(request?: IGetUserStatsRequest): Promise<Result<IGetUserStatsResponse>> {
        if (!request) return Result.error('invalidRequest');

        try {
            const { userId } = request;
            const stats = await this.matchPlayerRepository.getUserStats(userId);

            return Result.success({
                userId,
                ...stats,
            });
        } catch (error) {
            return handleError<IGetUserStatsResponse>(error, this.fastify.log, '500');
        }
    }
}
