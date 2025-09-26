import { FastifyInstance } from 'fastify';
import matchHistoryRoutes from './presentation/matchHistory.http';

export default async function matchHistoryPresentation(fastify: FastifyInstance) {
    await fastify.register(matchHistoryRoutes);
}
