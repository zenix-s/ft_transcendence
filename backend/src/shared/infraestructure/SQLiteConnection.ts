import { DatabaseSync } from "node:sqlite";
import { IConnection } from "@shared/infraestructure/abstractions/IConnection.interface";

/**
 * Manages SQLite database connections using the node:sqlite module.
 * Implements the IConnection interface for database operations.
 */
class SQLiteConnection implements IConnection {
    private db: DatabaseSync | null = null;
    private dbPath: string;

    /**
     * Constructs a new SQLiteConnection instance.
     * @param dbName The name of the SQLite database file (e.g., "mydatabase.sqlite").
     */
    constructor(dbPath: string) {
        this.dbPath = dbPath;
    }

    /**
     * Establishes a connection to the SQLite database and initializes the schema.
     * @returns A Promise that resolves when the connection is established and schema is ready.
     * @throws An error if the connection fails.
     */
    public async connect(): Promise<void> {
        try {
            // Open the database connection synchronously.
            this.db = new DatabaseSync(this.dbPath);

            // Enable Write-Ahead Logging (WAL) mode for better concurrency and durability.
            this.db.exec("PRAGMA journal_mode = WAL;");

            // Initialize the database schema.
            // Using exec() for potentially multiple statements in the future.
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    email TEXT NOT NULL
                );
            `);

            console.log(
                "Database connected and schema initialized successfully.",
            );
        } catch (error) {
            console.error("Failed to connect to the database:", error);
            // Re-throw the error to allow callers to handle connection failures.
            throw error;
        }
    }

    close(): void {
        if (this.db) {
            // Close the database connection.
            this.db.close();
            this.db = null;
            console.log("Database connection closed.");
        } else {
            console.warn("No database connection to close.");
        }
    }

    exec(sql: string, ...args: any[]): void {
        if (!this.db) {
            throw new Error("Database connection is not established.");
        }
        try {
            const sqlQuery = this.db.prepare(sql);
            sqlQuery.run(...args);
        } catch (error) {
            console.error("Error executing SQL command:", error);
            throw error;
        }
    }

    all<T>(sql: string, ...args: any[]): T[] {
        if (!this.db)
            throw new Error("Database connection is not established.");

        try {
            const sqlQuery = this.db.prepare(sql);
            return sqlQuery.all(...args) as T[];
        } catch (error) {
            console.error("Error executing SQL query:", error);
            throw error;
        }
    }

    get<T>(sql: string, ...args: any[]): T {
        if (!this.db)
            throw new Error("Database connection is not established.");

        try {
            const sqlQuery = this.db.prepare(sql);
            return sqlQuery.get(...args) as T;
        } catch (error) {
            console.error("Error executing SQL query:", error);
            throw error;
        }
    }
}

export { SQLiteConnection };
