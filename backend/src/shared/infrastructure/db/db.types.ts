export type DBParam = string | number | boolean | null | undefined;

export type DBRecord = Record<string, DBParam>;

export interface QueryResult<T = DBRecord> {
    rows: T[];
    rowCount: number;
}

export interface ExecuteResult {
    affectedRows: number | bigint;
    insertId?: number;
}
