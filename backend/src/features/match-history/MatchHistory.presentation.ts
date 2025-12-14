import { FastifyInstance } from 'fastify';
import GetMatchHistoryRoute from './GetMatchHistory/GetMatchHistory.route';
import GetUserStatsRoute from './GetUserStats/GetUserStats.route';
import GetGameFinalStateRoute from './GetGameFinalState/GetGameFinalState.route';

export default function matchHistoryPresentation(fastify: FastifyInstance) {
    // Add authentication hook for all routes in this feature
    fastify.addHook('preHandler', fastify.authenticate);

    fastify.register(GetMatchHistoryRoute);
    fastify.register(GetUserStatsRoute);
    fastify.register(GetGameFinalStateRoute);
}
