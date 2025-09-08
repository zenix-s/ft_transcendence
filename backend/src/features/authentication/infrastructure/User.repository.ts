import { User } from '../domain/User.entity';
import { IUserRepository } from '../application/repositories/User.IRepository';
import { IConnection } from '@shared/infrastructure/db/IConnection.interface';

export class UserRepository implements IUserRepository {
    constructor(private readonly connection: IConnection) {}

    async createUser(user: Omit<User, 'id'>): Promise<User> {
        await this.connection.execute(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [user.username, user.email, user.password]
        );

        const row = await this.connection.selectOne<User>(
            'SELECT * FROM users WHERE email = ?',
            [user.email]
        );

        return row!;
    }

    async getUserByEmail(email: string): Promise<User | null> {
        return this.connection.selectOne<User>(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
    }

    async getUserById(id: number): Promise<User | null> {
        return this.connection.selectOne<User>(
            'SELECT * FROM users WHERE id = ?',
            [id]
        );
    }
}
