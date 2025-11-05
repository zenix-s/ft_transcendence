import { FastifyInstance } from 'fastify';
import { Result } from '@shared/abstractions/Result';
import { IQuery } from '@shared/application/abstractions/IQuery.interface';
import { ApplicationError } from '@shared/Errors';

import { Match } from '@shared/domain/entity/Match.entity';
import { IMatchRepository } from '@shared/infrastructure/repositories/MatchRepository';
import { CONSTANTES_APP } from '@shared/constants/ApplicationConstants';

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
    private readonly matchRepository: IMatchRepository;

    constructor(private readonly fastify: FastifyInstance) {
        this.matchRepository = this.fastify.MatchRepository;
    }

    validate(request?: IGetMatchHistoryRequest): Result<void> {
        if (!request) {
            return Result.success(undefined);
        }

        if (request.limit && (request.limit < 1 || request.limit > 100)) {
            return Result.error(ApplicationError.InvalidRequest);
        }

        if (request.offset && request.offset < 0) {
            return Result.error(ApplicationError.InvalidRequest);
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
                matches = await this.matchRepository.findUserMatches({
                    userId: request.userId,
                    status: [CONSTANTES_APP.MATCH.STATUS.COMPLETED],
                });
                total = matches.length;

                matches = matches.slice(offset, offset + limit);
            } else {
                matches = await this.matchRepository.findAll({ limit, offset });
                total = await this.matchRepository.getMatchCount({});
            }

            return Result.success({
                matches,
                total,
            });
        } catch (error) {
            return this.fastify.handleError<IGetMatchHistoryResponse>({
                code: ApplicationError.InternalServerError,
                error,
            });
        }
    }
}
