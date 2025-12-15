import { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { ApplicationError } from '@shared/Errors';

/**
 * Sets up the global error handler for Fastify
 * Handles validation errors, database errors, and returns appropriate HTTP status codes
 */
const setupErrorHandler = (fastify: FastifyInstance): void => {
    fastify.setErrorHandler(
        (
            error: Error & { validation?: unknown; validationContext?: unknown; statusCode?: number },
            req: FastifyRequest,
            res: FastifyReply
        ) => {
            fastify.log.error(error);

            // Handle validation errors from Fastify schema validation
            if (error.validation || error.validationContext) {
                res.status(400).send({
                    error: 'Validation error: ' + error.message,
                });
                return;
            }

            // Handle JSON schema validation errors and other 400 errors
            if (error.statusCode === 400) {
                res.status(400).send({
                    error: error.message,
                });
                return;
            }

            if (error.message.includes('Database')) {
                res.status(503).send({
                    error: ApplicationError.DatabaseServiceUnavailable,
                });
                return;
            }

            res.status(500).send({
                error: ApplicationError.InternalServerError,
            });
        }
    );
};

const AppErrorHandlerPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    setupErrorHandler(fastify);
};

export default fp(AppErrorHandlerPlugin, {
    name: 'appErrorHandlerPlugin',
});
