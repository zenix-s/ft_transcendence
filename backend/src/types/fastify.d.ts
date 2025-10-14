import { FastifyReply } from 'fastify';
import { JWT } from '@fastify/jwt';
import { IAuthenticatedUser, IJWTPayload } from '@shared/types';
import { SQLiteConnection } from '@shared/infrastructure/db/SQLiteConnection';
import { Result } from '@shared/abstractions/Result';
import ICommand from '@shared/application/abstractions/ICommand.interface';
import IQuery from '@shared/application/abstractions/IQuery.interface';
import { IGameTypeRepository } from '@shared/infrastructure/repositories/GameTypeRepository';
import { IMatchPlayerRepository } from '@shared/infrastructure/repositories/MatchPlayerRepository';
import { IMatchRepository } from '@shared/infrastructure/repositories/MatchRepository';
import { IUserRepository } from '@shared/infrastructure/repositories/UserRepository';
import { IPongGameRepository } from '@features/game/pong/infrastructure/PongGame.repository';
import { IFriendShipRepository } from '@shared/infrastructure/repositories/FriendShipRepository';

declare module 'fastify' {
    interface FastifyInstance {
        authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
        jwt: JWT;

        // BBDD connection
        DbConnection: SQLiteConnection;

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

        // Repositories
        GameTypeRepository: IGameTypeRepository;
        MatchPlayerRepository: IMatchPlayerRepository;
        MatchRepository: IMatchRepository;
        UserRepository: IUserRepository;
        PongGameRepository: IPongGameRepository;
        FriendShipRepository: IFriendShipRepository;
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
