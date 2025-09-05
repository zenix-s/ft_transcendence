import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import dbPlugin from '@shared/infrastructure/db/db';
import usersRoutes from '@features/users/Users.presentation';
import { fastifyWebsocket } from '@fastify/websocket';
import gameRoutes from '@features/game/pong/Pong.presentation';
import fastifyAuth from '@fastify/auth';

async function App(fastify: FastifyInstance) {
    fastify.decorate(
        'verifyUser',
        function (request: FastifyRequest, reply: FastifyReply) {
            const isAuthenticated = true;

            if (!isAuthenticated) {
                reply.status(401).send({ error: 'Unauthorized' });
            }
        }
    );

    fastify.setErrorHandler(
        (error: Error, req: FastifyRequest, res: FastifyReply) => {
            fastify.log.error(error);

            if (error.message.includes('Database')) {
                res.status(503).send({
                    statusCode: 503,
                    error: 'Service Unavailable',
                    message: 'Database connection error',
                });
                return;
            }

            res.status(500).send({
                statusCode: 500,
                error: 'Internal Server Error',
                message: 'An unexpected error occurred.',
            });
        }
    );

    fastify.register(fastifyWebsocket);
    fastify.register(fastifyAuth);

    fastify.register(dbPlugin);

    fastify.addHook('preHandler', fastify.auth([fastify.verifyUser]));

    fastify.register(usersRoutes, { prefix: '/users' });
    fastify.register(gameRoutes, { prefix: '/game' });
}

export default fp(App);
