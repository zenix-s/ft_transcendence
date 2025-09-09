/* eslint-disable @typescript-eslint/no-explicit-any */
export interface IQueryResult<T = any> {
    rows: T[];
    rowCount: number;
}

export interface IConnection {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    isConnected(): boolean;

    query<T = any>(sql: string, params?: any[]): Promise<IQueryResult<T>>;
    execute(sql: string, params?: any[]): Promise<{ affectedRows: number | bigint; insertId?: number }>;

    selectOne<T = any>(sql: string, params?: any[]): Promise<T | null>;
    selectMany<T = any>(sql: string, params?: any[]): Promise<T[]>;

    ping(): Promise<boolean>;
}
