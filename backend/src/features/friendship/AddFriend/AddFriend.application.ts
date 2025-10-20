import { Result } from '@shared/abstractions/Result';
import { ICommand } from '@shared/application/abstractions/ICommand.interface';
import { ApplicationError } from '@shared/Errors';
import { FastifyInstance } from 'fastify/types/instance';

export interface AddFriendCommandRequest {
    userId: number;
    newFriendUsername: string;
}

export class AddFriendCommand implements ICommand<AddFriendCommandRequest, null> {
    private readonly _fastify: FastifyInstance;

    constructor(fastify: FastifyInstance) {
        this._fastify = fastify;
    }

    validate(request?: AddFriendCommandRequest | undefined): Result<void> {
        if (!request) {
            return Result.error(ApplicationError.BadRequest);
        }
        if (typeof request.userId !== 'number' || typeof request.newFriendUsername !== 'string') {
            return Result.error(ApplicationError.BadRequest);
        }
        return Result.success(undefined);
    }

    async execute(request?: AddFriendCommandRequest | undefined): Promise<Result<null>> {
        try {
            if (!request) {
                return Result.error(ApplicationError.BadRequest);
            }

            const { userId, newFriendUsername } = request;

            const friendResult = await this._fastify.UserRepository.getUser({
                username: newFriendUsername,
            });
            if (!friendResult.isSuccess || !friendResult.value || !friendResult.value.id) {
                return Result.error(ApplicationError.UserNotFound);
            }

            const friendId = friendResult.value.id;

            const userExists = await this._fastify.UserRepository.getUser({ id: userId });
            if (!userExists.isSuccess || !userExists.value) {
                return Result.error(ApplicationError.UserNotFound);
            }

            const friendExists = await this._fastify.UserRepository.getUser({ id: friendId });
            if (!friendExists.isSuccess || !friendExists.value) {
                return Result.error(ApplicationError.UserNotFound);
            }

            const alreadyFriends = await this._fastify.FriendShipRepository.areFriends({
                userId1: userId,
                userId2: friendId,
            });
            if (alreadyFriends.isSuccess && alreadyFriends.value) {
                return Result.error(ApplicationError.AlreadyFriendsError);
            }

            const addFriendResult = await this._fastify.FriendShipRepository.addFriend({
                userId1: userId,
                userId2: friendId,
            });
            if (!addFriendResult.isSuccess) {
                return Result.error(ApplicationError.FriendshipCreationError);
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
