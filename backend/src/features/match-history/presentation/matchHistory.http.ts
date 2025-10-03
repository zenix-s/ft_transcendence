import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import GetMatchHistoryQuery from '../application/mediators/GetMatchHistory.query';
import GetUserStatsQuery from '../application/mediators/GetUserStats.query';

interface MatchHistoryRequest {
    Querystring?: {
        limit?: number;
        offset?: number;
    };
}

interface UserMatchHistoryRequest {
    Params: {
        userId: string;
    };
    Querystring?: {
        limit?: number;
        offset?: number;
    };
}

interface UserStatsRequest {
    Params: {
        userId: string;
    };
}

export default async function matchHistoryRoutes(fastify: FastifyInstance) {
    fastify.get(
        '/',
        {
            schema: {
                description: 'Get all match history',
                tags: ['Match History'],
                security: [{ bearerAuth: [] }],
                querystring: {
                    type: 'object',
                    properties: {
                        limit: { type: 'number', default: 20 },
                        offset: { type: 'number', default: 0 },
                    },
                },
            },
        },
        async (req: FastifyRequest<MatchHistoryRequest>, reply: FastifyReply) => {
            const getMatchHistoryQuery = new GetMatchHistoryQuery(fastify);
            const request = {
                limit: req.query?.limit,
                offset: req.query?.offset,
            };

            return fastify.handleQuery({
                query: getMatchHistoryQuery,
                request: request,
                reply: reply,
            });
        }
    );

    fastify.get(
        '/user/:userId',
        {
            schema: {
                description: 'Get match history for a specific user',
                tags: ['Match History'],
                security: [{ bearerAuth: [] }],
                params: {
                    type: 'object',
                    properties: {
                        userId: { type: 'string' },
                    },
                    required: ['userId'],
                },
            },
        },
        async (req: FastifyRequest<UserMatchHistoryRequest>, reply: FastifyReply) => {
            const getMatchHistoryQuery = new GetMatchHistoryQuery(fastify);
            const userId = parseInt(req.params.userId);
            const request = {
                userId: isNaN(userId) ? undefined : userId,
                limit: req.query?.limit,
                offset: req.query?.offset,
            };

            return fastify.handleQuery({
                query: getMatchHistoryQuery,
                request: request,
                reply: reply,
            });
        }
    );

    fastify.get(
        '/stats/:userId',
        {
            schema: {
                description: 'Get game statistics for a user',
                tags: ['Match History'],
                security: [{ bearerAuth: [] }],
                params: {
                    type: 'object',
                    properties: {
                        userId: { type: 'string' },
                    },
                    required: ['userId'],
                },
            },
        },
        async (req: FastifyRequest<UserStatsRequest>, reply: FastifyReply) => {
            const getUserStatsQuery = new GetUserStatsQuery(fastify);
            const userId = parseInt(req.params.userId);
            const request = {
                userId: isNaN(userId) ? 0 : userId,
            };

            return fastify.handleCommand({
                command: getUserStatsQuery,
                request: request,
                reply: reply,
            });
        }
    );
}
