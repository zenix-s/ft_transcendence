import { FastifyRequest } from 'fastify/types/request';
import JoinGameCommand from './JoinGame.command';
import { FastifyReply } from 'fastify/types/reply';
import { FastifyInstance } from 'fastify/types/instance';

interface JoinGameRequest {
    Params: {
        gameId: string;
    };
}

export default async function JoinPongGameRoute(fastify: FastifyInstance) {
    fastify.post(
        '/join/:gameId',
        {
            schema: {
                description: 'Join an existing Pong game',
                tags: ['Game'],
                security: [{ bearerAuth: [] }],
                params: {
                    type: 'object',
                    properties: {
                        gameId: { type: 'string', description: 'Numeric game ID as string in URL' },
                    },
                },
                response: {
                    200: {
                        description: 'Successfully joined game',
                        type: 'object',
                        properties: {
                            message: { type: 'string' },
                            userId: { type: 'number' },
                            gameId: { type: 'number' },
                            alreadyJoined: { type: 'boolean' },
                        },
                    },
                    400: {
                        description: 'Invalid request',
                        type: 'object',
                        properties: {
                            error: { type: 'string' },
                        },
                    },
                },
            },
        },
        async (req: FastifyRequest<JoinGameRequest>, reply: FastifyReply) => {
            const request = {
                gameId: parseInt(req.params.gameId),
                userId: req.user?.id,
            };
            const joinGameCommand = new JoinGameCommand(fastify);

            return fastify.handleCommand({
                command: joinGameCommand,
                request: request,
                reply: reply,
                successStatus: 200,
            });
        }
    );
}
