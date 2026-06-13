import type { Participant, Match, Tournament, Bracket } from '@/types';
import { generateId, nextPowerOf2 } from './utils';

function createParticipant(name: string, seed: number): Participant {
  return {
    id: generateId(),
    name,
    seed,
    wins: 0,
    losses: 0,
    status: 'undefeated',
  };
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

interface CreateTournamentParams {
  name: string;
  participants: string[];
  randomSeeding: boolean;
  doubleElimination: boolean;
  losersToFind: 1 | 2;
}

export function createTournament(params: CreateTournamentParams): Tournament {
  const { name, participants: participantNames, randomSeeding, losersToFind } = params;

  let seeds = participantNames.map((name, i) => ({ name, seed: i + 1 }));
  if (randomSeeding) {
    seeds = shuffleArray(seeds);
    seeds = seeds.map((s, i) => ({ ...s, seed: i + 1 }));
  }

  const participants: Participant[] = seeds.map((s) =>
    createParticipant(s.name, s.seed)
  );

  const matches = generateInitialMatches(participants, losersToFind);
  const id = generateId();
  const now = Date.now();

  return {
    id,
    name,
    participants,
    matches,
    currentRound: 1,
    status: 'active',
    createdAt: now,
    updatedAt: now,
    championId: null,
    secondPlaceId: null,
    loserIds: [],
    grandFinalMatchId: null,
    grandFinalResetMatchId: null,
    losersToFind,
  };
}

function generateInitialMatches(participants: Participant[], losersToFind: 1 | 2): Match[] {
  const n = participants.length;
  const totalSlots = nextPowerOf2(n);
  const matches: Match[] = [];

  const sorted = [...participants].sort((a, b) => a.seed - b.seed);
  const slots: (Participant | null)[] = new Array(totalSlots).fill(null);

  const bracketPositions = getBracketPositions(totalSlots);
  for (let i = 0; i < sorted.length; i++) {
    slots[bracketPositions[i]] = sorted[i];
  }

  const roundMatches = totalSlots / 2;
  for (let i = 0; i < roundMatches; i++) {
    const p1 = slots[i * 2];
    const p2 = slots[i * 2 + 1];
    const isBye = !p1 || !p2;

    const matchId = generateId();

    matches.push({
      id: matchId,
      round: 1,
      bracket: 'winners',
      position: i,
      participant1Id: p1?.id ?? null,
      participant2Id: p2?.id ?? null,
      winnerId: isBye ? (p1?.id ?? p2?.id ?? null) : null,
      loserId: null,
      winnerNextMatchId: null,
      loserNextMatchId: null,
      completed: isBye,
      bye: isBye,
    });
  }

  if (totalSlots > 2) {
    generateWinnersBracketRounds(matches, totalSlots, 2);
  }

  // Clear winnerNextMatchId for double-bye matches (both slots null, no winner)
  for (const m of matches) {
    if (m.bye && !m.winnerId && m.bracket === 'winners') {
      m.winnerNextMatchId = null;
    }
  }

  generateLosersBracket(matches, totalSlots, losersToFind);

  routeByes(matches);

  return matches;
}

function getBracketPositions(totalSlots: number): number[] {
  if (totalSlots === 2) return [0, 1];
  if (totalSlots === 4) return [0, 3, 1, 2];
  if (totalSlots === 8) return [0, 7, 3, 4, 1, 6, 2, 5];
  if (totalSlots === 16) return [0, 15, 7, 8, 3, 12, 4, 11, 1, 14, 6, 9, 2, 13, 5, 10];
  const positions: number[] = [];
  for (let i = 0; i < totalSlots; i++) positions.push(i);
  return positions;
}

function generateWinnersBracketRounds(
  matches: Match[],
  totalSlots: number,
  startRound: number
): void {
  let roundMatchCount = totalSlots / 2;
  let currentRound = startRound;

  while (roundMatchCount > 1) {
    roundMatchCount /= 2;
    const prevRoundStart = matches.length - roundMatchCount * 2;
    const prevRoundMatches = matches.slice(prevRoundStart);
    const prevRoundMatchIds = prevRoundMatches.map((m) => m.id);

    for (let i = 0; i < roundMatchCount; i++) {
      const matchId = generateId();
      const nextMatchId = roundMatchCount > 1 ? generateId() : null;

      matches.push({
        id: matchId,
        round: currentRound,
        bracket: 'winners',
        position: i,
        participant1Id: null,
        participant2Id: null,
        winnerId: null,
        loserId: null,
        winnerNextMatchId: nextMatchId,
        loserNextMatchId: null,
        completed: false,
        bye: false,
      });

      const idx1 = i * 2;
      const idx2 = i * 2 + 1;
      if (prevRoundMatchIds[idx1]) {
        prevRoundMatches[idx1].winnerNextMatchId = matchId;
      }
      if (prevRoundMatchIds[idx2]) {
        prevRoundMatches[idx2].winnerNextMatchId = matchId;
      }
    }
    currentRound++;
  }
}

function generateLosersBracket(
  matches: Match[],
  totalSlots: number,
  losersToFind: 1 | 2
): void {
  const k = Math.log2(totalSlots);
  if (k <= 1) return;

  const wbByRound: Match[][] = [];
  for (const m of matches) {
    if (m.bracket !== 'winners') continue;
    while (wbByRound.length <= m.round) wbByRound.push([]);
    wbByRound[m.round][m.position] = m;
  }

  const nonByeWb: Match[] = [];
  for (let r = 1; r < k; r++) {
    const wbRound = wbByRound[r] || [];
    for (const m of wbRound) {
      if (!m.bye) nonByeWb.push(m);
    }
  }

  // Include WB final round if odd (makes LB even, no byes)
  if (nonByeWb.length % 2 === 1) {
    const finalRound = wbByRound[k] || [];
    for (const m of finalRound) {
      if (!m.bye) nonByeWb.push(m);
    }
  }

  if (nonByeWb.length === 0) return;

  const totalRounds = Math.ceil(Math.log2(nonByeWb.length));
  const lbRoundsToCreate = losersToFind === 1 ? totalRounds : totalRounds - 1;

  if (lbRoundsToCreate <= 0) return;

  let currentRoundMatches: Match[] = [];

  for (let r = 0; r < lbRoundsToCreate; r++) {
    const roundNum = r + 1;
    const inputMatches = r === 0 ? nonByeWb : currentRoundMatches;
    const matchCount = Math.ceil(inputMatches.length / 2);

    const roundMatches: Match[] = [];
    for (let i = 0; i < matchCount; i++) {
      const lbMatch: Match = {
        id: generateId(),
        round: roundNum,
        bracket: 'losers',
        position: i,
        participant1Id: null,
        participant2Id: null,
        winnerId: null,
        loserId: null,
        winnerNextMatchId: null,
        loserNextMatchId: null,
        completed: false,
        bye: false,
      };
      matches.push(lbMatch);
      roundMatches.push(lbMatch);
    }

    for (let i = 0; i < matchCount; i++) {
      const src1 = inputMatches[i * 2];
      const src2 = inputMatches[i * 2 + 1];

      if (src1) src1.loserNextMatchId = roundMatches[i].id;
      if (src2) src2.loserNextMatchId = roundMatches[i].id;
    }

    currentRoundMatches = roundMatches;
  }

  for (const m of currentRoundMatches) {
    m.loserNextMatchId = null;
  }
}

function routeByes(matches: Match[]): void {
  let changed = true;
  while (changed) {
    changed = false;
    for (const byeMatch of matches) {
      if (!byeMatch.bye || !byeMatch.completed || !byeMatch.winnerId) continue;
      const nextMatchId = byeMatch.winnerNextMatchId;
      if (!nextMatchId) continue;
      const nextMatch = matches.find((m) => m.id === nextMatchId);
      if (!nextMatch) continue;
      if (nextMatch.participant1Id === byeMatch.winnerId || nextMatch.participant2Id === byeMatch.winnerId) continue;
      if (nextMatch.participant1Id === null) {
        nextMatch.participant1Id = byeMatch.winnerId;
        byeMatch.bye = false;
        changed = true;
      } else if (nextMatch.participant2Id === null) {
        nextMatch.participant2Id = byeMatch.winnerId;
        byeMatch.bye = false;
        changed = true;
      }
    }
  }
}

function findMatchById(matches: Match[], id: string): Match | undefined {
  return matches.find((m) => m.id === id);
}

function findParticipantById(
  participants: Participant[],
  id: string
): Participant | undefined {
  return participants.find((p) => p.id === id);
}

function getMatchesByBracketAndRound(
  matches: Match[],
  bracket: Bracket,
  round: number
): Match[] {
  return matches.filter((m) => m.bracket === bracket && m.round === round);
}

function getMaxRound(matches: Match[], bracket: Bracket): number {
  const bracketMatches = matches.filter((m) => m.bracket === bracket);
  if (bracketMatches.length === 0) return 0;
  return Math.max(...bracketMatches.map((m) => m.round));
}

export function completeMatch(
  tournament: Tournament,
  matchId: string,
  winnerId: string
): Tournament {
  const { matches, participants } = tournament;
  const match = findMatchById(matches, matchId);
  if (!match || match.completed) return tournament;

  const winner = findParticipantById(participants, winnerId);
  const loserId =
    match.participant1Id === winnerId
      ? match.participant2Id
      : match.participant1Id;
  const loser = findParticipantById(participants, loserId ?? '');

  if (!winner || !loser) return tournament;

  const updatedParticipants = participants.map((p) => {
    if (p.id === winner.id) {
      return { ...p, wins: p.wins + 1 };
    }
    if (p.id === loser.id) {
      const newLosses = p.losses + 1;
      const hasLbNext = match.loserNextMatchId !== null;
      const newStatus: Participant['status'] =
        hasLbNext
          ? 'lower-bracket'
          : 'eliminated';
      return {
        ...p,
        losses: newLosses,
        status: newStatus,
        eliminatedInRound:
          newStatus === 'eliminated' ? match.round : undefined,
      };
    }
    return p;
  });

  const updatedMatch: Match = {
    ...match,
    winnerId,
    loserId: loser.id,
    completed: true,
  };

  const updatedMatches = matches.map((m) =>
    m.id === match.id ? updatedMatch : m
  );

  let t: Tournament = {
    ...tournament,
    participants: updatedParticipants,
    matches: updatedMatches,
    updatedAt: Date.now(),
  };

  t = routeWinner(t, updatedMatch, winner);
  t = routeLoser(t, updatedMatch, loser);
  t = autoAdvanceByes(t);

  t = checkGrandFinal(t);
  t = checkTournamentComplete(t);

  return t;
}

function routeWinner(
  tournament: Tournament,
  match: Match,
  winner: Participant
): Tournament {
  const nextMatchId = match.winnerNextMatchId;
  if (!nextMatchId) return tournament;

  const { matches } = tournament;
  const nextMatch = findMatchById(matches, nextMatchId);
  if (!nextMatch) return tournament;

  const updatedMatches = matches.map((m) => {
    if (m.id !== nextMatchId) return m;
    if (m.participant1Id === null) {
      return { ...m, participant1Id: winner.id };
    }
    if (m.participant2Id === null) {
      return { ...m, participant2Id: winner.id };
    }
    return m;
  });

  return { ...tournament, matches: updatedMatches };
}

function routeLoser(
  tournament: Tournament,
  match: Match,
  loser: Participant
): Tournament {
  const loserNextMatchId = match.loserNextMatchId;
  if (!loserNextMatchId) return tournament;

  const { matches } = tournament;
  const nextMatch = findMatchById(matches, loserNextMatchId);
  if (!nextMatch) return tournament;

  const updatedMatches = matches.map((m) => {
    if (m.id !== loserNextMatchId) return m;
    if (m.participant1Id === null) {
      return { ...m, participant1Id: loser.id };
    }
    if (m.participant2Id === null) {
      return { ...m, participant2Id: loser.id };
    }
    return m;
  });

  return { ...tournament, matches: updatedMatches };
}

function autoAdvanceByes(tournament: Tournament): Tournament {
  let t = tournament;
  let changed = true;

  while (changed) {
    changed = false;
    for (const match of t.matches) {
      if (match.completed || match.bye) continue;

      const pCount = (match.participant1Id ? 1 : 0) + (match.participant2Id ? 1 : 0);
      if (pCount < 1 || pCount === 2) continue;

      const sources = t.matches.filter(
        (m) => m.winnerNextMatchId === match.id || m.loserNextMatchId === match.id
      );
      if (sources.length === 0) continue;

      let willProduce = 0;
      let allResolved = true;

      for (const src of sources) {
        if (src.bye) continue;
        if (!src.completed) {
          allResolved = false;
          willProduce++;
          continue;
        }
        const produces =
          (src.loserNextMatchId === match.id && src.loserId !== null) ||
          (src.winnerNextMatchId === match.id && src.winnerId !== null);
        if (produces) willProduce++;
      }

      if (!allResolved) continue;
      if (willProduce > pCount) continue;

      const winnerId = match.participant1Id ?? match.participant2Id!;
      const winner = findParticipantById(t.participants, winnerId);
      if (!winner) continue;

      const completedMatch: Match = { ...match, winnerId, completed: true };
      const updatedMatches = t.matches.map((m) =>
        m.id === match.id ? completedMatch : m
      );
      t = { ...t, matches: updatedMatches };
      t = routeWinner(t, completedMatch, winner);
      if (match.loserNextMatchId) {
        t = routeLoser(t, completedMatch, winner);
      }
      changed = true;
      break;
    }
  }

  return t;
}

function checkGrandFinal(tournament: Tournament): Tournament {
  return tournament;
}

function checkTournamentComplete(tournament: Tournament): Tournament {
  if (tournament.status === 'completed') return tournament;

  const { matches, participants } = tournament;

  const wbMatches = matches.filter((m) => m.bracket === 'winners');
  const lbMatches = matches.filter((m) => m.bracket === 'losers');

  const allWbDone = wbMatches.every((m) => m.completed);
  const allLbDone = lbMatches.every((m) => m.completed);

  if (lbMatches.length === 0 && allWbDone) {
    const wbFinal = wbMatches.reduce((a, b) => (a.round > b.round ? a : b));
    return {
      ...tournament,
      championId: wbFinal.winnerId ?? null,
      secondPlaceId: wbFinal.loserId ?? null,
      loserIds: [],
      status: 'completed',
    };
  }

  if (allWbDone && allLbDone && lbMatches.length > 0) {
    const wbFinal = wbMatches.reduce((a, b) => (a.round > b.round ? a : b));
    const lastLbRound = Math.max(...lbMatches.map((m) => m.round));
    const finalLbMatches = lbMatches.filter((m) => m.round === lastLbRound);

    const loserIds: string[] = [];
    for (const m of finalLbMatches) {
      if (m.loserId) {
        loserIds.push(m.loserId);
      } else if (m.completed && m.winnerId) {
        loserIds.push(m.winnerId);
      }
    }

    return {
      ...tournament,
      championId: wbFinal.winnerId ?? null,
      secondPlaceId: wbFinal.loserNextMatchId ? null : (wbFinal.loserId ?? null),
      loserIds,
      status: 'completed',
    };
  }

  return tournament;
}

export function getActiveParticipants(
  participants: Participant[]
): Participant[] {
  return participants.filter((p) => p.status !== 'eliminated');
}

export function getEliminatedParticipants(
  participants: Participant[]
): Participant[] {
  return participants
    .filter((p) => p.status === 'eliminated')
    .sort(
      (a, b) => (a.eliminatedInRound ?? 99) - (b.eliminatedInRound ?? 99)
    );
}

export function getRounds(matches: Match[], bracket: Bracket): number[] {
  const rounds = matches
    .filter((m) => m.bracket === bracket)
    .map((m) => m.round);
  return [...new Set(rounds)].sort((a, b) => a - b);
}

export function getParticipantMatchHistory(
  matches: Match[],
  participantId: string
): Match[] {
  return matches
    .filter(
      (m) =>
        (m.participant1Id === participantId ||
          m.participant2Id === participantId) &&
        m.completed
    )
    .sort((a, b) => b.round - a.round);
}
