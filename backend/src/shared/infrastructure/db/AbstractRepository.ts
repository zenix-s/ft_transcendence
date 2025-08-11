import { IConnection } from "../db/IConnection";

export abstract class AbstractRepository {
    constructor(protected readonly connection: IConnection) {}

    protected findOne<T>(sql: string, params: any[] = []): Promise<T | null> {
        return this.connection.selectOne<T>(sql, params);
    }

    protected findMany<T>(sql: string, params: any[] = []): Promise<T[]> {
        return this.connection.selectMany<T>(sql, params);
    }

    protected run(
        sql: string,
        params: any[] = [],
    ): Promise<{ affectedRows: number; insertId?: number }> {
        return this.connection.execute(sql, params);
    }
}
