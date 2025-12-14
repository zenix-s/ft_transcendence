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

const AuthPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    // Step 1: Register JWT plugin with configuration
    await fastify.register(fastifyJWT, {
        secret: process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
        sign: {
            expiresIn: '24h',
        },
    });

    // Step 2: HTTP Authentication Decorator
    const authenticate = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
        try {
            await request.jwtVerify();
        } catch (err) {
            const result = fastify.handleError({ code: ApplicationError.InvalidToken, error: err });
            reply.status(401).send({ error: result.error });
        }
    };

    fastify.decorate('authenticate', authenticate);

    // Step 3: WebSocket Authentication Method
    const authenticateWs = async (token: string): Promise<Result<number>> => {
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

    fastify.decorate('authenticateWs', authenticateWs);

    // Step 4: Lifecycle hooks
    fastify.addHook('onClose', async (instance) => {
        instance.log.info('Cleaning up AuthPlugin');
    });
};

export default fp(AuthPlugin, {
    name: 'authPlugin',
});
