import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { RemoveFriendCommand } from './RemoveFriend.application';

interface RemoveFriendRequest {
    Params: {
        friendUsername: string;
    };
}

export default async function RemoveFriendRoute(fastify: FastifyInstance) {
    fastify.delete(
        '/:friendUsername',
        {
            schema: {
                description: 'Elimina a un amigo',
                tags: ['FriendshipManager'],
                security: [{ bearerAuth: [] }],
                params: {
                    type: 'object',
                    required: ['friendUsername'],
                    properties: {
                        friendUsername: {
                            type: 'string',
                            description: 'Username del amigo a eliminar',
                        },
                    },
                },
                response: {},
            },
        },
        async (request: FastifyRequest<RemoveFriendRequest>, reply: FastifyReply) => {
            const userId = request.user.id;
            const command = new RemoveFriendCommand(fastify);

            const commandRequest = {
                userId: userId,
                friendUsername: request.params.friendUsername,
            };

            return fastify.handleCommand({
                command,
                reply,
                request: commandRequest,
                successStatus: 200,
            });
        }
    );
}
