import { TournamentStatus } from '@shared/domain/Entities/Tournament.entity';

export interface TournamentDbModel {
    id: number;
    name: string;
    match_type_id: number;
    status: TournamentStatus;
    match_settings: string;
    created_at: string;
    max_matches_per_pair: number;
    rounds_data: string;
    current_round_number: number;
}
