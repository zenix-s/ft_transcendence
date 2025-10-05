import { FastifyInstance } from 'fastify/types/instance';
import { FastifyReply } from 'fastify/types/reply';
import { FastifyRequest } from 'fastify/types/request';
import GetMatchHistoryQuery from './GetMatchHistory.application';

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

export default async function GetMatchHistoryRoute(fastify: FastifyInstance) {
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
}
