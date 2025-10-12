import { Result } from '@shared/abstractions/Result';
import { AbstractRepository } from '@shared/infrastructure/db/AbstractRepository';
import { User } from '@shared/domain/entity/User.entity';
import fp from 'fastify-plugin';
import { AuthenticationUserRow } from '../types/types';
import { ApplicationError } from '@shared/Errors';

export interface AuthenticationUserDto extends User {
    password: string;
}

export type CreateUserDto = Omit<AuthenticationUserDto, 'id'>;

export interface IUserRepository {
    createUser(user: CreateUserDto): Promise<Result<User>>;
    getUserByEmail(email: string): Promise<Result<AuthenticationUserDto>>;
    getUserByUsername(username: string): Promise<Result<AuthenticationUserDto>>;
    getUserById(id: number): Promise<Result<AuthenticationUserDto>>;
    updateUserAvatar(userId: number, avatarUrl: string): Promise<Result<void>>;
    updateUsername(id: number, newUsername: string): Promise<Result<User>>;
    updatePassword(id: number, newPassword: string): Promise<Result<User>>;
}

class UserRepository extends AbstractRepository implements IUserRepository {
    async createUser(user: CreateUserDto): Promise<Result<AuthenticationUserDto>> {
        await this.run('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [
            user.username,
            user.email,
            user.password,
        ]);

        const row = await this.findOne<AuthenticationUserRow>(
            'SELECT id, username, email, password, avatar FROM users WHERE email = ?',
            [user.email]
        );

        if (!row) {
            return Result.error(ApplicationError.UserNotFound);
        }

        return Result.success(row);
    }

    async getUserByEmail(email: string): Promise<Result<AuthenticationUserDto>> {
        const row = await this.findOne<AuthenticationUserRow>(
            'SELECT id, username, email, password, avatar FROM users WHERE email = ?',
            [email]
        );

        if (!row) {
            return Result.error(ApplicationError.UserNotFound);
        }

        return Result.success(row);
    }

    async getUserByUsername(username: string): Promise<Result<AuthenticationUserDto>> {
        const row = await this.findOne<AuthenticationUserRow>('SELECT * FROM users WHERE username = ?', [
            username,
        ]);

        if (!row) {
            return Result.error(ApplicationError.UserNotFound);
        }

        return Result.success(row);
    }

    async getUserById(id: number): Promise<Result<AuthenticationUserDto>> {
        const row = await this.findOne<AuthenticationUserRow>(
            'SELECT id, username, email, password, avatar FROM users WHERE id = ?',
            [id]
        );

        if (!row) {
            return Result.error(ApplicationError.UserNotFound);
        }

        return Result.success(row);
    }

    async updateUserAvatar(userId: number, avatarUrl: string): Promise<Result<void>> {
        try {
            await this.run('UPDATE users SET avatar = ? WHERE id = ?', [avatarUrl, userId]);
            return Result.success(undefined);
        } catch {
            return Result.error(ApplicationError.AvatarUpdateError);
        }
    }

    async updateUsername(id: number, newUsername: string): Promise<Result<User>> {
        await this.run('UPDATE users SET username = ? WHERE id = ?', [newUsername, id]);

        const row = await this.findOne<AuthenticationUserRow>('SELECT * FROM users WHERE id = ?', [id]);
        if (!row) {
            return Result.error(ApplicationError.UserNotFound);
        }

        return Result.success(row);
    }

    async updatePassword(id: number, password: string): Promise<Result<User>> {
        await this.run('UPDATE users SET password = ? WHERE id = ?', [password, id]);

        const row = await this.findOne<AuthenticationUserRow>('SELECT * FROM users WHERE id = ?', [id]);
        if (!row) {
            return Result.error(ApplicationError.UserNotFound);
        }

        return Result.success(row);
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
