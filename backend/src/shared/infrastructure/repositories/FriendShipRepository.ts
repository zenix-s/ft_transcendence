import { AbstractRepository } from '../db/AbstractRepository';
import { FastifyInstance } from 'fastify/types/instance';
import fp from 'fastify-plugin';
import { Result } from '@shared/abstractions/Result';
import { ApplicationError } from '@shared/Errors';
import { User } from '@shared/domain/Entities/User.entity';

export interface IFriendShipRepository {
    areFriends({ userId1, userId2 }: { userId1: number; userId2: number }): Promise<Result<boolean>>;
    addFriend({ userId1, userId2 }: { userId1: number; userId2: number }): Promise<Result<void>>;
    removeFriend({ userId1, userId2 }: { userId1: number; userId2: number }): Promise<Result<void>>;
    getFriends({ userId }: { userId: number }): Promise<Result<User[]>>;
    getFriendsOf({ userId }: { userId: number }): Promise<Result<User[]>>;
}

class FriendShipRepository extends AbstractRepository implements IFriendShipRepository {
    async areFriends({ userId1, userId2 }: { userId1: number; userId2: number }): Promise<Result<boolean>> {
        const row = await this.findOne<{ id: number }>(
            `
                SELECT
                    f.id
                FROM
                    friendships f
                WHERE
                    f.user_id = ? AND f.friend_id = ?
            `,
            [userId1, userId2]
        );
        if (!row) return Result.success(false);
        return Result.success(true);
    }

    async addFriend({ userId1, userId2 }: { userId1: number; userId2: number }): Promise<Result<void>> {
        const insertResult = await this.run(
            `
                INSERT INTO friendships (user_id, friend_id)
                VALUES (?, ?)
            `,
            [userId1, userId2]
        );

        if (insertResult.affectedRows === 0) {
            return Result.error(ApplicationError.FriendshipCreationError);
        }

        return Result.success(undefined);
    }

    async removeFriend({ userId1, userId2 }: { userId1: number; userId2: number }): Promise<Result<void>> {
        const deleteResult = await this.run(
            `
                DELETE FROM friendships
                WHERE user_id = ? AND friend_id = ?
            `,
            [userId1, userId2]
        );

        if (deleteResult.affectedRows === 0) {
            return Result.error(ApplicationError.DeletionError);
        }

        return Result.success(undefined);
    }

    async getFriends({ userId }: { userId: number }): Promise<Result<User[]>> {
        const rows = await this.findMany<{
            id: number;
            username: string;
            email: string;
            avatar?: string;
            is_connected: boolean;
        }>(
            `
                    SELECT
                        u.id,
                        u.username,
                        u.email,
                        u.avatar,
                        u.is_connected
                    FROM
                        friendships f
                        INNER JOIN users u ON f.friend_id = u.id
                    WHERE
                        f.user_id = ?
                `,
            [userId]
        );

        if (!rows) {
            return Result.error(ApplicationError.NotFoundError);
        }

        return Result.success(rows);
    }

    async getFriendsOf({ userId }: { userId: number }): Promise<Result<User[]>> {
        const rows = await this.findMany<{
            id: number;
            username: string;
            email: string;
            avatar?: string;
            is_connected: boolean;
        }>(
            `
                    SELECT
                        u.id,
                        u.username,
                        u.email,
                        u.avatar,
                        u.is_connected
                    FROM
                        friendships f
                        INNER JOIN users u ON f.user_id = u.id
                    WHERE
                        f.friend_id = ?
                `,
            [userId]
        );

        if (!rows) {
            return Result.error(ApplicationError.NotFoundError);
        }

        return Result.success(rows);
    }
}

export default fp(
    (fastify: FastifyInstance) => {
        const repo = new FriendShipRepository(fastify.DbConnection);
        fastify.decorate('FriendShipRepository', repo);
    },
    {
        name: 'FriendShipRepository',
        dependencies: ['DbConnection'],
    }
);
