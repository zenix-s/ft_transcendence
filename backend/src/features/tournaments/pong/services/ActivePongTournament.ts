import { Result } from '@shared/abstractions/Result';
import { FastifyInstance } from 'fastify';
import { ApplicationError } from '@shared/Errors';
import { Tournament } from '@shared/domain/Entities/Tournament.entity';
import { TournamentParticipant } from '@shared/domain/Entities/TournamentParticipant.entity';
import { IMatchSettings } from '@shared/domain/ValueObjects/MatchSettings.value';
import { Match } from '@shared/domain/Entities/Match.entity';
import { PongGame } from '@features/pong-game-manager/domain/PongGame';
import { TournamentRound, ITournamentMatchup } from '@shared/domain/Entities/TournamentRound.entity';

export class ActivePongTournament {
    private tournamentId!: number;

    constructor(private readonly fastify: FastifyInstance) {}

    async initialize({
        name,
        creatorUserId,
        matchSettings,
    }: {
        name: string;
        creatorUserId: number;
        matchSettings?: IMatchSettings;
    }): Promise<Result<number>> {
        try {
            // Paso 1: Crear la entidad del torneo
            const tournamentEntity = Tournament.create({
                name,
                matchTypeId: 1, // Pong
                createdAt: new Date(),
                matchSettings,
            });

            // Paso 2: Guardar el torneo en la base de datos
            const createResult = await this.fastify.TournamentRepository.createTournament({
                tournament: tournamentEntity,
            });

            if (!createResult.isSuccess || !createResult.value) {
                return Result.error(createResult.error || ApplicationError.TournamentCreationError);
            }

            this.tournamentId = createResult.value;
            tournamentEntity.setId(this.tournamentId);

            // Paso 3: Añadir al creador como admin-participant
            const creatorParticipant = TournamentParticipant.create({
                tournamentId: this.tournamentId,
                userId: creatorUserId,
                role: TournamentParticipant.ROLE.ADMIN_PARTICIPANT,
            });

            const addSuccess = tournamentEntity.addParticipant(creatorParticipant);
            if (!addSuccess) {
                return Result.error(ApplicationError.ParticipantAdditionError);
            }

            // Paso 4: Actualizar el torneo con el creador
            const updateResult = await this.fastify.TournamentRepository.update({
                tournament: tournamentEntity,
            });

            if (!updateResult.isSuccess || !updateResult.value) {
                return Result.error(updateResult.error || ApplicationError.TournamentCreationError);
            }

            return Result.success(this.tournamentId);
        } catch (error) {
            return this.fastify.handleError({
                code: ApplicationError.TournamentCreationError,
                error,
            });
        }
    }

    async addParticipant({ userId }: { userId: number }): Promise<Result<void>> {
        try {
            // Paso 1: Obtener el torneo
            const tournamentResult = await this.fastify.TournamentRepository.findById({
                id: this.tournamentId,
            });

            if (!tournamentResult.isSuccess || !tournamentResult.value) {
                return Result.error(ApplicationError.TournamentNotFound);
            }

            const tournament = tournamentResult.value;

            // Paso 2: Verificar que el torneo esté en estado UPCOMING
            if (tournament.status !== Tournament.STATUS.UPCOMING) {
                return Result.error(ApplicationError.TournamentStartError);
            }

            // Paso 3: Verificar si el usuario ya está registrado
            const existingParticipant = tournament.getParticipant(userId);
            if (existingParticipant) {
                return Result.error(ApplicationError.ParticipantAlreadyExists);
            }

            // Paso 4: Crear el participante
            const participant = TournamentParticipant.create({
                tournamentId: this.tournamentId,
                userId,
                role: TournamentParticipant.ROLE.PARTICIPANT,
            });

            const addSuccess = tournament.addParticipant(participant);
            if (!addSuccess) {
                return Result.error(ApplicationError.ParticipantAdditionError);
            }

            // Paso 5: Actualizar el torneo
            const updateResult = await this.fastify.TournamentRepository.update({
                tournament,
            });

            if (!updateResult.isSuccess) {
                return Result.error(updateResult.error || ApplicationError.ParticipantAdditionError);
            }

            return Result.success(undefined);
        } catch (error) {
            return this.fastify.handleError({
                code: ApplicationError.ParticipantAdditionError,
                error,
            });
        }
    }

