import { Result } from '@shared/abstractions/Result';
import { FastifyInstance } from 'fastify/types/instance';
import fp from 'fastify-plugin';

function ErrorHandlerPlugin(fastify: FastifyInstance) {
    const handleError = <T>({ code, error }: { code: string; error: unknown }): Result<T> => {
        fastify.log.error(error);

        return Result.failure(code);
    };

    fastify.decorate('handleError', handleError);
}

export default fp(ErrorHandlerPlugin);
