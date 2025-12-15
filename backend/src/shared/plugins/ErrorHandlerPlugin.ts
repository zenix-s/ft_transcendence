import { Result } from '@shared/abstractions/Result';
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

declare module 'fastify' {
    interface FastifyInstance {
        handleError: <T>({ code, error }: { code: string; error: unknown }) => Result<T>;
    }
}

/**
 * Centralized error handler for queries and commands
 * Logs errors and returns a standardized Result failure
 */
const handleError = <T>(
    fastify: FastifyInstance,
    { code, error }: { code: string; error: unknown }
): Result<T> => {
    fastify.log.error(error);
    return Result.failure(code);
};

const ErrorHandlerPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    fastify.decorate('handleError', (payload: { code: string; error: unknown }) =>
        handleError(fastify, payload)
    );
};

export default fp(ErrorHandlerPlugin, {
    name: 'errorHandlerPlugin',
});
