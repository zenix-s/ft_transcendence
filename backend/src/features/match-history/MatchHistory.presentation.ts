import { FastifyInstance } from 'fastify';
import GetMatchHistoryRoute from './GetMatchHistory/GetMatchHistory.route';
import GetUserStatsRoute from './GetUserStats/GetUserStats.route';

export default function matchHistoryPresentation(fastify: FastifyInstance) {
    fastify.register(GetMatchHistoryRoute);
    fastify.register(GetUserStatsRoute);
}
