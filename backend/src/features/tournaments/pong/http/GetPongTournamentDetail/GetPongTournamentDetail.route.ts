import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { GetPongTournamentDetailCommand } from './GetPongTournamentDetail.command';

interface GetPongTournamentDetailRequest {
    Params: {
        id: number;
    };
}

export default async function GetPongTournamentDetailRoute(fastify: FastifyInstance) {
    fastify.get<GetPongTournamentDetailRequest>(
        '/:id',
        {
            schema: {
                description:
                    'Get detailed information of a specific Pong tournament including bracket and rounds',
                tags: ['Tournament'],
                security: [{ bearerAuth: [] }],
                params: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'number',
                            minimum: 1,
                            description: 'Tournament ID',
                        },
                    },
                    required: ['id'],
                },
                response: {
                    200: {
                        description: 'Pong tournament detail retrieved successfully',
                        type: 'object',
                        properties: {
                            tournament: {
                                type: 'object',
                                properties: {
                                    id: { type: 'number' },
                                    name: { type: 'string' },
                                    matchTypeId: { type: 'number' },
                                    status: {
                                        type: 'string',
                                        enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
                                    },
                                    createdAt: { type: 'string', format: 'date-time' },
                                    isRegistered: { type: 'boolean' },
                                    participants: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                userId: { type: 'number' },
                                                username: { type: 'string' },
                                                status: {
                                                    type: 'string',
                                                    enum: ['registered', 'active', 'eliminated', 'winner'],
                                                },
                                                role: {
                                                    type: 'string',
                                                    enum: ['participant', 'admin', 'admin-participant'],
                                                },
                                                score: { type: 'number' },
                                                isCurrentPlayer: { type: 'boolean' },
                                            },
                                            required: [
                                                'userId',
                                                'username',
                                                'status',
                                                'role',
                                                'score',
                                                'isCurrentPlayer',
                                            ],
                                        },
                                    },
                                    participantCount: { type: 'number' },
                                    matchSettings: {
                                        type: 'object',
                                        properties: {
                                            maxScore: { type: 'number' },
                                            maxGameTime: { type: 'number' },
                                            visualStyle: { type: 'string', enum: ['2d', '3d'] },
                                        },
                                        required: ['maxScore', 'maxGameTime', 'visualStyle'],
                                    },
                                    bracket: {
                                        type: 'object',
                                        properties: {
                                            rounds: {
                                                type: 'array',
                                                items: {
                                                    type: 'object',
                                                    properties: {
                                                        roundNumber: { type: 'number' },
                                                        isComplete: { type: 'boolean' },
                                                        matchups: {
                                                            type: 'array',
                                                            items: {
                                                                type: 'object',
                                                                properties: {
                                                                    player1Id: { type: 'number' },
                                                                    player1Username: { type: 'string' },
                                                                    player2Id: {
                                                                        type: ['number', 'null'],
                                                                        description:
                                                                            'null when playing against AI',
                                                                    },
                                                                    player2Username: {
                                                                        type: ['string', 'null'],
                                                                        description:
                                                                            'null when playing against AI',
                                                                    },
                                                                    isAgainstAI: { type: 'boolean' },
                                                                    winnerId: { type: ['number', 'null'] },
                                                                    winnerUsername: {
                                                                        type: ['string', 'null'],
                                                                    },
                                                                    matchId: { type: ['number', 'null'] },
                                                                    status: {
                                                                        type: 'string',
                                                                        enum: [
                                                                            'pending',
                                                                            'in_progress',
                                                                            'completed',
                                                                        ],
                                                                    },
                                                                },
                                                                required: [
                                                                    'player1Id',
                                                                    'player1Username',
                                                                    'isAgainstAI',
                                                                    'status',
                                                                ],
                                                            },
                                                        },
                                                    },
                                                    required: ['roundNumber', 'isComplete', 'matchups'],
                                                },
                                            },
                                            currentRoundNumber: { type: 'number' },
                                            totalRounds: { type: ['number', 'null'] },
                                            winner: {
                                                type: ['object', 'null'],
                                                properties: {
                                                    userId: { type: 'number' },
                                                    username: { type: 'string' },
                                                },
                                                required: ['userId', 'username'],
                                            },
                                        },
                                        required: ['rounds', 'currentRoundNumber'],
                                    },
                                },
                                required: [
                                    'id',
                                    'name',
                                    'matchTypeId',
                                    'status',
                                    'createdAt',
                                    'isRegistered',
                                    'participants',
                                    'participantCount',
                                    'matchSettings',
                                    'bracket',
                                ],
                            },
                        },
                        required: ['tournament'],
                    },
                    404: {
                        description: 'Tournament not found',
                        type: 'object',
                        properties: {
                            error: { type: 'string' },
                        },
                    },
                    400: {
                        description: 'Invalid tournament ID',
                        type: 'object',
                        properties: {
                            error: { type: 'string' },
                        },
                    },
                    500: {
                        description: 'Internal server error',
                        type: 'object',
                        properties: {
                            error: { type: 'string' },
                        },
                    },
                },
            },
        },
        async (request: FastifyRequest<GetPongTournamentDetailRequest>, reply: FastifyReply) => {
            const command = new GetPongTournamentDetailCommand(fastify);

            const requestData = {
                id: request.params.id,
                userId: request.user.id,
            };

            return fastify.handleCommand({
                command: command,
                request: requestData,
                reply: reply,
                successStatus: 200,
            });
        }
    );
}
