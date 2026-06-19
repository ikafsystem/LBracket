export type ParticipantStatus = 'undefeated' | 'lower-bracket' | 'eliminated';
export type Bracket = 'winners' | 'losers' | 'upper' | 'lower' | 'grand-final' | 'play-in';
export type TournamentStatus = 'pending' | 'active' | 'completed';
export type TournamentType = 'losers-bracket' | 'winners-bracket';

export interface Participant {
  id: string;
  name: string;
  teamName?: string;
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
  label?: string;
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
  tournamentType: TournamentType;
  prize?: string;
  adminToken?: string;
  logo?: string;
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
  logo?: string;
}

export interface TournamentStore {
  tournaments: Tournament[];
}
