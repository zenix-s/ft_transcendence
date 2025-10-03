import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import dbPlugin from '@shared/infrastructure/db/db';
import { fastifyWebsocket } from '@fastify/websocket';
import pongHttpRoutes from '@features/game/pong/presentation/pong.http';
import pongWebSocketRoutes from '@features/game/pong/presentation/pong.websocket';
import matchHistoryPresentation from '@features/match-history/MatchHistory.presentation';
import fastifyAuth from '@fastify/auth';
import fastifyJWT from '@fastify/jwt';
import authRoutes from '@features/authentication/Authentication.presentation';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';

async function App(fastify: FastifyInstance) {
    fastify.register(fastifyJWT, {
        secret: process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
        sign: {
            expiresIn: '24h',
        },
    });

    fastify.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
        try {
            await request.jwtVerify();
        } catch (err) {
            const result = fastify.handleError({ code: '401', error: err });
            reply.status(401).send({ error: result.error });
        }
    });

    fastify.setErrorHandler((error: Error, req: FastifyRequest, res: FastifyReply) => {
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
    });

    fastify.register(fastifySwagger, {
        openapi: {
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT',
                    },
                },
            },
        },
    });
    fastify.register(fastifySwaggerUi, {
        routePrefix: '/documentation',
    });

    fastify.register(fastifyWebsocket);
    fastify.register(fastifyAuth);

    fastify.register(dbPlugin);

    fastify.register(authRoutes, { prefix: '/auth' });

    fastify.register(pongWebSocketRoutes, { prefix: '/game/pong' });

    fastify.register(async function authenticatedContext(fastify) {
        fastify.addHook('preHandler', fastify.auth([fastify.authenticate]));

        fastify.register(pongHttpRoutes, { prefix: '/game/pong' });
        fastify.register(matchHistoryPresentation, { prefix: '/match-history' });
    });
}

export default fp(App);
