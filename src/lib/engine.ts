import type { Participant, Match, Tournament, Bracket } from '@/types';
import { generateId, nextPowerOf2 } from './utils';

function cp(name: string, seed: number): Participant {
  return { id: generateId(), name, seed, wins: 0, losses: 0, status: 'undefeated' };
}
function shuf<T>(a: T[]): T[] {
  const s = [...a]; for (let i = s.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[s[i], s[j]] = [s[j], s[i]]; } return s;
}
function fm(m: Match[], id: string): Match | undefined { return m.find(x => x.id === id); }
function fp(p: Participant[], id: string): Participant | undefined { return p.find(x => x.id === id); }
function maxR(m: Match[], b: Bracket): number { const f = m.filter(x => x.bracket === b); return f.length ? Math.max(...f.map(x => x.round)) : 0; }

export function createTournament(p: { name: string; participants: string[]; randomSeeding: boolean; doubleElimination: boolean; losersToFind: 1 | 2 }): Tournament {
  const { name, participants: ns, randomSeeding, losersToFind: lt } = p;
  let seeds = ns.map((n, i) => ({ name: n, seed: i + 1 }));
  if (randomSeeding) seeds = shuf(seeds).map((s, i) => ({ ...s, seed: i + 1 }));
  const ps: Participant[] = seeds.map(s => cp(s.name, s.seed));
  const m = genOld(ps, lt);
  return mt(name, ps, m, lt, 'losers-bracket');
}

export function createWinnersBracketTournament(p: { name: string; participants: Array<{ name: string; teamName: string }> }): Tournament {
  const { name, participants: data } = p;
  let ps: Participant[] = data.map((x, i) => ({ ...cp(x.name, i + 1), teamName: x.teamName || undefined }));
  ps = shuf(ps).map((x, i) => ({ ...x, seed: i + 1 }));
  const m = genDE(ps);
  return mt(name, ps, m, 1, 'winners-bracket');
}

function mt(name: string, p: Participant[], m: Match[], lt: 1 | 2, tt: Tournament['tournamentType']): Tournament {
  return { id: generateId(), name, participants: p, matches: m, currentRound: 1, status: 'pending', createdAt: Date.now(), updatedAt: Date.now(), championId: null, secondPlaceId: null, loserIds: [], grandFinalMatchId: null, grandFinalResetMatchId: null, losersToFind: lt, tournamentType: tt };
}

// ─── OLD BRACKET ───

