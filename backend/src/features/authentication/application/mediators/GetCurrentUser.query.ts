import { ErrorResult, Result } from '@shared/abstractions/Result';
import { IQuery } from '@shared/application/abstractions/IQuery.interface';
import { FastifyInstance } from 'fastify';
import { User } from '@shared/domain/entity/User.entity';
import { badRequestError } from '@shared/Errors';

const userNotFoundError: ErrorResult = 'userNotFoundError';

const invalidRequestError: ErrorResult = 'invalidRequestError';

export interface IGetCurrentUserRequest {
    userId: number;
}

export interface IGetCurrentUserResponse {
    user: User;
}

export default class GetCurrentUserQuery implements IQuery<IGetCurrentUserRequest, IGetCurrentUserResponse> {
    constructor(private readonly fastify: FastifyInstance) {}

    validate(request?: IGetCurrentUserRequest): Result<void> {
        if (!request) return Result.error(badRequestError);

        if (!request.userId || typeof request.userId !== 'number') return Result.error(invalidRequestError);

        return Result.success(undefined);
    }

    async execute(request?: IGetCurrentUserRequest): Promise<Result<IGetCurrentUserResponse>> {
        if (!request) return Result.error(badRequestError);

        try {
            const userResult = await this.fastify.UserRepository.getUserById(request.userId);
            if (!userResult.isSuccess || !userResult.value) return Result.error(userNotFoundError);

            const user = userResult.value;

            return Result.success({
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                },
            });
        } catch (error) {
            return this.fastify.handleError({
                code: '500',
                error,
            });
        }
    }
}
