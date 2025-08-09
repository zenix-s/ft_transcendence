export interface IConnection {
    // prepare<T>(sql: string): Promise<T>;
    // close(): Promise<void>;
    // run(...args: any[]): Promise<void>;
    // all<T>(...args: any[]): Promise<T[]>;
    // get<T>(...args: any[]): Promise<T>;
    // exec(sql: string): Promise<void>;
    // transaction<T>(callback: () => Promise<T>): Promise<T>;
    // beginTransaction(): Promise<void>;
    // commit(): Promise<void>;
    // rollback(): Promise<void>;
    //

    connect(): void;
    close(): void;

    exec(sql: string, ...args: any[]): void;
    all<T>(sql: string, ...args: any[]): T[];
    get<T>(sql: string, ...args: any[]): T;
}
