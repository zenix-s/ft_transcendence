import { FastifyInstance, FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import fastifyJWT from '@fastify/jwt';
import { Result } from '@shared/abstractions/Result';
import { ApplicationError } from '@shared/Errors';

declare module 'fastify' {
    interface FastifyInstance {
        authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
        authenticateWs: (token: string) => Promise<Result<number>>;
    }
}

/**
 * HTTP Authentication decorator - validates JWT token via request
 */
const authenticate = async (
    fastify: FastifyInstance,
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> => {
    try {
        await request.jwtVerify();
    } catch (err) {
        const result = fastify.handleError({ code: ApplicationError.InvalidToken, error: err });
        reply.status(401).send({ error: result.error });
    }
};

/**
 * WebSocket Authentication - validates JWT token string and returns user ID
 */
const authenticateWs = async (fastify: FastifyInstance, token: string): Promise<Result<number>> => {
    try {
        const decoded = (await fastify.jwt.verify(token)) as { id?: number };
        if (!decoded.id || typeof decoded.id !== 'number') {
            return Result.error(ApplicationError.InvalidToken);
        }
        return Result.success(decoded.id);
    } catch {
        return Result.error(ApplicationError.InvalidToken);
    }
};

const AuthPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    // Register JWT plugin with configuration
    await fastify.register(fastifyJWT, {
        secret: process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
        sign: {
            expiresIn: '24h',
        },
    });

    // Decorate fastify instance with authentication methods
    fastify.decorate('authenticate', (request: FastifyRequest, reply: FastifyReply) =>
        authenticate(fastify, request, reply)
    );
    fastify.decorate('authenticateWs', (token: string) => authenticateWs(fastify, token));

    // Lifecycle hooks
    fastify.addHook('onClose', async (instance) => {
        instance.log.info('Cleaning up AuthPlugin');
    });
};

export default fp(AuthPlugin, {
    name: 'authPlugin',
});
