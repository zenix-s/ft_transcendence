// src/features/users/user.repository.ts
import { User } from "../Domain/User.entity";
import { IUserRepository } from "@features/Users/Application/Repositories/User.IRepository";
import { IConnection } from "@shared/infrastructure/db/IConnection.interface";
export class UserRepository implements IUserRepository {
    constructor(private readonly connection: IConnection) {}

    async createUser(user: Omit<User, "id">): Promise<User> {
        // SQLite example:
        await this.connection.execute(
            "INSERT INTO users (username, email) VALUES (?, ?)",
            [user.username, user.email],
        );

        const row = await this.connection.selectOne<User>(
            "SELECT * FROM users WHERE email = ?",
            [user.email],
        );

        return row!;
    }

    async getAllUsers(page: number = 1, limit: number = 10): Promise<User[]> {
        const offset = (page - 1) * limit;
        const rows = await this.connection.selectMany<User>(
            "SELECT * FROM users LIMIT ? OFFSET ?",
            [limit, offset],
        );
        return rows;
    }

    async countUsers(): Promise<number> {
        const row = await this.connection.selectOne<{ count: number }>(
            "SELECT COUNT(*) as count FROM users",
        );
        return row?.count ?? 0;
    }
}
