import { GameType } from '@shared/domain/types/game.types';
import { GameTypeRow } from '@shared/infrastructure/types/types';
import { AbstractRepository } from '@shared/infrastructure/db/AbstractRepository';
import { FastifyInstance } from 'fastify/types/instance';
import fp from 'fastify-plugin';

export interface IGameTypeRepository {
    findByName({ name }: { name: string }): Promise<GameType | null>;
    findById({ id }: { id: number }): Promise<GameType | null>;
}

class GameTypeRepository extends AbstractRepository implements IGameTypeRepository {
    async findByName({ name }: { name: string }): Promise<GameType | null> {
        const result = await this.findOne<GameTypeRow>('SELECT * FROM game_types WHERE name = ?', [name]);
        if (!result) {
            return null;
        }

        return {
            ...result,
            supports_invitations: result.supports_invitations === 1,
        };
    }

    async findById({ id }: { id: number }): Promise<GameType | null> {
        const result = await this.findOne<GameTypeRow>('SELECT * FROM game_types WHERE id = ?', [id]);
        if (!result) {
            return null;
        }

        return {
            ...result,
            supports_invitations: result.supports_invitations === 1,
        };
    }
}

export default fp(
    (fastify: FastifyInstance) => {
        const repo = new GameTypeRepository(fastify.DbConnection);
        fastify.decorate('GameTypeRepository', repo);
    },
    {
        name: 'GameTypeRepository',
        dependencies: ['DbConnection'],
    }
);
