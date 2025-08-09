import { IConnection } from "@shared/infraestructure/abstractions/IConnection.interface";
import { SQLiteConnection } from "@shared/infraestructure/SQLiteConnection";

export class DBConnectionFactory {
    private static instance: IConnection | null = null;

    public static async stablishConnection(): Promise<IConnection> {
        if (!DBConnectionFactory.instance) {
            const dbPath = "db/database.db";
            const connection = new SQLiteConnection(dbPath);
            await connection.connect();
            DBConnectionFactory.instance = connection;
        }
        return DBConnectionFactory.instance;
    }

    public static getInstance(): IConnection {
        if (!DBConnectionFactory.instance)
            throw new Error(
                "Database connection has not been established. Call stablishConnection() first.",
            );
        return DBConnectionFactory.instance;
    }
}
