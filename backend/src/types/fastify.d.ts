import { FastifyReply, FastifyRequest } from 'fastify';

declare module 'fastify' {
    interface FastifyInstance {
        verifyUser: (request: FastifyRequest, reply: FastifyReply) => void;
    }
}
