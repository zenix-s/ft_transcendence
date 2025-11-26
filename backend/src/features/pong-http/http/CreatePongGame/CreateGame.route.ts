import { FastifyInstance } from 'fastify/types/instance';
import { FastifyReply } from 'fastify/types/reply';
import CreateGameCommand from './CreateGame.command';
import { FastifyRequest } from 'fastify/types/request';

interface CreateGameRequest {
    Body: {
        winnerScore?: number;
        maxGameTime?: number;
        visualStyle?: string;
    };
}

export default async function CreateGameRoute(fastify: FastifyInstance) {
    fastify.post(
        '/create',
        {
            schema: {
                description: 'Create a new Pong game with optional custom rules',
                tags: ['Game'],
                security: [{ bearerAuth: [] }],
                body: {
                    type: 'object',
                    properties: {
                        winnerScore: {
                            type: 'number',
                            description: 'Score required to win the game (1-100)',
                            default: 5,
                            minimum: 1,
                            maximum: 100,
                        },
                        maxGameTime: {
                            type: 'number',
                            description: 'Maximum game duration in seconds (30-3600)',
                            default: 120,
                            minimum: 30,
                            maximum: 3600,
                        },
                        visualStyle: {
                            type: 'string',
                            description: 'Visual style of the game',
                            enum: ['2d', '3d'],
                            default: '2d',
                        },
                    },
                },
                response: {
                    201: {
                        description: 'Game created successfully',
                        type: 'object',
                        properties: {
                            message: { type: 'string' },
                            gameId: { type: 'number' },
                        },
                    },
                    400: {
                        description: 'Invalid request parameters',
                        type: 'object',
                        properties: {
                            error: { type: 'string' },
                        },
                    },
                },
            },
        },
        async (req: FastifyRequest<CreateGameRequest>, reply: FastifyReply) => {
            const createGameCommand = new CreateGameCommand(fastify);
            const userId = req.user?.id;
            const request = {
                winnerScore: req.body?.winnerScore,
                maxGameTime: req.body?.maxGameTime,
                visualStyle: req.body?.visualStyle,
                userId: userId,
            };

            return fastify.handleCommand({
                command: createGameCommand,
                request: request,
                reply: reply,
                successStatus: 201,
            });
        }
    );
}
