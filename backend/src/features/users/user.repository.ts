import { AbstractRepository } from "@shared/infraestructure/AbstractRepository";
import { DBConnectionFactory } from "@shared/infraestructure/DBConnectionFactory";
import { IConnection } from "@shared/infraestructure/abstractions/IConnection.interface";
import { IUserRepository } from "./User.IRepository";
import { ICreateUserDto } from "./dto/CreateUserDto.interface";

/**
 * UserRepository handles all user-related database operations.
 * Extends AbstractRepository for shared DB logic.
 */
export class UserRepository
    extends AbstractRepository
    implements IUserRepository
{
    private constructor(connection: IConnection) {
        super(connection);
    }

    /**
     * Async factory method to create a UserRepository instance with an initialized DB connection.
     */
    public static create(): UserRepository {
        const connection: IConnection = DBConnectionFactory.getInstance();
        return new UserRepository(connection);
    }

    /**
     * Persists a new user in the database.
     * @param request - The user creation request containing username and email.
     */
    public async createUser(request: ICreateUserDto): Promise<void> {
        const sql = `INSERT INTO users (name, email) VALUES (?, ?)`;
        await this.exec(sql, request.username, request.email);
    }

    public async getAllUsers(): Promise<Array<{ id: number }>> {
        const sql = `
            SELECT id FROM users
            ORDER BY id ASC
        `;

        let users = await this.all<{ id: number }>(sql);

        return users.map((user: { id: number }) => ({ id: user.id }));
    }
}
