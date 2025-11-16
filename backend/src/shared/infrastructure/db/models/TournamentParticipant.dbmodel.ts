import { TournamentParticipantStatus } from '@shared/domain/Entities/TournamentParticipant.entity';

export interface TournamentParticipantDbModel {
    id: number;
    tournament_id: number;
    user_id: number;
    status: TournamentParticipantStatus;
    score: number;
}
