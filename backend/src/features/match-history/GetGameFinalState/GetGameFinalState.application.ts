import { FastifyInstance } from 'fastify';
import { Result } from '@shared/abstractions/Result';
import { IQuery } from '@shared/application/abstractions/IQuery.interface';
import { ApplicationError } from '@shared/Errors';
import { IMatchRepository } from '@shared/infrastructure/repositories/MatchRepository';
import { Match, MatchStatus } from '@shared/domain/Entities/Match.entity';
import { CONSTANTES_APP } from '@shared/constants/ApplicationConstants';

export interface IGetGameFinalStateRequest {
    gameId: number;
}

export interface IGetGameFinalStateResponse {
    gameId: number;
    match: {
        id: number;
        status: MatchStatus;
        startedAt?: Date;
        endedAt?: Date;
        duration?: number; // in seconds
        gameRules: {
            winnerScore: number;
            maxGameTime?: number;
        };
        players: {
            userId: number;
            username: string | null;
            score: number;
            isWinner: boolean;
        }[];
        winner: {
            userId: number;
            username: string | null;
            score: number;
        } | null;
        finalState: {
            isGameOver: boolean;
            isCancelled: boolean;
            gameTimer: number;
            finalScores: {
                player1: number;
                player2: number;
            };
            isSinglePlayer: boolean;
        };
    };
}

export default class GetGameFinalStateQuery
    implements IQuery<IGetGameFinalStateRequest, IGetGameFinalStateResponse>
{
    private readonly matchRepository: IMatchRepository;

    constructor(private readonly fastify: FastifyInstance) {
        this.matchRepository = this.fastify.MatchRepository;
    }

    validate(request?: IGetGameFinalStateRequest): Result<void> {
        if (!request) {
            return Result.error(ApplicationError.BadRequest);
        }

        if (!request.gameId || typeof request.gameId !== 'number') {
            return Result.error(ApplicationError.InvalidRequest);
        }

        return Result.success(undefined);
    }

    async execute(request?: IGetGameFinalStateRequest): Promise<Result<IGetGameFinalStateResponse>> {
        if (!request) return Result.error(ApplicationError.BadRequest);

        try {
            const { gameId } = request;

            // Buscar la partida por ID
            const match = await this.matchRepository.findById({ id: gameId });
            if (!match) {
                return Result.error(ApplicationError.MatchNotFound);
            }

            // Verificar que la partida haya terminado
            if (match.status !== Match.STATUS.COMPLETED && match.status !== Match.STATUS.CANCELLED) {
                return Result.error(ApplicationError.MatchInProgress);
            }

            // Construir la respuesta con el estado final
            const finalState = this.buildFinalState(match);

            return Result.success(finalState);
        } catch (error) {
            return this.fastify.handleError<IGetGameFinalStateResponse>({
                code: ApplicationError.InternalServerError,
                error,
            });
        }
    }

    private buildFinalState(match: Match): IGetGameFinalStateResponse {
        const players = match.players;
        const isCompleted = match.status === Match.STATUS.COMPLETED;
        const isCancelled = match.status === Match.STATUS.CANCELLED;

        // Calcular duración del juego
        let duration = 0;
        if (match.startedAt && match.endedAt) {
            duration = (new Date(match.endedAt).getTime() - new Date(match.startedAt).getTime()) / 1000;
        }

        // Encontrar ganador
        const winner = players.find((p) => p.isWinner);

        // Ordenar jugadores por userId para consistencia
        const sortedPlayers = [...players].sort((a, b) => a.userId - b.userId);
        const player1 = sortedPlayers[0];
        const player2 = sortedPlayers[1];

        // Determinar si es single player (si el jugador 2 tiene userId = 1, es AI)
        const isSinglePlayer = player2?.userId === CONSTANTES_APP.AI_PLAYER.ID;

        // Inferir reglas del juego
        const gameRules = this.inferGameRules(players);

        return {
            gameId: match.id || 0,
            match: {
                id: match.id || 0,
                status: match.status,
                startedAt: match.startedAt,
                endedAt: match.endedAt,
                duration: duration,
                gameRules: gameRules,
                players: players,
                winner: winner
                    ? {
                          userId: winner.userId,
                          username: winner.username,
                          score: winner.score,
                      }
                    : null,
                finalState: {
                    isGameOver: isCompleted || isCancelled,
                    isCancelled: isCancelled,
                    gameTimer: duration,
                    finalScores: {
                        player1: player1?.score || 0,
                        player2: player2?.score || 0,
                    },
                    isSinglePlayer: isSinglePlayer,
                },
            },
        };
    }

    private inferGameRules(
        players: { userId: number; username: string | null; score: number; isWinner: boolean }[]
    ): { winnerScore: number; maxGameTime?: number } {
        const maxScore = Math.max(...players.map((p) => p.score || 0));

        // Valores comunes para juegos de pong
        const commonTargets = [5, 10, 15, 21];

        let winnerScore = 5; // default

        if (maxScore > 0) {
            // Si coincide con un objetivo común
            if (commonTargets.includes(maxScore)) {
                winnerScore = maxScore;
            } else {
                // Encontrar el objetivo más cercano por encima
                const target = commonTargets.find((t) => t > maxScore);
                winnerScore = target || maxScore;
            }
        }

        return {
            winnerScore,
            maxGameTime: undefined, // No podemos inferir el tiempo límite del historial
        };
    }
}
