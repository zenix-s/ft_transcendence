import { FastifyReply } from 'fastify';
import { JWT } from '@fastify/jwt';
import { IAuthenticatedUser, IJWTPayload } from '@shared/types';

declare module 'fastify' {
    interface FastifyInstance {
        authenticate: (
            request: FastifyRequest,
            reply: FastifyReply
        ) => Promise<void>;
        jwt: JWT;
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
