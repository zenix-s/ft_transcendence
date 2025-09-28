import { IConnection } from '../db/IConnection.interface';
import { DBParam } from './types';

export abstract class AbstractRepository {
    constructor(protected readonly connection: IConnection) {}

    protected findOne<T>(sql: string, params: DBParam[] = []): Promise<T | null> {
        return this.connection.selectOne<T>(sql, params);
    }

    protected findMany<T>(sql: string, params: DBParam[] = []): Promise<T[]> {
        return this.connection.selectMany<T>(sql, params);
    }

    protected run(
        sql: string,
        params: DBParam[] = []
    ): Promise<{ affectedRows: number | bigint; insertId?: number }> {
        return this.connection.execute(sql, params);
    }
}
