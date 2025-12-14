import { JWT } from '@fastify/jwt';
import { IAuthenticatedUser, IJWTPayload } from '@shared/types';
import { SQLiteConnection } from '@shared/infrastructure/db/SQLiteConnection';
import { IGameTypeRepository } from '@shared/infrastructure/repositories/GameTypeRepository';
import { IMatchPlayerRepository } from '@shared/infrastructure/repositories/MatchPlayerRepository';
import { IMatchRepository } from '@shared/infrastructure/repositories/MatchRepository';
import { IUserRepository } from '@shared/infrastructure/repositories/UserRepository';
import { IFriendShipRepository } from '@shared/infrastructure/repositories/FriendShipRepository';
import { ISocialWebSocketService } from '@features/socialSocket/services/ISocialWebSocketService.interface';
import { ITournamentRepository } from '@shared/infrastructure/repositories/TournamentRepository';

declare module 'fastify' {
    interface FastifyInstance {
        jwt: JWT;

        // BBDD connection
        DbConnection: SQLiteConnection;

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