function genOld(p: Participant[], lt: 1 | 2): Match[] {
  const n = p.length, ts = nextPowerOf2(n);
  const m: Match[] = [];
  const sorted = [...p].sort((a, b) => a.seed - b.seed);
  const slots: (Participant | null)[] = new Array(ts).fill(null);
  const pos = ts <= 16 ? [0, 3, 1, 2, 7, 4, 5, 6, 15, 8, 9, 10, 11, 12, 13, 14].slice(0, ts) : Array.from({ length: ts }, (_, i) => i);
  for (let i = 0; i < sorted.length; i++) slots[pos[i]] = sorted[i];
  const r1 = ts / 2;
  for (let i = 0; i < r1; i++) {
    const p1 = slots[i * 2], p2 = slots[i * 2 + 1], bye = !p1 || !p2;
    const id = generateId();
    m.push({ id, round: 1, bracket: 'winners', position: i, participant1Id: p1?.id ?? null, participant2Id: p2?.id ?? null, winnerId: bye ? (p1?.id ?? p2?.id ?? null) : null, loserId: null, winnerNextMatchId: null, loserNextMatchId: null, completed: bye, bye });
  }
  if (ts > 2) {
    let rmc = ts / 2, cr = 2;
    while (rmc > 1) {
      rmc /= 2;
      const prev = m.slice(m.length - rmc * 2);
      const pids = prev.map(x => x.id);
      for (let i = 0; i < rmc; i++) {
        const id = generateId(), nid = rmc > 1 ? generateId() : null;
        m.push({ id, round: cr, bracket: 'winners', position: i, participant1Id: null, participant2Id: null, winnerId: null, loserId: null, winnerNextMatchId: nid, loserNextMatchId: null, completed: false, bye: false });
        if (pids[i * 2]) prev[i * 2].winnerNextMatchId = id; if (pids[i * 2 + 1]) prev[i * 2 + 1].winnerNextMatchId = id;
      }
      cr++;
    }
  }
  for (const x of m) { if (x.bye && !x.winnerId && x.bracket === 'winners') x.winnerNextMatchId = null; }
  const k = Math.log2(ts);
  if (k > 1) {
    const br: Match[][] = [];
    for (const x of m) { if (x.bracket !== 'winners') continue; while (br.length <= x.round) br.push([]); br[x.round][x.position] = x; }
    const nb: Match[] = [];
    for (let r = 1; r < k; r++) { for (const x of (br[r] || [])) { if (!x.bye) nb.push(x); } }
    if (nb.length % 2 === 1) { for (const x of (br[k] || [])) { if (!x.bye) nb.push(x); } }
    if (nb.length > 0) {
      const tr = Math.ceil(Math.log2(nb.length)), lr = lt === 1 ? tr : tr - 1;
      if (lr > 0) {
        let cur: Match[] = [];
        for (let r = 0; r < lr; r++) {
          const rm = r + 1, input = r === 0 ? nb : cur, mc = Math.ceil(input.length / 2);
          const rd: Match[] = [];
          for (let i = 0; i < mc; i++) {
            const x: Match = { id: generateId(), round: rm, bracket: 'losers', position: i, participant1Id: null, participant2Id: null, winnerId: null, loserId: null, winnerNextMatchId: null, loserNextMatchId: null, completed: false, bye: false };
            m.push(x); rd.push(x);
          }
          for (let i = 0; i < mc; i++) { if (input[i * 2]) input[i * 2].loserNextMatchId = rd[i].id; if (input[i * 2 + 1]) input[i * 2 + 1].loserNextMatchId = rd[i].id; }
          cur = rd;
        }
        for (const x of cur) x.loserNextMatchId = null;
      }
    }
  }
  routeB(m); label(m);
  return m;
}

function routeB(m: Match[]): void {
  let changed = true;
  while (changed) {
    changed = false;
    for (const bm of m) {
      if (!bm.bye || !bm.completed || !bm.winnerId) continue;
      const nm = m.find(x => x.id === bm.winnerNextMatchId);
      if (!nm) continue;
      if (nm.participant1Id === bm.winnerId || nm.participant2Id === bm.winnerId) continue;
      if (nm.participant1Id === null) { nm.participant1Id = bm.winnerId; bm.bye = false; changed = true; }
      else if (nm.participant2Id === null) { nm.participant2Id = bm.winnerId; bm.bye = false; changed = true; }
    }
  }
}

// ─── SEEDING ───

function seedOrder(n: number): number[] {
  if (n === 2) return [0, 1];
  if (n === 4) return [0, 3, 1, 2];
  if (n === 8) return [0, 7, 3, 4, 1, 6, 2, 5];
  if (n === 16) return [0, 15, 7, 8, 3, 12, 4, 11, 1, 14, 6, 9, 2, 13, 5, 10];
  const half = n / 2; const l = seedOrder(half), r = seedOrder(half); const res: number[] = [];
  for (let i = 0; i < half; i++) { res.push(l[i]); res.push(n - 1 - r[i]); } return res;
}

// ─── DOUBLE ELIMINATION ───

/**
 * Generate complete Double Elimination bracket.
 * ALL match cards are pre-created with positions, labels, and routing.
 * 
 * For ANY participant count n:
 * 1. bracketSize = nextPowerOf2(n)
 * 2. Fill participants into bracket slots using seeding order (some slots may be bye)
 * 3. Generate UB rounds (k = log2(bracketSize) rounds)
 * 4. Generate LB rounds (2k-2 rounds) with standard counts
 * 5. Generate GF (1 match)
 * 6. Pre-link all winnerNextMatchId / loserNextMatchId
 * 7. Assign labels
 * 
 * Standard LB match counts for k-round UB:
 * Round 1 (pure):  2^(k-2)
 * Round 2 (mixed): 2^(k-2)
 * Round 3 (pure):  2^(k-3)
 * Round 4 (mixed): 2^(k-3)
 * ...
 * Round 2k-3 (pure): 1
 * Round 2k-2 (mixed): 1
 * 
 * Pattern: count = 2^(k-1-ceil(r/2))
 */
