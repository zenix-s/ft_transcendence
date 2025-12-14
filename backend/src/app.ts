import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import dbPlugin from '@shared/infrastructure/db/db';
import ErrorHandlerPlugin from '@shared/plugins/ErrorHandlerPlugin';
import AppErrorHandlerPlugin from '@shared/plugins/AppErrorHandlerPlugin';
import { fastifyWebsocket } from '@fastify/websocket';
import PongGameHttpRoutes from '@features/pong-http/http/pong.http';
import GameInvitationHttpRoutes from '@features/game-invitation/http/game-invitation.http';
import pongWebSocketRoutes from '@features/pong-websocket/websocket/pong.websocket';
import socialWebSocketRoutes from '@features/socialSocket/websocket/social.websocket';
import SocialWebSocketServicePlugin from '@features/socialSocket/plugins/SocialWebSocketServicePlugin';
import PongGameManagerPlugin from '@features/pong-game-manager/plugins/PongGameManagerPlugin';
import matchHistoryPresentation from '@features/match-history/MatchHistory.presentation';
import fastifyAuth from '@fastify/auth';
import authRoutes from '@features/authentication/Authentication.presentation';
import userManagerRoutes from '@features/user-manager/UserManager.presentation';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import fastifyStatic from '@fastify/static';
import fastifyMultipart from '@fastify/multipart';
import Repositories from '@shared/infrastructure/repositories';
import path from 'path';
import FriendShipController from '@features/friendship/Friendship.presentation';
import MediatorHandlerPlugin from '@shared/plugins/MediatorHandlerPlugin';
import PongTournamentsHttpRoutes from '@features/tournaments/pong/http/pong-tournaments.http';
import PongTournamentManagerPlugin from '@features/tournaments/pong/plugins/PongTournamentManagerPlugin';
import tournamentWebSocketRoutes from '@features/tournaments/pong/websocket/tournament.websocket';
import TournamentWebSocketServicePlugin from '@features/tournaments/pong/plugins/TournamentWebSocketServicePlugin';
import AuthPlugin from '@shared/plugins/AuthPlugin';

async function App(fastify: FastifyInstance) {
    fastify.register(AuthPlugin);
    fastify.register(dbPlugin);
    fastify.register(MediatorHandlerPlugin);
    fastify.register(ErrorHandlerPlugin);
    fastify.register(AppErrorHandlerPlugin);
    fastify.register(Repositories);
    fastify.register(SocialWebSocketServicePlugin);
    fastify.register(PongGameManagerPlugin);
    fastify.register(PongTournamentManagerPlugin);
    fastify.register(TournamentWebSocketServicePlugin);

    fastify.register(fastifyMultipart, {
        limits: {
            fileSize: 5 * 1024 * 1024,
        },
    });

    fastify.register(fastifyStatic, {
        root: path.join(process.cwd(), 'uploads'),
        prefix: '/uploads/',
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
    fastify.register(tournamentWebSocketRoutes, { prefix: '/tournaments/pong' });

    // HTTP routes - authentication handled at feature level
    fastify.register(PongGameHttpRoutes, { prefix: '/game/pong' });
    fastify.register(GameInvitationHttpRoutes, { prefix: '/game-invitation' });
    fastify.register(matchHistoryPresentation, { prefix: '/match-history' });
    fastify.register(userManagerRoutes, { prefix: '/user-manager' });
    fastify.register(FriendShipController, { prefix: '/friendship' });
    fastify.register(PongTournamentsHttpRoutes, { prefix: '/tournaments/pong' });
}

export default fp(App);
