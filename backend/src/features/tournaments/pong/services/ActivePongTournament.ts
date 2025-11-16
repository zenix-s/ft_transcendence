import { Result } from '@shared/abstractions/Result';
import { Tournament } from '@shared/domain/Entities/Tournament.entity';
import MatchType from '@shared/domain/ValueObjects/MatchType.value';
import { ApplicationError } from '@shared/Errors';
import { FastifyInstance } from 'fastify';

export class ActivePongTournament {
    private tournamentId: number | null;

    constructor(private readonly fastify: FastifyInstance) {
        this.tournamentId = null;
    }

    async initialize({ name }: { name: string }): Promise<Result<number>> {
        const createResult = await this.fastify.TournamentRepository.createTournament({
            tournament: Tournament.create({
                name: name,
                matchTypeId: MatchType.PONG.id, // Esto debe añadirse PongTournament
                createdAt: new Date(),
            }),
        });

        if (!createResult.isSuccess || !createResult.value) {
            return Result.failure(createResult.error || ApplicationError.InsertionError);
        }

        this.tournamentId = createResult.value;

        return Result.success(this.tournamentId);
    }
}
