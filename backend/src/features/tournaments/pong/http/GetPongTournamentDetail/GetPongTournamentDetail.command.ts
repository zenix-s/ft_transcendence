import { Result } from '@shared/abstractions/Result';
import { ICommand } from '@shared/application/abstractions/ICommand.interface';
import { ApplicationError } from '@shared/Errors';
import { FastifyInstance } from 'fastify';
import { TournamentParticipant } from '@shared/domain/Entities/TournamentParticipant.entity';
import { PongTournamentAggregate } from '../../services/IPongTournamentManager';
import { ITournamentMatchup } from '@shared/domain/Entities/TournamentRound.entity';

export interface TournamentParticipantResponse {
    userId: number;
    username: string;
    status: string;
    role: string;
    score: number;
    isCurrentPlayer: boolean;
}

export interface TournamentMatchupResponse {
    player1Id: number;
    player1Username?: string;
    player2Id?: number;
    player2Username?: string;
    isAgainstAI: boolean;
    winnerId?: number;
    winnerUsername?: string;
    matchId?: number;
    status: string;
}

export interface TournamentRoundResponse {
    roundNumber: number;
    isComplete: boolean;
    matchups: TournamentMatchupResponse[];
}

export interface TournamentBracketResponse {
    rounds: TournamentRoundResponse[];
    currentRoundNumber: number;
    totalRounds?: number;
    winner?: {
        userId: number;
        username?: string;
    };
}

export interface TournamentDetailResponse {
    id: number;
    name: string;
    matchTypeId: number;
    status: string;
    createdAt: string;
    isRegistered: boolean;
    participants: TournamentParticipantResponse[];
    participantCount: number;
    matchSettings: {
        maxScore: number;
        maxGameTime: number;
        visualStyle: string;
    };
    bracket: TournamentBracketResponse;
}

export interface IGetPongTournamentDetailRequest {
    id: number;
    userId: number;
}

export interface IGetPongTournamentDetailResponse {
    tournament: TournamentDetailResponse | null;
}

export class GetPongTournamentDetailCommand implements ICommand<
    IGetPongTournamentDetailRequest,
    IGetPongTournamentDetailResponse
> {
    constructor(private readonly fastify: FastifyInstance) {}

    validate(request?: IGetPongTournamentDetailRequest | undefined): Result<void> {
        if (!request) return Result.error(ApplicationError.InvalidRequest);

        // Validar que el ID esté presente y sea un número válido
        if (!request.id || typeof request.id !== 'number' || request.id <= 0) {
            return Result.error(ApplicationError.InvalidRequest);
        }

        return Result.success(undefined);
    }

    private participantToResponse(
        participant: TournamentParticipant,
        currentUserId: number
    ): TournamentParticipantResponse {
        return {
            userId: participant.userId,
            username: participant.username || `Player ${participant.userId}`,
            status: participant.status,
            role: participant.role,
            score: participant.score,
            isCurrentPlayer: participant.userId === currentUserId,
        };
    }

    private findParticipantUsername(participants: TournamentParticipant[], userId: number): string {
        const participant = participants.find((p) => p.userId === userId);
        return participant?.username || `Player ${userId}`;
    }

    private matchupToResponse(
        matchup: ITournamentMatchup,
        participants: TournamentParticipant[]
    ): TournamentMatchupResponse {
        const player1Username = this.findParticipantUsername(participants, matchup.player1Id);
        const player2Username = matchup.player2Id
            ? this.findParticipantUsername(participants, matchup.player2Id)
            : undefined;
        const winnerUsername = matchup.winnerId
            ? this.findParticipantUsername(participants, matchup.winnerId)
            : undefined;

        return {
            player1Id: matchup.player1Id,
            player1Username,
            player2Id: matchup.player2Id,
            player2Username,
            isAgainstAI: matchup.player2Id === undefined,
            winnerId: matchup.winnerId,
            winnerUsername,
            matchId: matchup.matchId,
            status: matchup.status,
        };
    }

    private calculateTotalRounds(initialParticipants: number): number {
        if (initialParticipants <= 1) return 0;
        return Math.ceil(Math.log2(initialParticipants));
    }

    private buildBracketResponse(aggregate: PongTournamentAggregate): TournamentBracketResponse {
        const tournament = aggregate.tournament;
        const rounds = tournament.rounds;
        const participants = tournament.participants;

        // Convertir rondas a formato de respuesta
        const roundsResponse: TournamentRoundResponse[] = rounds.map((round) => ({
            roundNumber: round.roundNumber,
            isComplete: round.isComplete,
            matchups: round.matchups.map((matchup) => this.matchupToResponse(matchup, participants)),
        }));

        // Buscar ganador
        const winner = participants.find((p) => p.isWinner());
        const winnerResponse = winner
            ? {
                  userId: winner.userId,
                  username: winner.username || `Player ${winner.userId}`,
              }
            : undefined;

        // Calcular número total de rondas esperadas
        const activeParticipants = participants.filter(
            (p) =>
                p.status === TournamentParticipant.STATUS.ACTIVE ||
                p.status === TournamentParticipant.STATUS.WINNER
        );
        const totalRounds =
            tournament.status === 'upcoming'
                ? this.calculateTotalRounds(participants.length)
                : this.calculateTotalRounds(
                      activeParticipants.length + participants.filter((p) => p.isEliminated()).length
                  );

        return {
            rounds: roundsResponse,
            currentRoundNumber: tournament.currentRoundNumber,
            totalRounds,
            winner: winnerResponse,
        };
    }

    private async tournamentToDetailResponse(
        aggregate: PongTournamentAggregate,
        currentUserId: number
    ): Promise<TournamentDetailResponse> {
        if (!aggregate.tournament.id) {
            throw new Error('Tournament ID is required');
        }

        const participantsResponse = aggregate.tournament.participants.map((participant) =>
            this.participantToResponse(participant, currentUserId)
        );

        const bracketResponse = this.buildBracketResponse(aggregate);

        return {
            id: aggregate.tournament.id,
            name: aggregate.tournament.name,
            matchTypeId: aggregate.tournament.matchTypeId,
            status: aggregate.tournament.status,
            createdAt: aggregate.tournament.createdAt.toISOString(),
            isRegistered: aggregate.isRegistered,
            participants: participantsResponse,
            participantCount: aggregate.tournament.participantCount,
            matchSettings: aggregate.tournament.matchSettings.toObject(),
            bracket: bracketResponse,
        };
    }

    async execute(
        request?: IGetPongTournamentDetailRequest | undefined
    ): Promise<Result<IGetPongTournamentDetailResponse>> {
        try {
            // Paso 1: Validar que la solicitud
            if (!request) return Result.error(ApplicationError.BadRequest);

            // Paso 2: Obtener tournament por ID usando el PongTournamentManager
            const tournamentResult = await this.fastify.PongTournamentManager.getTournamentById({
                id: request.id,
                userId: request.userId,
            });

            // Paso 3: Manejar el resultado de la consulta
            if (!tournamentResult.isSuccess) {
                return Result.error(tournamentResult.error || ApplicationError.TournamentNotFound);
            }

            // Paso 4: Transformar entidad de dominio a interfaz de respuesta
            const tournament = tournamentResult.value;
            const tournamentResponse = tournament
                ? await this.tournamentToDetailResponse(tournament, request.userId)
                : null;

            return Result.success({
                tournament: tournamentResponse,
            });
        } catch (error: unknown) {
            return this.fastify.handleError<IGetPongTournamentDetailResponse>({
                code: ApplicationError.InternalServerError,
                error,
            });
        }
    }
}
