import { ErrorResult, Result } from '@shared/abstractions/Result';
import { IQuery } from '@shared/application/abstractions/IQuery.interface';
import { IUserRepository } from '../repositories/User.IRepository';
import { FastifyInstance } from 'fastify';
import { handleError } from '@shared/utils/error.utils';
import { User } from '@shared/domain/entity/User.entity';
import { badRequestError } from '@shared/Errors';

const userNotFoundError: ErrorResult = {
    code: 'userNotFoundError',
    message: 'User not found',
};

const invalidRequestError: ErrorResult = {
    code: 'invalidRequestError',
    message: 'Valid user ID is required',
};

export interface IGetCurrentUserRequest {
    userId: number;
}

export interface IGetCurrentUserResponse {
    user: User;
}

export default class GetCurrentUserQuery implements IQuery<IGetCurrentUserRequest, IGetCurrentUserResponse> {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly fastify: FastifyInstance
    ) {}

    validate(request?: IGetCurrentUserRequest): Result<void> {
        if (!request) return Result.error(badRequestError);

        if (!request.userId || typeof request.userId !== 'number') return Result.error(invalidRequestError);

        return Result.success(undefined);
    }

    async execute(request?: IGetCurrentUserRequest): Promise<Result<IGetCurrentUserResponse>> {
        if (!request) return Result.error(badRequestError);

        try {
            const userResult = await this.userRepository.getUserById(request.userId);
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
            return handleError<IGetCurrentUserResponse>(error, 'Failed to get user', this.fastify.log, '500');
        }
    }
}
