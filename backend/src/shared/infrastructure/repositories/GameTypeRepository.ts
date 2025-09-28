import { GameType } from '@shared/domain/types/game.types';
import { GameTypeRow } from '@shared/infrastructure/db/types';
import { AbstractRepository } from '@shared/infrastructure/db/AbstractRepository';

export class GameTypeRepository extends AbstractRepository {
    async findByName(name: string): Promise<GameType | null> {
        const result = await this.findOne<GameTypeRow>('SELECT * FROM game_types WHERE name = ?', [name]);
        return result;
    }
}
