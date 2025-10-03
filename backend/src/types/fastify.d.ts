import { FastifyReply } from 'fastify';
import { JWT } from '@fastify/jwt';
import { IAuthenticatedUser, IJWTPayload } from '@shared/types';
import { SQLiteConnection } from '@shared/infrastructure/db/SQLiteConnection';
import ICommand from '@shared/application/abstractions/ICommand.interface';
import IQuery from '@shared/application/abstractions/IQuery.interface';

declare module 'fastify' {
    interface FastifyInstance {
        authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
        jwt: JWT;

        // BBDD connection
        dbConnection: SQLiteConnection;

        // handle medaitors
        handleQuery<TRequest, TResponse>({
            query,
            request,
            reply,
            successStatus = 200,
        }: {
            query: IQuery<TRequest, TResponse>;
            request: TRequest | undefined;
            reply: FastifyReply;
            successStatus?: number;
        }): Promise<FastifyReply>;

        handleCommand<TRequest, TResponse>({
            command,
            request,
            reply,
            successStatus = 200,
        }: {
            command: ICommand<TRequest, TResponse>;
            request: TRequest | undefined;
            reply: FastifyReply;
            successStatus?: number;
        }): Promise<FastifyReply>;

        // Handle error
        handleError<T>({ code, error }: { code: string; error: unknown }): Result<T>;
    }

    interface FastifyRequest {
        jwtVerify(): Promise<void>;
        user: IAuthenticatedUser;
    }
}

declare module '@fastify/jwt' {
    interface FastifyJWT {
        payload: IJWTPayload;
        user: IAuthenticatedUser;
    }
}
