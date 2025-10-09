import { Result, ErrorResult } from '@shared/abstractions/Result';
import { AbstractRepository } from '@shared/infrastructure/db/AbstractRepository';
import { User } from '@shared/domain/entity/User.entity';
import fp from 'fastify-plugin';
import { AuthenticationUserRow } from '../types/types';

const userNotFoundError: ErrorResult = 'UserNotFound';

export interface AuthenticationUserDto extends User {
    password: string;
}

export type CreateUserDto = Omit<AuthenticationUserDto, 'id'>;

export interface IUserRepository {
    createUser(user: CreateUserDto): Promise<Result<User>>;
    getUserByEmail(email: string): Promise<Result<AuthenticationUserDto>>;
    getUserById(id: number): Promise<Result<AuthenticationUserDto>>;
    updateUserAvatar(userId: number, avatarUrl: string): Promise<Result<void>>;
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
            return Result.error(userNotFoundError);
        }

        return Result.success(row);
    }

    async getUserByEmail(email: string): Promise<Result<AuthenticationUserDto>> {
        const row = await this.findOne<AuthenticationUserRow>(
            'SELECT id, username, email, password, avatar FROM users WHERE email = ?',
            [email]
        );

        if (!row) {
            return Result.error(userNotFoundError);
        }

        return Result.success(row);
    }

    async getUserById(id: number): Promise<Result<AuthenticationUserDto>> {
        const row = await this.findOne<AuthenticationUserRow>(
            'SELECT id, username, email, password, avatar FROM users WHERE id = ?',
            [id]
        );

        if (!row) {
            return Result.error(userNotFoundError);
        }

        return Result.success(row);
    }

    async updateUserAvatar(userId: number, avatarUrl: string): Promise<Result<void>> {
        try {
            await this.run('UPDATE users SET avatar = ? WHERE id = ?', [avatarUrl, userId]);
            return Result.success(undefined);
        } catch {
            return Result.error('UpdateFailed');
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
