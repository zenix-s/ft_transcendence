export interface TournamentMatchUps {
    player1Id: number;
    player1Username: string;
    player2Id: number | null; // null si es contra IA
    player2Username: string | null; // null si es contra IA
    isAgainstAI: boolean;
    winnerId: number | null; // null si no hay ganador aún, si es empate o si es contra IA
    winnerUsername: string | null; // null si no hay ganador aún, si es empate o si es contra IA
    matchId: number | null; // null si no se ha creado el match aún
    status: 'pending' | 'in_progress' | 'completed';
}

export interface TournamentUser {
    userId: number;
    username: string;
}

export interface TournamentRound {
    roundNumber: number;
    isComplete: boolean;
    matchups: TournamentMatchUps[];
}

export interface TournamentBracket {
    rounds: TournamentRound[];
    currentRoundNumber: number;
    totalRounds: number | null; // null si no se ha definido aún
    winner: TournamentUser | null; // null si no hay ganador aún
}

export interface TournamentMatchSettings {
    maxScore: number;
    maxGameTime: number;
    visualStyle: string;
}

export interface TournamentParticipant {
    userId: number;
    username: string;
    status: 'registered' | 'active' | 'eliminated' | 'winner';
    role: 'participant' | 'admin' | 'admin-participant';
    score: number;
    isCurrentPlayer: boolean;
}

export interface ActiveTournament {
    id: number;
    name: string;
    matchTypeId: number;
    status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
    createdAt: string;
    isRegistered: boolean;
    participants: TournamentParticipant[];
    participantCount: number;
    matchSettings: TournamentMatchSettings;
    bracket: TournamentBracket;
    error?: string;
}
