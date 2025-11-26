import { FastifyInstance } from 'fastify/types/instance';
import { FastifyReply } from 'fastify/types/reply';
import { FastifyRequest } from 'fastify/types/request';
import CreateSinglePlayerGameCommand from './CreateSinglePlayerGame.command';

interface CreateSinglePlayerGameRequest {
    Body: {
        winnerScore?: number;
        maxGameTime?: number;
        aiDifficulty?: number;
        visualStyle?: string;
    };
}

export default function CreatePongSinglePlayerGameRoute(fastify: FastifyInstance) {
    fastify.post(
        '/create-singleplayer',
        {
            schema: {
                description: 'Create a new single-player Pong game against AI',
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
                        aiDifficulty: {
                            type: 'number',
                            description: 'AI difficulty level (0-1, where 1 is perfect tracking)',
                            default: 0.95,
                            minimum: 0,
                            maximum: 1,
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
                        description: 'Single-player game created successfully',
                        type: 'object',
                        properties: {
                            message: { type: 'string' },
                            gameId: { type: 'number' },
                            mode: { type: 'string' },
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
        async (req: FastifyRequest<CreateSinglePlayerGameRequest>, reply: FastifyReply) => {
            const createSinglePlayerGameCommand = new CreateSinglePlayerGameCommand(fastify);
            const userId = req.user?.id;
            const request = {
                winnerScore: req.body?.winnerScore,
                maxGameTime: req.body?.maxGameTime,
                aiDifficulty: req.body?.aiDifficulty,
                visualStyle: req.body?.visualStyle,
                userId: userId,
            };

            return fastify.handleCommand({
                command: createSinglePlayerGameCommand,
                request: request,
                reply: reply,
                successStatus: 201,
            });
        }
    );
}
