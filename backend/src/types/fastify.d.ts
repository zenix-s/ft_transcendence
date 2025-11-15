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
import { IFriendShipRepository } from '@shared/infrastructure/repositories/FriendShipRepository';
import { ISocialWebSocketService } from '@features/socialSocket/services/ISocialWebSocketService.interface';
import { ITournamentRepository } from '@shared/infrastructure/repositories/TournamentRepository';

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
        FriendShipRepository: IFriendShipRepository;
        TournamentRepository: ITournamentRepository;

        // Services
        SocialWebSocketService: ISocialWebSocketService;
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
