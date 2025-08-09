import { IConnection } from "@shared/infraestructure/abstractions/IConnection.interface";

/**
 * AbstractRepository provides a base for all repositories,
 * encapsulating the shared database connection and common methods.
 */
export abstract class AbstractRepository {
    protected connection: IConnection;

    protected constructor(connection: IConnection) {
        this.connection = connection;
    }

    /**
     * Executes a SQL command that does not return results (e.g., INSERT, UPDATE, DELETE).
     * @param sql - The SQL statement to execute.
     * @param args - Arguments for parameterized queries.
     */
    protected async exec(sql: string, ...args: any[]): Promise<void> {
        this.connection.exec(sql, ...args);
    }

    /**
     * Executes a SQL query and returns all results as an array.
     * @param sql - The SQL query to execute.
     * @param args - Arguments for parameterized queries.
     */
    protected async all<T>(sql: string, ...args: any[]): Promise<T[]> {
        return this.connection.all<T>(sql, ...args);
    }

    /**
     * Executes a SQL query and returns a single result.
     * @param sql - The SQL query to execute.
     * @param args - Arguments for parameterized queries.
     */
    protected async get<T>(sql: string, ...args: any[]): Promise<T> {
        return this.connection.get<T>(sql, ...args);
    }
}