    getTournamentId(): number {
        return this.tournamentId;
    }

    async startTournament({ userId }: { userId: number }): Promise<Result<void>> {
        try {
            // Paso 1: Obtener el torneo
            const tournamentResult = await this.fastify.TournamentRepository.findById({
                id: this.tournamentId,
            });

            if (!tournamentResult.isSuccess || !tournamentResult.value) {
                return Result.error(ApplicationError.TournamentNotFound);
            }

            const tournament = tournamentResult.value;

            // Paso 2: Verificar que el usuario es admin
            const participant = tournament.getParticipant(userId);
            if (!participant || !participant.isAdmin()) {
                return Result.error(ApplicationError.UnauthorizedAccess);
            }

            // Paso 3: Verificar que hay al menos 2 participantes
            if (tournament.participants.length < 2) {
                return Result.error(ApplicationError.TournamentStartError);
            }

            // Paso 4: Iniciar el torneo
            const started = tournament.start();
            if (!started) {
                return Result.error(ApplicationError.TournamentStartError);
            }

            // Paso 5: Crear la primera ronda
            const firstRound = tournament.createNextRound();
            if (!firstRound) {
                return Result.error(ApplicationError.TournamentStartError);
            }

            // Paso 6: Actualizar el torneo
            const updateResult = await this.fastify.TournamentRepository.update({
                tournament,
            });

            if (!updateResult.isSuccess) {
                return Result.error(updateResult.error || ApplicationError.TournamentStartError);
            }

            // Paso 7: Notificar por websocket que el torneo ha comenzado
            if (this.fastify.TournamentWebSocketService?.notifyTournamentStarted) {
                this.fastify.TournamentWebSocketService.notifyTournamentStarted(this.tournamentId);
            }

            // Paso 8: Crear todos los matches de la primera ronda
            await this.createRoundMatches(tournament, firstRound);

            return Result.success(undefined);
        } catch (error) {
            return this.fastify.handleError({
                code: ApplicationError.TournamentStartError,
                error,
            });
        }
    }

    private async createRoundMatches(tournament: Tournament, round: TournamentRound): Promise<void> {
        const matchups = round.matchups;

        for (const matchup of matchups) {
            await this.createMatch(tournament, round, matchup);
        }
    }

    private async createMatch(
        tournament: Tournament,
        round: TournamentRound,
        matchup: ITournamentMatchup
    ): Promise<void> {
        try {
            const { player1Id, player2Id } = matchup;

            // Determinar si es contra IA
            const isAgainstAI = player2Id === undefined;
            const playerIds = isAgainstAI ? [player1Id] : [player1Id, player2Id];

            // Paso 1: Crear el Match
            const matchEntity = new Match(tournament.matchTypeId, playerIds);

            const match = await this.fastify.MatchRepository.create({ match: matchEntity });
            if (!match || !match.id) {
                this.fastify.log.error(`Failed to create match for round ${round.roundNumber}`);
                return;
            }

            const matchId = match.id;

            // Paso 2: Actualizar el matchup con el matchId
            round.updateMatchupStatus(player1Id, 'in_progress', matchId);

            // Paso 3: Crear el PongGame
            const matchSettingsObj = tournament.matchSettings.toObject();
            const pongGame = new PongGame(
                matchSettingsObj.maxScore || 5,
                matchSettingsObj.maxGameTime || 120,
                isAgainstAI,
                isAgainstAI ? 0.95 : 0.95 // Dificultad máxima para AI
            );

            // Paso 4: Callback para cuando termine la partida
            const onMatchEnd = async (mId: number, winnerId: number, loserId: number) => {
                await this.handleMatchResult(round.roundNumber, matchup, winnerId, loserId);
            };

            // Paso 5: Crear el juego de torneo
            const createGameResult = await this.fastify.PongGameManager.createTournamentMatch(
                matchId,
                pongGame,
                onMatchEnd
            );

            if (!createGameResult.isSuccess) {
                this.fastify.log.error(`Failed to create tournament match: ${createGameResult.error}`);
                return;
            }

            // Paso 6: Notificar a los jugadores por websocket
            if (this.fastify.TournamentWebSocketService?.notifyMatchCreated) {
                this.fastify.TournamentWebSocketService.notifyMatchCreated(
                    this.tournamentId,
                    player1Id,
                    matchId,
                    player2Id || null,
                    isAgainstAI,
                    round.roundNumber
                );

                if (player2Id) {
                    this.fastify.TournamentWebSocketService.notifyMatchCreated(
                        this.tournamentId,
                        player2Id,
                        matchId,
                        player1Id,
                        false,
                        round.roundNumber
                    );
                }
            }

            // Paso 7: Actualizar el torneo en la base de datos
            await this.fastify.TournamentRepository.update({ tournament });
        } catch (error) {
            this.fastify.log.error(error, 'Error creating match for tournament round');
        }
    }

