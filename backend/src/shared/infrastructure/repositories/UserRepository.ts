import { Result } from '@shared/abstractions/Result';
import { AbstractRepository } from '@shared/infrastructure/db/AbstractRepository';
import { User } from '@shared/domain/entity/User.entity';
import fp from 'fastify-plugin';
import { AuthenticationUserRow } from '../types/types';
import { ApplicationError } from '@shared/Errors';
import { CONSTANTES_APP } from '@shared/constants/ApplicationConstants';

export interface AuthenticationUserDto extends User {
    password: string;
}

export type CreateUserDto = Omit<AuthenticationUserDto, 'id'>;

export interface IUserRepository {
    createUser({ user }: { user: CreateUserDto }): Promise<Result<User>>;
    getUser({
        id,
        email,
        username,
    }: {
        id?: number;
        email?: string;
        username?: string;
    }): Promise<Result<AuthenticationUserDto>>;
    updateUserAvatar({ userId, avatarUrl }: { userId: number; avatarUrl: string }): Promise<Result<void>>;
    updateUsername({ id, newUsername }: { id: number; newUsername: string }): Promise<Result<User>>;
    updatePassword({ id, newPassword }: { id: number; newPassword: string }): Promise<Result<User>>;
    updateConnectionStatus({
        userId,
        isConnected,
    }: {
        userId: number;
        isConnected: boolean;
    }): Promise<Result<void>>;
}

class UserRepository extends AbstractRepository implements IUserRepository {
    async createUser({ user }: { user: CreateUserDto }): Promise<Result<AuthenticationUserDto>> {
        await this.run('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [
            user.username,
            user.email,
            user.password,
        ]);

        const row = await this.findOne<AuthenticationUserRow>(
            'SELECT id, username, email, password, avatar, is_connected FROM users WHERE email = ?',
            [user.email]
        );

        if (!row) {
            return Result.error(ApplicationError.UserNotFound);
        }

        return Result.success(row);
    }

    async getUser({
        id,
        email,
        username,
    }: {
        id?: number;
        email?: string;
        username?: string;
    }): Promise<Result<AuthenticationUserDto>> {
        // Validar que al menos uno de los parámetros esté presente
        if (!id && !email && !username) {
            return Result.error(ApplicationError.InvalidRequest);
        }

        const conditions: string[] = [];
        const params: (string | number)[] = [];

        if (id !== undefined) {
            conditions.push('id = ?');
            params.push(id);
        }

        if (email !== undefined) {
            conditions.push('LOWER(email) = LOWER(?)');
            params.push(email);
        }

        if (username !== undefined) {
            conditions.push('LOWER(username) = LOWER(?)');
            params.push(username);
        }

        const whereClause = conditions.join(' AND ');
        const query = `
            SELECT
                id,
                username,
                email,
                password,
                avatar,
                is_connected
            FROM
                users
            WHERE
                ${whereClause}
        `;

        const row = await this.findOne<AuthenticationUserRow>(query, params);

        if (!row || row.id === CONSTANTES_APP.AI_PLAYER.ID) {
            return Result.error(ApplicationError.UserNotFound);
        }

        return Result.success(row);
    }

    async updateUserAvatar({
        userId,
        avatarUrl,
    }: {
        userId: number;
        avatarUrl: string;
    }): Promise<Result<void>> {
        try {
            await this.run('UPDATE users SET avatar = ? WHERE id = ?', [avatarUrl, userId]);
            return Result.success(undefined);
        } catch {
            return Result.error(ApplicationError.AvatarUpdateError);
        }
    }

    async updateUsername({ id, newUsername }: { id: number; newUsername: string }): Promise<Result<User>> {
        await this.run('UPDATE users SET username = ? WHERE id = ?', [newUsername, id]);

        const row = await this.findOne<AuthenticationUserRow>(
            'SELECT id, username, email, password, avatar, is_connected FROM users WHERE id = ?',
            [id]
        );
        if (!row) {
            return Result.error(ApplicationError.UserNotFound);
        }

        return Result.success(row);
    }

    async updatePassword({ id, newPassword }: { id: number; newPassword: string }): Promise<Result<User>> {
        await this.run('UPDATE users SET password = ? WHERE id = ?', [newPassword, id]);

        const row = await this.findOne<AuthenticationUserRow>(
            'SELECT id, username, email, password, avatar, is_connected FROM users WHERE id = ?',
            [id]
        );
        if (!row) {
            return Result.error(ApplicationError.UserNotFound);
        }

        return Result.success(row);
    }

    async updateConnectionStatus({
        userId,
        isConnected,
    }: {
        userId: number;
        isConnected: boolean;
    }): Promise<Result<void>> {
        try {
            await this.run('UPDATE users SET is_connected = ? WHERE id = ?', [isConnected ? 1 : 0, userId]);
            return Result.success(undefined);
        } catch {
            return Result.error(ApplicationError.InternalServerError);
        }
    }
}

export default fp(
    (fastify) => {
        const repo = new UserRepository(fastify.DbConnection);
        fastify.decorate('UserRepository', repo);
    },
    {
        name: 'UserRepository',
        dependencies: ['DbConnection'],
    }
);
