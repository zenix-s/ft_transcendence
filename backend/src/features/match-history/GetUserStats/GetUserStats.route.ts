import { FastifyInstance } from 'fastify/types/instance';
import { FastifyReply } from 'fastify/types/reply';
import { FastifyRequest } from 'fastify/types/request';
import GetUserStatsQuery from './GetUserStats.application';

interface UserStatsRequest {
    Params: {
        userId: string;
    };
}

export default async function GetUserStatsRoute(fastify: FastifyInstance) {
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
