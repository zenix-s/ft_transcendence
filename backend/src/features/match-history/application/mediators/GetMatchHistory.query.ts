import { FastifyInstance } from 'fastify';
import { Result } from '@shared/abstractions/Result';
import { IQuery } from '@shared/application/abstractions/IQuery.interface';
import { handleError } from '@shared/utils/error.utils';
import { MatchRepository } from '@shared/infrastructure/repositories';

import { Match } from '@shared/domain/entity/Match.entity';

export interface IGetMatchHistoryRequest {
    userId?: number;
    limit?: number;
    offset?: number;
}

export interface IGetMatchHistoryResponse {
    matches: Match[];
    total: number;
}

export default class GetMatchHistoryQuery
    implements IQuery<IGetMatchHistoryRequest, IGetMatchHistoryResponse>
{
    private readonly matchRepository: MatchRepository;

    constructor(private readonly fastify: FastifyInstance) {
        const dbConnection = this.fastify.dbConnection;
        this.matchRepository = new MatchRepository(dbConnection);
    }

    validate(request?: IGetMatchHistoryRequest): Result<void> {
        if (!request) {
            return Result.success(undefined);
        }

        if (request.limit && (request.limit < 1 || request.limit > 100)) {
            return Result.error('invalidLimit');
        }

        if (request.offset && request.offset < 0) {
            return Result.error('invalidOffset');
        }

        return Result.success(undefined);
    }

    async execute(request?: IGetMatchHistoryRequest): Promise<Result<IGetMatchHistoryResponse>> {
        try {
            const limit = request?.limit || 20;
            const offset = request?.offset || 0;

            let matches: Match[];
            let total: number;

            if (request?.userId) {
                matches = await this.matchRepository.findUserMatches(request.userId);
                total = matches.length;

                matches = matches.slice(offset, offset + limit);
            } else {
                matches = await this.matchRepository.findAll(limit, offset);
                total = await this.matchRepository.getMatchCount();
            }

            return Result.success({
                matches,
                total,
            });
        } catch (error) {
            return handleError<IGetMatchHistoryResponse>(
                error,
                'Failed to get match history',
                this.fastify.log,
                '500'
            );
        }
    }
}