function genDE(participants: Participant[]): Match[] {
  const n = participants.length;
  if (n < 2) return [];
  const ts = nextPowerOf2(n);
  const k = Math.log2(ts);
  const m: Match[] = [];
  const sorted = [...participants].sort((a, b) => a.seed - b.seed);

  // ── Place participants ──
  const slots: (Participant | null)[] = new Array(ts).fill(null);
  const so = seedOrder(ts);
  for (let i = 0; i < n; i++) slots[so[i]] = sorted[i];

  // ── UB ROUNDS ──
  const ubRd: string[][] = [];
  const r1c = ts / 2;

  // UB R1
  ubRd[0] = [];
  for (let i = 0; i < r1c; i++) {
    const p1 = slots[i * 2], p2 = slots[i * 2 + 1];
    const isBye = !p1 || !p2;
    const id = generateId();
    m.push({
      id, round: 1, bracket: 'upper', position: i,
      participant1Id: p1?.id ?? null, participant2Id: p2?.id ?? null,
      winnerId: isBye ? (p1?.id ?? p2?.id ?? null) : null,
      loserId: null, winnerNextMatchId: null, loserNextMatchId: null,
      completed: isBye, bye: isBye,
    });
    ubRd[0].push(id);
  }

  // UB R2..Rk (winner routing)
  for (let r = 1; r < k; r++) {
    const cnt = ts / Math.pow(2, r + 1);
    ubRd[r] = [];
    for (let i = 0; i < cnt; i++) {
      const id = generateId();
      m.push({
        id, round: r + 1, bracket: 'upper', position: i,
        participant1Id: null, participant2Id: null,
        winnerId: null, loserId: null,
        winnerNextMatchId: null, loserNextMatchId: null,
        completed: false, bye: false,
      });
      ubRd[r].push(id);
    }
    const prev = ubRd[r - 1];
    for (let i = 0; i < cnt; i++) {
      if (prev[i * 2]) { const s1 = m.find(x => x.id === prev[i * 2]); if (s1) s1.winnerNextMatchId = ubRd[r][i]; }
      if (prev[i * 2 + 1]) { const s2 = m.find(x => x.id === prev[i * 2 + 1]); if (s2) s2.winnerNextMatchId = ubRd[r][i]; }
    }
  }

  // ── BYE PROPAGATION (UB only) ──
  // Propagate bye winners forward through UB matches WITHOUT touching loserNextMatchId.
  // This preserves the UB→LB loser routing that will be set up below.
  // Also detects cascading double-byes (both feeders are pure byes → next match is also bye).
  let byeChanged = true;
  while (byeChanged) {
    byeChanged = false;
    for (const bm of m) {
      if (!bm.bye || !bm.completed || !bm.winnerId) continue;
      if (bm.bracket !== 'upper') continue;
      const nm = m.find(x => x.id === bm.winnerNextMatchId);
      if (!nm || nm.completed) continue;
      if (nm.participant1Id === bm.winnerId || nm.participant2Id === bm.winnerId) continue;
      if (nm.participant1Id !== null && nm.participant2Id !== null) continue;
      if (nm.participant1Id === null) {
        m.find(x => x.id === nm.id)!.participant1Id = bm.winnerId;
      } else {
        m.find(x => x.id === nm.id)!.participant2Id = bm.winnerId;
      }
      // Check for cascading double-bye: both feeders are pure byes with same winner
      if (nm.participant1Id === nm.participant2Id && nm.participant1Id !== null) {
        const otherSrc = m.find(x => x.winnerNextMatchId === nm.id && x.id !== bm.id);
        if (otherSrc && otherSrc.bye && otherSrc.completed
            && !otherSrc.participant1Id && !otherSrc.participant2Id) {
          m.find(x => x.id === nm.id)!.completed = true;
          m.find(x => x.id === nm.id)!.bye = true;
          m.find(x => x.id === nm.id)!.winnerId = nm.participant1Id;
        }
      }
      byeChanged = true;
    }
  }

  // ── LB ROUNDS ──
  if (k > 1) {
    const lbRounds = 2 * k - 2;
    const lbRd: string[][] = [];

    for (let r = 1; r <= lbRounds; r++) {
      const cnt = Math.max(1, Math.pow(2, k - 1 - Math.ceil(r / 2)));
      const ids: string[] = [];
      for (let i = 0; i < cnt; i++) {
        const id = generateId();
        m.push({
          id, round: r, bracket: 'lower', position: i,
          participant1Id: null, participant2Id: null,
          winnerId: null, loserId: null,
          winnerNextMatchId: null, loserNextMatchId: null,
          completed: false, bye: false,
        });
        ids.push(id);
      }
      lbRd.push(ids);
    }

    // Route LB
    for (let ri = 0; ri < lbRd.length; ri++) {
      const r = ri + 1;
      const ids = lbRd[ri];
      const isMixed = r % 2 === 0;

      if (r === 1) {
        // LB1: losers from UB R1 pairs [2i,2i+1] → LB[i]
        for (let i = 0; i < ids.length && i * 2 + 1 < ubRd[0].length; i++) {
          const u1 = m.find(x => x.id === ubRd[0][i * 2]);
          const u2 = m.find(x => x.id === ubRd[0][i * 2 + 1]);
          if (u1 && !u1.bye) u1.loserNextMatchId = ids[i];
          if (u2 && !u2.bye) u2.loserNextMatchId = ids[i];
        }
      } else if (isMixed) {
        // Even: LB winner from prev[i] + UB loser from round r/2
        const prevIds = lbRd[ri - 1];
        const ubIdx = r / 2;
        const ubIds = ubRd[ubIdx] || [];
        for (let i = 0; i < ids.length; i++) {
          if (i < prevIds.length) {
            const lw = m.find(x => x.id === prevIds[i]);
            if (lw) lw.winnerNextMatchId = ids[i];
          }
          if (i < ubIds.length) {
            const um = m.find(x => x.id === ubIds[i]);
            if (um && !um.bye) um.loserNextMatchId = ids[i];
          }
        }
      } else {
        // Odd > 1: pure LB pairing [2i,2i+1]→[i]
        const prevIds = lbRd[ri - 1];
        for (let i = 0; i < ids.length; i++) {
          if (i * 2 < prevIds.length) {
            const s1 = m.find(x => x.id === prevIds[i * 2]);
            if (s1) s1.winnerNextMatchId = ids[i];
          }
          if (i * 2 + 1 < prevIds.length) {
            const s2 = m.find(x => x.id === prevIds[i * 2 + 1]);
            if (s2) s2.winnerNextMatchId = ids[i];
          }
        }
      }
    }

    // Last LB: clear loserNextMatchId
    const lastLB = lbRd[lbRd.length - 1];
    if (lastLB) { for (const id of lastLB) { const lm = m.find(x => x.id === id); if (lm) lm.loserNextMatchId = null; } }

    // Mark phantom LB matches (0 feeder sources) as byes and propagate downstream
    let phantomChanged = true;
    while (phantomChanged) {
      phantomChanged = false;
      for (const lb of m.filter(x => x.bracket === 'lower' && !x.completed)) {
        const feederCount = m.filter(x =>
          (x.winnerNextMatchId === lb.id || x.loserNextMatchId === lb.id) && !x.bye
        ).length;
        if (feederCount === 0) {
          lb.completed = true;
          lb.bye = true;
          phantomChanged = true;
        }
      }
    }
  }

  // ── GF ──
  const ubFinalId = ubRd[k - 1]?.[0];
  const gfId = generateId();
  if (ubFinalId) { const ubf = m.find(x => x.id === ubFinalId); if (ubf) ubf.winnerNextMatchId = gfId; }
  const lbr = maxR(m, 'lower');
  if (lbr > 0) { for (const lm of m.filter(x => x.bracket === 'lower' && x.round === lbr)) lm.winnerNextMatchId = gfId; }
  m.push({
    id: gfId, round: 1, bracket: 'grand-final', position: 0,
    participant1Id: null, participant2Id: null,
    winnerId: null, loserId: null,
    winnerNextMatchId: null, loserNextMatchId: null,
    completed: false, bye: false,
  });

  label(m);
  return m;
}