    private async handleMatchResult(
        roundNumber: number,
        matchup: ITournamentMatchup,
        winnerId: number,
        loserId: number
    ): Promise<void> {
        try {
            // Paso 1: Obtener el torneo
            const tournamentResult = await this.fastify.TournamentRepository.findById({
                id: this.tournamentId,
            });

            if (!tournamentResult.isSuccess || !tournamentResult.value) {
                this.fastify.log.error(`Tournament with ID ${this.tournamentId} not found`);
                return;
            }

            const tournament = tournamentResult.value;
            const currentRound = tournament.getCurrentRound();

            if (!currentRound) {
                this.fastify.log.error(`No current round found for tournament ${this.tournamentId}`);
                return;
            }

            // Paso 2: Actualizar el matchup con el ganador
            currentRound.setMatchupWinner(matchup.player1Id, winnerId);

            // Paso 3: Eliminar al perdedor
            const loserParticipant = tournament.getParticipant(loserId);
            if (loserParticipant) {
                loserParticipant.eliminate();
            }

            // Paso 4: Actualizar el torneo
            await this.fastify.TournamentRepository.update({ tournament });

            // Paso 5: Notificar el resultado por websocket
            if (this.fastify.TournamentWebSocketService?.notifyMatchResult && matchup.matchId) {
                this.fastify.TournamentWebSocketService.notifyMatchResult(
                    this.tournamentId,
                    matchup.matchId,
                    winnerId,
                    loserId
                );
            }

            // Paso 6: Verificar si la ronda ha terminado
            if (currentRound.isComplete) {
                await this.onRoundComplete(tournament);
            }
        } catch (error) {
            this.fastify.log.error(error, `Error handling match result for tournament ${this.tournamentId}`);
        }
    }

    private async onRoundComplete(tournament: Tournament): Promise<void> {
        try {
            const activeParticipants = tournament.getActiveParticipants();

            // Paso 1: Verificar si solo queda un ganador
            if (activeParticipants.length === 1) {
                const winner = activeParticipants[0];
                winner.setAsWinner();

                tournament.complete();

                await this.fastify.TournamentRepository.update({ tournament });

                // Notificar que el torneo ha terminado
                if (this.fastify.TournamentWebSocketService?.notifyTournamentEnded) {
                    this.fastify.TournamentWebSocketService.notifyTournamentEnded(this.tournamentId);
                }

                // Notificar al ganador
                if (this.fastify.TournamentWebSocketService?.notifyTournamentWon) {
                    this.fastify.TournamentWebSocketService.notifyTournamentWon(
                        this.tournamentId,
                        winner.userId
                    );
                }

                return;
            }

            // Paso 2: Crear la siguiente ronda
            const nextRound = tournament.createNextRound();
            if (!nextRound) {
                this.fastify.log.error(`Failed to create next round for tournament ${this.tournamentId}`);
                return;
            }

            await this.fastify.TournamentRepository.update({ tournament });

            // Paso 3: Notificar que comienza una nueva ronda
            if (this.fastify.TournamentWebSocketService?.notifyNewRoundStarted) {
                this.fastify.TournamentWebSocketService.notifyNewRoundStarted(
                    this.tournamentId,
                    nextRound.roundNumber
                );
            }

            // Paso 4: Crear todos los matches de la nueva ronda
            await this.createRoundMatches(tournament, nextRound);
        } catch (error) {
            this.fastify.log.error(error, `Error completing round for tournament ${this.tournamentId}`);
        }
    }
}
