import { Result } from '@shared/abstractions/Result';
import { ICommand } from '@shared/application/abstractions/ICommand.interface';
import { ApplicationError } from '@shared/Errors';
import { FastifyInstance } from 'fastify/types/instance';

interface RemoveFriendRequest {
    userId: number;
    friendUsername: string;
}

export class RemoveFriendCommand implements ICommand<RemoveFriendRequest, null> {
    private readonly _fastify: FastifyInstance;

    constructor(fastify: FastifyInstance) {
        this._fastify = fastify;
    }

    validate(request?: RemoveFriendRequest | undefined): Result<void> {
        if (!request) {
            return Result.error(ApplicationError.BadRequest);
        }
        if (typeof request.userId !== 'number' || typeof request.friendUsername !== 'string') {
            return Result.error(ApplicationError.BadRequest);
        }
        return Result.success(undefined);
    }

    async execute(request?: RemoveFriendRequest | undefined): Promise<Result<null>> {
        try {
            if (!request) {
                return Result.error(ApplicationError.BadRequest);
            }

            const { userId, friendUsername } = request;

            const friendResult = await this._fastify.UserRepository.getUserByUsername(friendUsername);
            if (!friendResult.isSuccess || !friendResult.value || !friendResult.value.id) {
                return Result.error(ApplicationError.UserNotFound);
            }

            const friendId = friendResult.value.id;

            const userExists = await this._fastify.UserRepository.getUserById(userId);
            if (!userExists.isSuccess || !userExists.value) {
                return Result.error(ApplicationError.UserNotFound);
            }

            const friendExists = await this._fastify.UserRepository.getUserById(friendId);
            if (!friendExists.isSuccess || !friendExists.value) {
                return Result.error(ApplicationError.UserNotFound);
            }

            const areFriends = await this._fastify.FriendShipRepository.areFriends(userId, friendId);
            if (!areFriends.isSuccess || !areFriends.value) {
                return Result.error(ApplicationError.NotFriendsError);
            }

            const removeFriendResult = await this._fastify.FriendShipRepository.removeFriend(userId, friendId);
            if (!removeFriendResult.isSuccess) {
                return Result.error(ApplicationError.DeletionError);
            }

            return Result.success(null);
        } catch (error) {
            return this._fastify.handleError({
                code: ApplicationError.InternalServerError,
                error,
            });
        }
    }
}
