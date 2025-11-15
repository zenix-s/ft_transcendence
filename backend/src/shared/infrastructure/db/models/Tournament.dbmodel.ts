import { TournamentStatus } from '@shared/domain/Entities/Tournament.entity';

export interface TournamentDbModel {
    id: number;
    name: string;
    match_type_id: number;
    status: TournamentStatus;
    start_date: Date;
    end_date?: Date;
    created_at: Date;
}
