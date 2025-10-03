import { DBParam, DBRecord, ExecuteResult, QueryResult } from './db.types';

export interface IConnection {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    isConnected(): boolean;

    query<T = DBRecord>(sql: string, params?: DBParam[]): Promise<QueryResult<T>>;
    execute(sql: string, params?: DBParam[]): Promise<ExecuteResult>;

    selectOne<T = DBRecord>(sql: string, params?: DBParam[]): Promise<T | null>;
    selectMany<T = DBRecord>(sql: string, params?: DBParam[]): Promise<T[]>;

    ping(): Promise<boolean>;
}
