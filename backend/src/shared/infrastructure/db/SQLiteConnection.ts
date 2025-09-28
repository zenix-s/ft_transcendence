import { IConnection, DBParam, DBRecord } from './IConnection.interface';
import { QueryResult } from './types';
import Sqlite, { Database } from 'better-sqlite3';

export class SQLiteConnection implements IConnection {
    private db: Database | null = null;
    private connected = false;

    constructor(private dbPath: string) {}

    async connect(): Promise<void> {
        try {
            this.db = new Sqlite(this.dbPath);
            this.db.exec('PRAGMA journal_mode = WAL;');
            this.db.exec('PRAGMA foreign_keys = ON;');
            this.connected = true;
        } catch (error) {
            throw new Error(`SQLite connection failed: ${error}`);
        }
    }

    async disconnect(): Promise<void> {
        if (this.db) {
            this.db.close();
            this.db = null;
            this.connected = false;
        }
    }

    isConnected(): boolean {
        return this.connected;
    }

    async query<T = DBRecord>(sql: string, params: DBParam[] = []): Promise<QueryResult<T>> {
        this.ensureConnected();
        if (!this.db) throw new Error('Database not initialized');
        const stmt = this.db.prepare(sql);
        const rows = stmt.all(...params) as T[];
        return { rows, rowCount: rows.length };
    }

    async execute(
        sql: string,
        params: DBParam[] = []
    ): Promise<{ affectedRows: number | bigint; insertId?: number }> {
        this.ensureConnected();
        if (!this.db) throw new Error('Database not initialized');
        const stmt = this.db.prepare(sql);
        const result = stmt.run(...params);
        return {
            affectedRows: result.changes,
            insertId:
                typeof result.lastInsertRowid === 'number'
                    ? result.lastInsertRowid
                    : Number(result.lastInsertRowid),
        };
    }

    async selectOne<T = DBRecord>(sql: string, params: DBParam[] = []): Promise<T | null> {
        const res = await this.query<T>(sql, params);
        return res.rows[0] ?? null;
    }

    async selectMany<T = DBRecord>(sql: string, params: DBParam[] = []): Promise<T[]> {
        const res = await this.query<T>(sql, params);
        return res.rows;
    }

    async ping(): Promise<boolean> {
        try {
            await this.query('SELECT 1');
            return true;
        } catch {
            return false;
        }
    }

    private ensureConnected() {
        if (!this.isConnected()) {
            throw new Error('Database not connected');
        }
    }
}
