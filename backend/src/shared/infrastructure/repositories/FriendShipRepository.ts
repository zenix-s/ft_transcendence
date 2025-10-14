import { AbstractRepository } from '../db/AbstractRepository';
import { FastifyInstance } from 'fastify/types/instance';
import fp from 'fastify-plugin';
import { Result } from '@shared/abstractions/Result';
import { ApplicationError } from '@shared/Errors';

export interface IFriendShipRepository {
    areFriends(userId1: number, userId2: number): Promise<Result<boolean>>;
    addFriend(userId1: number, userId2: number): Promise<Result<void>>;
    removeFriend(userId1: number, userId2: number): Promise<Result<void>>;
    getFriends(userId: number): Promise<Result<number[]>>;
}

class FriendShipRepository extends AbstractRepository implements IFriendShipRepository {
    async areFriends(userId1: number, userId2: number): Promise<Result<boolean>> {
        const row = await this.findOne<{ id: number }>(
            `
                SELECT
                    id
                FROM
                    friendships
                WHERE
                    user_id = ? AND friend_id = ?
            `,
            [userId1, userId2]
        );
        if (!row) return Result.success(false);
        return Result.success(true);
    }

    async addFriend(userId1: number, userId2: number): Promise<Result<void>> {
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

    async removeFriend(userId1: number, userId2: number): Promise<Result<void>> {
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

    async getFriends(userId: number): Promise<Result<number[]>> {
        const rows = await this.findMany<{ friend_id: number }>(
            `
                    SELECT friend_id
                    FROM friendships
                    WHERE user_id = ?
                `,
            [userId]
        );

        if (!rows) {
            return Result.error(ApplicationError.NotFoundError);
        }

        return Result.success(rows.map((row) => row.friend_id));
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
