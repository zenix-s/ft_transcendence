import { Result } from '@shared/abstractions/Result';
import { IQuery } from '@shared/application/abstractions/IQuery.interface';
import { FastifyInstance } from 'fastify';
import { User } from '@shared/domain/Entities/User.entity';
import { ApplicationError } from '@shared/Errors';

export interface IGetCurrentUserRequest {
    userId: number;
}

export interface IGetCurrentUserResponse {
    user: User;
}

export default class GetCurrentUserQuery implements IQuery<IGetCurrentUserRequest, IGetCurrentUserResponse> {
    constructor(private readonly fastify: FastifyInstance) {}

    validate(request?: IGetCurrentUserRequest): Result<void> {
        if (!request) return Result.error(ApplicationError.BadRequest);

        if (!request.userId || typeof request.userId !== 'number')
            return Result.error(ApplicationError.InvalidRequest);

        return Result.success(undefined);
    }

    async execute(request?: IGetCurrentUserRequest): Promise<Result<IGetCurrentUserResponse>> {
        if (!request) return Result.error(ApplicationError.BadRequest);

        try {
            const userResult = await this.fastify.UserRepository.getUser({ id: request.userId });
            if (!userResult.isSuccess || !userResult.value)
                return Result.error(ApplicationError.UserNotFound);

            const user = userResult.value;

            return Result.success({
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    avatar: user.avatar,
                },
            });
        } catch (error) {
            return this.fastify.handleError({
                code: ApplicationError.InternalServerError,
                error,
            });
        }
    }
}