function label(m: Match[]): void {
  let pi = 0, ub = 0, lb = 0;
  for (const x of m) {
    if (x.bracket === 'play-in') x.label = `P${++pi}`;
    else if (x.bracket === 'upper') x.label = `UB${++ub}`;
    else if (x.bracket === 'lower') x.label = `LB${++lb}`;
    else if (x.bracket === 'grand-final') x.label = 'GF';
  }
}

// ─── MATCH COMPLETION ───

export function completeMatch(tournament: Tournament, matchId: string, winnerId: string): Tournament {
  const { matches, participants } = tournament;
  const match = fm(matches, matchId); if (!match || match.completed) return tournament;
  const winner = fp(participants, winnerId);
  const loserId = match.participant1Id === winnerId ? match.participant2Id : match.participant1Id;
  const loser = fp(participants, loserId ?? ''); if (!winner || !loser) return tournament;
  const nl = loser.losses + 1;
  const isLB = match.bracket === 'lower' || match.bracket === 'losers';
  const ns: Participant['status'] = (nl >= 2 || isLB) ? 'eliminated' : 'lower-bracket';
  const up = participants.map(p => {
    if (p.id === winner.id) return { ...p, wins: p.wins + 1 };
    if (p.id === loser.id) return { ...p, losses: nl, status: ns, eliminatedInRound: ns === 'eliminated' ? match.round : undefined };
    return p;
  });
  const um: Match = { ...match, winnerId, loserId: loser.id, completed: true };
  const ums = matches.map(m => m.id === matchId ? um : m);
  let t: Tournament = { ...tournament, participants: up, matches: ums, updatedAt: Date.now() };
  t = rtWn(t, um, winner); t = rtLs(t, um, loser); t = autoB(t); t = gfChk(t); t = finish(t);
  return t;
}

