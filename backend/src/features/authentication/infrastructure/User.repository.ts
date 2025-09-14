import { Result, ErrorResult } from '@shared/abstractions/Result';
import {
    AuthenticationUserDto,
    CreateUserDto,
    IUserRepository,
} from '../application/repositories/User.IRepository';
import { IConnection } from '@shared/infrastructure/db/IConnection.interface';

const userNotFoundError: ErrorResult = 'UserNotFound';

export class UserRepository implements IUserRepository {
    constructor(private readonly connection: IConnection) {}

    async createUser(user: CreateUserDto): Promise<Result<AuthenticationUserDto>> {
        await this.connection.execute('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [
            user.username,
            user.email,
            user.password,
        ]);

        const row = await this.connection.selectOne<AuthenticationUserDto>(
            'SELECT * FROM users WHERE email = ?',
            [user.email]
        );

        if (!row) {
            return Result.error(userNotFoundError);
        }

        return Result.success(row);
    }

    async getUserByEmail(email: string): Promise<Result<AuthenticationUserDto>> {
        const row = await this.connection.selectOne<AuthenticationUserDto>(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (!row) {
            return Result.error(userNotFoundError);
        }

        return Result.success(row);
    }

    async getUserById(id: number): Promise<Result<AuthenticationUserDto>> {
        const row = await this.connection.selectOne<AuthenticationUserDto>(
            'SELECT * FROM users WHERE id = ?',
            [id]
        );

        if (!row) {
            return Result.error(userNotFoundError);
        }

        return Result.success(row);
    }
}
