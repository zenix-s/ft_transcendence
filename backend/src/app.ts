import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import dbPlugin from '@shared/infrastructure/db/db';
import MediatorHandlerPlugin from '@shared/utils/MediatorHandlerPlugin';
import ErrorhandlerPlugin from '@shared/utils/ErrorHandlerPlugin';
import { fastifyWebsocket } from '@fastify/websocket';
import PongGameHttpRoutes from '@features/game/pong/http/pong.http';
import pongWebSocketRoutes from '@features/game/pong/websocket/pong.websocket';
import socialWebSocketRoutes from '@features/socialSocket/websocket/social.websocket';
import matchHistoryPresentation from '@features/match-history/MatchHistory.presentation';
import fastifyAuth from '@fastify/auth';
import fastifyJWT from '@fastify/jwt';
import authRoutes from '@features/authentication/Authentication.presentation';
import userManagerRoutes from '@features/user-manager/UserManager.presentation';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import fastifyStatic from '@fastify/static';
import fastifyMultipart from '@fastify/multipart';
import Repositories from '@shared/infrastructure/repositories';
import { ApplicationError } from '@shared/Errors';
import path from 'path';
import FriendShipController from '@features/friendship/Friendship.presentation';

async function App(fastify: FastifyInstance) {
    fastify.register(fastifyJWT, {
        secret: process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
        sign: {
            expiresIn: '24h',
        },
    });

    fastify.register(dbPlugin);
    fastify.register(MediatorHandlerPlugin);
    fastify.register(ErrorhandlerPlugin);
    fastify.register(Repositories);

    fastify.register(fastifyMultipart, {
        limits: {
            fileSize: 5 * 1024 * 1024,
        },
    });

    fastify.register(fastifyStatic, {
        root: path.join(process.cwd(), 'uploads'),
        prefix: '/uploads/',
    });

    fastify.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
        try {
            await request.jwtVerify();
        } catch (err) {
            const result = fastify.handleError({ code: ApplicationError.InvalidToken, error: err });
            reply.status(401).send({ error: result.error });
        }
    });

    fastify.setErrorHandler((error: Error, req: FastifyRequest, res: FastifyReply) => {
        fastify.log.error(error);

        if (error.message.includes('Database')) {
            res.status(503).send({
                error: ApplicationError.DatabaseServiceUnavailable,
            });
            return;
        }

        res.status(500).send({
            error: ApplicationError.InternalServerError,
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
    fastify.register(fastifySwaggerUi, { routePrefix: '/documentation' });

    fastify.register(fastifyWebsocket);
    fastify.register(fastifyAuth);

    fastify.register(authRoutes, { prefix: '/auth' });

    fastify.register(pongWebSocketRoutes, { prefix: '/game/pong' });
    fastify.register(socialWebSocketRoutes, { prefix: '/social' });

    fastify.register(async function authenticatedContext(fastify) {
        fastify.addHook('preHandler', fastify.auth([fastify.authenticate]));

        fastify.register(PongGameHttpRoutes, { prefix: '/game/pong' });
        fastify.register(matchHistoryPresentation, { prefix: '/match-history' });
        fastify.register(userManagerRoutes, { prefix: '/user-manager' });
        fastify.register(FriendShipController, { prefix: '/friendship' });
    });
}

export default fp(App);