function rtWn(t: Tournament, match: Match, winner: Participant): Tournament {
  const nid = match.winnerNextMatchId; if (!nid) return t;
  const nm = fm(t.matches, nid); if (!nm) return t;
  return { ...t, matches: t.matches.map(m => m.id !== nid ? m : m.participant1Id === null ? { ...m, participant1Id: winner.id } : m.participant2Id === null ? { ...m, participant2Id: winner.id } : m) };
}
function rtLs(t: Tournament, match: Match, loser: Participant): Tournament {
  const nid = match.loserNextMatchId; if (!nid) return t;
  const nm = fm(t.matches, nid); if (!nm) return t;
  return { ...t, matches: t.matches.map(m => m.id !== nid ? m : m.participant1Id === null ? { ...m, participant1Id: loser.id } : m.participant2Id === null ? { ...m, participant2Id: loser.id } : m) };
}
function autoB(t: Tournament): Tournament {
  let changed = true;
  while (changed) {
    changed = false;
    for (const match of t.matches) {
      if (match.completed || match.bye) continue;

      // Handle same-participant edge case (double-bye propagation)
      if (match.participant1Id && match.participant1Id === match.participant2Id) {
        const w = fp(t.participants, match.participant1Id); if (!w) continue;
        const cm: Match = { ...match, winnerId: match.participant1Id, completed: true, bye: true };
        t = { ...t, matches: t.matches.map(m => m.id === match.id ? cm : m) };
        t = rtWn(t, cm, w); changed = true; break;
      }

      const pc = (match.participant1Id ? 1 : 0) + (match.participant2Id ? 1 : 0);
      if (pc !== 1) continue;
      const sources = t.matches.filter(m => m.winnerNextMatchId === match.id || m.loserNextMatchId === match.id);

      // Check if a second participant could still arrive from any source
      let waitingForSomeone = false;
      for (const src of sources) {
        if (src.bye) continue;
        if (src.completed) continue;
        waitingForSomeone = true;
        break;
      }
      if (waitingForSomeone) continue;

      // No one else is coming → auto-advance the sole participant
      const wid = match.participant1Id ?? match.participant2Id!;
      const w = fp(t.participants, wid); if (!w) continue;
      const cm: Match = { ...match, winnerId: wid, completed: true };
      t = { ...t, matches: t.matches.map(m => m.id === match.id ? cm : m) };
      t = rtWn(t, cm, w); changed = true; break;
    }
  }
  return t;
}
function gfChk(t: Tournament): Tournament { return t; }
function finish(t: Tournament): Tournament {
  if (t.status === 'completed') return t;
  const gf = t.matches.find(m => m.bracket === 'grand-final');
  if (gf && gf.completed) {
    let sp = gf.loserId;
    if (!sp) { const ub = t.matches.filter(m => m.bracket === 'upper'); const f = ub.reduce((a, b) => a.round > b.round ? a : b, ub[0]); sp = f?.loserId ?? null; }
    return { ...t, championId: gf.winnerId, secondPlaceId: sp, status: 'completed' };
  }
  const wb = t.matches.filter(m => m.bracket === 'winners');
  const lb = t.matches.filter(m => m.bracket === 'losers');
  if (lb.length === 0 && wb.length > 0 && wb.every(m => m.completed)) {
    const f = wb.reduce((a, b) => a.round > b.round ? a : b);
    return { ...t, championId: f.winnerId ?? null, secondPlaceId: f.loserId ?? null, loserIds: [], status: 'completed' };
  }
  if (wb.length > 0 && lb.length > 0 && wb.every(m => m.completed) && lb.every(m => m.completed)) {
    const f = wb.reduce((a, b) => a.round > b.round ? a : b);
    const lr = Math.max(...lb.map(m => m.round));
    const fl = lb.filter(m => m.round === lr);
    const lids: string[] = [];
    for (const m of fl) { if (m.loserId) lids.push(m.loserId); else if (m.completed && m.winnerId) lids.push(m.winnerId); }
    return { ...t, championId: f.winnerId ?? null, secondPlaceId: f.loserNextMatchId ? null : (f.loserId ?? null), loserIds: lids, status: 'completed' };
  }
  return t;
}

// ─── EXPORTS ───

export function getActiveParticipants(participants: Participant[]): Participant[] { return participants.filter(p => p.status !== 'eliminated'); }
export function getEliminatedParticipants(participants: Participant[]): Participant[] { return participants.filter(p => p.status === 'eliminated').sort((a, b) => (a.eliminatedInRound ?? 99) - (b.eliminatedInRound ?? 99)); }
export function getRounds(matches: Match[], bracket: Bracket): number[] { return [...new Set(matches.filter(m => m.bracket === bracket).map(m => m.round))].sort((a, b) => a - b); }
export function getParticipantMatchHistory(matches: Match[], pid: string): Match[] { return matches.filter(m => (m.participant1Id === pid || m.participant2Id === pid) && m.completed).sort((a, b) => b.round - a.round); }
export function hydrateWinnersBracket(t: Tournament): Tournament {
  let prev: string;
  do {
    prev = JSON.stringify(t.matches.map(m => ({ id: m.id, c: m.completed, p1: m.participant1Id, p2: m.participant2Id })));
    t = autoB(t);
    t = finish(t);
  } while (JSON.stringify(t.matches.map(m => ({ id: m.id, c: m.completed, p1: m.participant1Id, p2: m.participant2Id }))) !== prev);
  return t;
}