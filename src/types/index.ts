export type ParticipantStatus = 'undefeated' | 'lower-bracket' | 'eliminated';
export type Bracket = 'winners' | 'losers';
export type TournamentStatus = 'pending' | 'active' | 'completed';

export interface Participant {
  id: string;
  name: string;
  seed: number;
  wins: number;
  losses: number;
  status: ParticipantStatus;
  eliminatedInRound?: number;
}

export interface Match {
  id: string;
  round: number;
  bracket: Bracket;
  position: number;
  participant1Id: string | null;
  participant2Id: string | null;
  winnerId: string | null;
  loserId: string | null;
  winnerNextMatchId: string | null;
  loserNextMatchId: string | null;
  completed: boolean;
  bye: boolean;
}

export interface Tournament {
  id: string;
  name: string;
  participants: Participant[];
  matches: Match[];
  currentRound: number;
  status: TournamentStatus;
  createdAt: number;
  updatedAt: number;
  championId: string | null;
  secondPlaceId: string | null;
  loserIds: string[];
  grandFinalMatchId: string | null;
  grandFinalResetMatchId: string | null;
  losersToFind: 1 | 2;
}

export interface TournamentSummary {
  id: string;
  name: string;
  status: TournamentStatus;
  participantCount: number;
  undefeatedCount: number;
  lowerBracketCount: number;
  eliminatedCount: number;
  createdAt: number;
}

export interface TournamentStore {
  tournaments: Tournament[];
}
