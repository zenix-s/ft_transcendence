import { Result } from '@shared/abstractions/Result';
import { IQuery } from '@shared/application/abstractions/IQuery.interface';
import { IUserRepository } from '../repositories/User.IRepository';
import { IUserPublic } from '@shared/types';
import { AUTH_ERRORS } from '../../types/auth.types';
import { FastifyInstance } from 'fastify';
import { handleError } from '@shared/utils/error.utils';

export interface IGetCurrentUserRequest {
    userId: number;
}

export interface IGetCurrentUserResponse {
    user: IUserPublic;
}

export default class GetCurrentUserQuery
    implements IQuery<IGetCurrentUserRequest, IGetCurrentUserResponse>
{
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly fastify: FastifyInstance
    ) {}

    validate(request?: IGetCurrentUserRequest): Result<void> {
        if (!request) {
            return Result.failure('400', 'Request is required');
        }

        if (!request.userId || typeof request.userId !== 'number') {
            return Result.failure('400', 'Valid user ID is required');
        }

        return Result.success(undefined);
    }

    async execute(
        request?: IGetCurrentUserRequest
    ): Promise<Result<IGetCurrentUserResponse>> {
        if (!request) {
            return Result.failure('400', 'Request is required');
        }

        try {
            const user = await this.userRepository.getUserById(request.userId);

            if (!user) {
                return Result.failure(
                    AUTH_ERRORS.USER_NOT_FOUND.code,
                    AUTH_ERRORS.USER_NOT_FOUND.message
                );
            }

            // Return user without password
            return Result.success({
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                },
            });
        } catch (error) {
            return handleError<IGetCurrentUserResponse>(
                error,
                'Failed to get user',
                this.fastify.log
            );
        }
    }
}
