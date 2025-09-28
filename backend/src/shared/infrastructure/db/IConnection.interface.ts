import { DBParam, DBRecord, QueryResult, ExecuteResult } from './types';

export type { DBParam, DBRecord } from './types';

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
