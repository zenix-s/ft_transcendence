import { Result, ErrorResult } from '@shared/abstractions/Result';
import {
    AuthenticationUserDto,
    CreateUserDto,
    IUserRepository,
} from '@features/authentication/application/repositories/User.IRepository';
import { AbstractRepository } from '@shared/infrastructure/db/AbstractRepository';
import { AuthenticationUserRow } from '@shared/infrastructure/db/types';

const userNotFoundError: ErrorResult = 'UserNotFound';

export class UserRepository extends AbstractRepository implements IUserRepository {
    async createUser(user: CreateUserDto): Promise<Result<AuthenticationUserDto>> {
        await this.run('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [
            user.username,
            user.email,
            user.password,
        ]);

        const row = await this.findOne<AuthenticationUserRow>('SELECT * FROM users WHERE email = ?', [
            user.email,
        ]);

        if (!row) {
            return Result.error(userNotFoundError);
        }

        return Result.success(row);
    }

    async getUserByEmail(email: string): Promise<Result<AuthenticationUserDto>> {
        const row = await this.findOne<AuthenticationUserRow>('SELECT * FROM users WHERE email = ?', [email]);

        if (!row) {
            return Result.error(userNotFoundError);
        }

        return Result.success(row);
    }

    async getUserById(id: number): Promise<Result<AuthenticationUserDto>> {
        const row = await this.findOne<AuthenticationUserRow>('SELECT * FROM users WHERE id = ?', [id]);

        if (!row) {
            return Result.error(userNotFoundError);
        }

        return Result.success(row);
    }
}
