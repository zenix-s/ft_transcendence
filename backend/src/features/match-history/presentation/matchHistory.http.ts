import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import GetMatchHistoryQuery from '../application/mediators/GetMatchHistory.query';
import GetUserStatsQuery from '../application/mediators/GetUserStats.query';
import { Result } from '@shared/abstractions/Result';

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

async function handleCommand<TRequest, TResponse>(
    commandOrQuery: {
        validate(request?: TRequest): Result<void>;
        execute(request?: TRequest): Promise<Result<TResponse>>;
    },
    request: TRequest | undefined,
    reply: FastifyReply,
    successStatus = 200
): Promise<FastifyReply> {
    const validationResult = commandOrQuery.validate(request);
    if (!validationResult.isSuccess) {
        return reply.status(400).send({ error: validationResult.error });
    }

    const result = await commandOrQuery.execute(request);
    if (!result.isSuccess) {
        return reply.status(409).send({ error: result.error });
    }

    return reply.status(successStatus).send(result.value);
}

export default async function matchHistoryRoutes(fastify: FastifyInstance) {
    // Get all matches
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
            return handleCommand(getMatchHistoryQuery, request, reply);
        }
    );

    // Get matches for a specific user
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
            return handleCommand(getMatchHistoryQuery, request, reply);
        }
    );

    // Get user statistics
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
            return handleCommand(getUserStatsQuery, request, reply);
        }
    );
}
