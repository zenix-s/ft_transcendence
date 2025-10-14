import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { AddFriendCommand, AddFriendCommandRequest } from './AddFriend.application';

interface AddFriendRequest {
    Body: {
        friendUsername: string;
    };
}

export default async function AddFriendRoute(fastify: FastifyInstance) {
    fastify.post(
        '/',
        {
            schema: {
                description: 'Agrega a un amigo',
                tags: ['FriendshipManager'],
                security: [{ bearerAuth: [] }],
                body: {
                    type: 'object',
                    required: ['friendUsername'],
                    properties: {
                        friendUsername: {
                            type: 'string',
                            description: 'Username del amigo a agregar',
                        },
                    },
                },
                response: {},
            },
        },
        async (request: FastifyRequest<AddFriendRequest>, reply: FastifyReply) => {
            const userId = request.user.id;
            const command = new AddFriendCommand(fastify);

            const commandRequest: AddFriendCommandRequest = {
                userId: userId,
                newFriendUsername: request.body.friendUsername,
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
