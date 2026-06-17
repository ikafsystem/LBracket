// Self-contained test for DE bracket LB routing fix
function generateId() { return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`; }
function nextPowerOf2(n) { return Math.pow(2, Math.ceil(Math.log2(n))); }

function seedOrder(n) {
  if (n === 2) return [0, 1];
  if (n === 4) return [0, 3, 1, 2];
  if (n === 8) return [0, 7, 3, 4, 1, 6, 2, 5];
  if (n === 16) return [0, 15, 7, 8, 3, 12, 4, 11, 1, 14, 6, 9, 2, 13, 5, 10];
  const half = n / 2; const l = seedOrder(half), r = seedOrder(half); const res = [];
  for (let i = 0; i < half; i++) { res.push(l[i]); res.push(n - 1 - r[i]); } return res;
}

function maxR(m, b) { const f = m.filter(x => x.bracket === b); return f.length ? Math.max(...f.map(x => x.round)) : 0; }
function cp(name, seed) { return { id: generateId(), name, seed, wins: 0, losses: 0, status: 'undefeated' }; }
function fm(m, id) { return m.find(x => x.id === id); }
function fp(p, id) { return p.find(x => x.id === id); }

function genDE(participants) {
  const n = participants.length;
  if (n < 2) return { matches: [], participants };
  const ts = nextPowerOf2(n);
  const k = Math.log2(ts);
  const m = [];
  const sorted = [...participants].sort((a, b) => a.seed - b.seed);
  const slots = new Array(ts).fill(null);
  const so = seedOrder(ts);
  for (let i = 0; i < n; i++) slots[so[i]] = sorted[i];

  const ubRd = [];
  const r1c = ts / 2;
  ubRd[0] = [];
  for (let i = 0; i < r1c; i++) {
    const p1 = slots[i * 2], p2 = slots[i * 2 + 1];
    const isBye = !p1 || !p2;
    const id = generateId();
    m.push({ id, round: 1, bracket: 'upper', position: i,
      participant1Id: p1?.id ?? null, participant2Id: p2?.id ?? null,
      winnerId: isBye ? (p1?.id ?? p2?.id ?? null) : null,
      loserId: null, winnerNextMatchId: null, loserNextMatchId: null,
      completed: isBye, bye: isBye });
    ubRd[0].push(id);
  }

  for (let r = 1; r < k; r++) {
    const cnt = ts / Math.pow(2, r + 1);
    ubRd[r] = [];
    for (let i = 0; i < cnt; i++) {
      const id = generateId();
      m.push({ id, round: r + 1, bracket: 'upper', position: i,
        participant1Id: null, participant2Id: null,
        winnerId: null, loserId: null,
        winnerNextMatchId: null, loserNextMatchId: null,
        completed: false, bye: false });
      ubRd[r].push(id);
    }
    const prev = ubRd[r - 1];
    for (let i = 0; i < cnt; i++) {
      if (prev[i * 2]) { const s1 = m.find(x => x.id === prev[i * 2]); if (s1) s1.winnerNextMatchId = ubRd[r][i]; }
      if (prev[i * 2 + 1]) { const s2 = m.find(x => x.id === prev[i * 2 + 1]); if (s2) s2.winnerNextMatchId = ubRd[r][i]; }
    }
  }

  // BYE PROPAGATION with double-bye cascade detection
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
      if (nm.participant1Id === null) nm.participant1Id = bm.winnerId;
      else nm.participant2Id = bm.winnerId;
      // Double-bye: both feeders are pure byes with same winner
      if (nm.participant1Id === nm.participant2Id && nm.participant1Id !== null) {
        const otherSrc = m.find(x => x.winnerNextMatchId === nm.id && x.id !== bm.id);
        if (otherSrc && otherSrc.bye && otherSrc.completed && !otherSrc.participant1Id && !otherSrc.participant2Id) {
          nm.completed = true; nm.bye = true; nm.winnerId = nm.participant1Id;
        }
      }
      byeChanged = true;
    }
  }

  // LB Rounds
  if (k > 1) {
    const lbRounds = 2 * k - 2;
    const lbRd = [];
    for (let r = 1; r <= lbRounds; r++) {
      const cnt = Math.max(1, Math.pow(2, k - 1 - Math.ceil(r / 2)));
      const ids = [];
      for (let i = 0; i < cnt; i++) {
        const id = generateId();
        m.push({ id, round: r, bracket: 'lower', position: i,
          participant1Id: null, participant2Id: null,
          winnerId: null, loserId: null,
          winnerNextMatchId: null, loserNextMatchId: null,
          completed: false, bye: false });
        ids.push(id);
      }
      lbRd.push(ids);
    }
    for (let ri = 0; ri < lbRd.length; ri++) {
      const r = ri + 1;
      const ids = lbRd[ri];
      const isMixed = r % 2 === 0;
      if (r === 1) {
        for (let i = 0; i < ids.length && i * 2 + 1 < ubRd[0].length; i++) {
          const u1 = m.find(x => x.id === ubRd[0][i * 2]);
          const u2 = m.find(x => x.id === ubRd[0][i * 2 + 1]);
          if (u1 && !u1.bye) u1.loserNextMatchId = ids[i];
          if (u2 && !u2.bye) u2.loserNextMatchId = ids[i];
        }
      } else if (isMixed) {
        const prevIds = lbRd[ri - 1];
        const ubIdx = r / 2;
        const ubIds = ubRd[ubIdx] || [];
        for (let i = 0; i < ids.length; i++) {
          if (i < prevIds.length) { const lw = m.find(x => x.id === prevIds[i]); if (lw) lw.winnerNextMatchId = ids[i]; }
          if (i < ubIds.length) { const um = m.find(x => x.id === ubIds[i]); if (um && !um.bye) um.loserNextMatchId = ids[i]; }
        }
      } else {
        const prevIds = lbRd[ri - 1];
        for (let i = 0; i < ids.length; i++) {
          if (i * 2 < prevIds.length) { const s1 = m.find(x => x.id === prevIds[i * 2]); if (s1) s1.winnerNextMatchId = ids[i]; }
          if (i * 2 + 1 < prevIds.length) { const s2 = m.find(x => x.id === prevIds[i * 2 + 1]); if (s2) s2.winnerNextMatchId = ids[i]; }
        }
      }
    }
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
        if (feederCount === 0) { lb.completed = true; lb.bye = true; phantomChanged = true; }
      }
    }
  }

  const ubFinalId = ubRd[k - 1]?.[0];
  const gfId = generateId();
  if (ubFinalId) { const ubf = m.find(x => x.id === ubFinalId); if (ubf) ubf.winnerNextMatchId = gfId; }
  const lbr = maxR(m, 'lower');
  if (lbr > 0) { for (const lm of m.filter(x => x.bracket === 'lower' && x.round === lbr)) lm.winnerNextMatchId = gfId; }
  m.push({ id: gfId, round: 1, bracket: 'grand-final', position: 0,
    participant1Id: null, participant2Id: null,
    winnerId: null, loserId: null,
    winnerNextMatchId: null, loserNextMatchId: null,
    completed: false, bye: false });
  return { matches: m, participants };
}

// Match completion with routing
function rtWn(t, match, winner) {
  const nid = match.winnerNextMatchId; if (!nid) return t;
  const nm = fm(t.matches, nid); if (!nm) return t;
  t.matches = t.matches.map(m => m.id !== nid ? m :
    m.participant1Id === null ? { ...m, participant1Id: winner.id } :
    m.participant2Id === null ? { ...m, participant2Id: winner.id } : m);
  return t;
}
function rtLs(t, match, loser) {
  const nid = match.loserNextMatchId; if (!nid) return t;
  const nm = fm(t.matches, nid); if (!nm) return t;
  t.matches = t.matches.map(m => m.id !== nid ? m :
    m.participant1Id === null ? { ...m, participant1Id: loser.id } :
    m.participant2Id === null ? { ...m, participant2Id: loser.id } : m);
  return t;
}
function autoB(t) {
  let changed = true;
  while (changed) {
    changed = false;
    for (const match of t.matches) {
      if (match.completed || match.bye) continue;
      if (match.participant1Id && match.participant1Id === match.participant2Id) {
        const w = fp(t.participants, match.participant1Id); if (!w) continue;
        Object.assign(match, { winnerId: match.participant1Id, completed: true, bye: true });
        rtWn(t, match, w); changed = true; break;
      }
      const pc = (match.participant1Id ? 1 : 0) + (match.participant2Id ? 1 : 0);
      if (pc !== 1) continue;
      const sources = t.matches.filter(s => s.winnerNextMatchId === match.id || s.loserNextMatchId === match.id);
      let waitingForSomeone = false;
      for (const src of sources) {
        if (src.bye) continue;
        if (src.completed) continue;
        if (src.participant1Id || src.participant2Id) { waitingForSomeone = true; break; }
      }
      if (waitingForSomeone) continue;
      const wid = match.participant1Id ?? match.participant2Id;
      const w = fp(t.participants, wid); if (!w) continue;
      Object.assign(match, { winnerId: wid, completed: true });
      rtWn(t, match, w); changed = true; break;
    }
  }
  return t;
}

function completeMatch(t, matchId, winnerId) {
  const match = fm(t.matches, matchId); if (!match || match.completed) return t;
  const winner = fp(t.participants, winnerId);
  const loserId = match.participant1Id === winnerId ? match.participant2Id : match.participant1Id;
  const loser = fp(t.participants, loserId); if (!winner || !loser) return t;
  const nl = loser.losses + 1;
  const isLB = match.bracket === 'lower';
  const ns = (nl >= 2 || isLB) ? 'eliminated' : 'lower-bracket';
  winner.wins++;
  loser.losses = nl;
  loser.status = ns;
  if (ns === 'eliminated') loser.eliminatedInRound = match.round;
  Object.assign(match, { winnerId, loserId: loser.id, completed: true });
  rtWn(t, match, winner); rtLs(t, match, loser); autoB(t);
  return t;
}

function simulateTournament(n) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`${n} participants`);
  console.log('='.repeat(50));

  const participants = Array.from({ length: n }, (_, i) => cp(`P${i + 1}`, i + 1));
  const { matches, participants: ps } = genDE(participants);
  const t = { matches, participants: ps };

  const ubM = matches.filter(m => m.bracket === 'upper');
  const lbM = matches.filter(m => m.bracket === 'lower');
  const byes = ubM.filter(m => m.bye);
  console.log(`UB: ${ubM.length} matches (${byes.length} byes), LB: ${lbM.length}, GF: 1`);

  // Verify: bye matches don't route losers
  const byeWithLoserRoute = byes.filter(m => m.loserNextMatchId !== null);
  if (byeWithLoserRoute.length > 0) console.log(`  FAIL: ${byeWithLoserRoute.length} bye matches have loser routing!`);

  // Verify: no UB match has loserNextMatchId pointing to a match that's already full
  let routingErrors = 0;
  for (const ub of ubM) {
    if (ub.loserNextMatchId) {
      const target = fm(matches, ub.loserNextMatchId);
      if (!target) { console.log(`  FAIL: UB R${ub.round} P${ub.position} loserNextMatchId points to non-existent match`); routingErrors++; }
    }
  }

  // Print LB structure
  const lbRounds = [...new Set(lbM.map(m => m.round))].sort((a, b) => a - b);
  console.log('\n  LB structure:');
  for (const r of lbRounds) {
    const rms = lbM.filter(m => m.round === r);
    const srcs = rms.map(lb => {
      const ws = matches.filter(m => m.winnerNextMatchId === lb.id && m.bracket !== 'grand-final');
      const ls = matches.filter(m => m.loserNextMatchId === lb.id);
      const wStr = ws.map(m => `${m.bracket[0].toUpperCase()}${m.round}.${m.position}`).join(',');
      const lStr = ls.map(m => `${m.bracket[0].toUpperCase()}${m.round}.${m.position}`).join(',');
      const parts = [];
      if (wStr) parts.push(`W:${wStr}`);
      if (lStr) parts.push(`L:${lStr}`);
      return parts.join('+') || 'NONE';
    });
    console.log(`    R${r} (${rms.length} matches): ${srcs.join(' | ')}`);
  }

  // Simulate: complete all matches (always pick participant1 as winner)
  console.log('\n  Simulating (always P1 wins)...');
  let rounds = 0;
  const maxRounds = 100;
  while (rounds < maxRounds) {
    rounds++;
    const playable = t.matches.filter(m => !m.completed && !m.bye && m.participant1Id && m.participant2Id);
    if (playable.length === 0) break;
    for (const m of playable) {
      completeMatch(t, m.id, m.participant1Id);
    }
  }

  const remaining = t.matches.filter(m => !m.completed && !m.bye);
  const completed = t.matches.filter(m => m.completed);
  console.log(`  Completed: ${completed.length}/${t.matches.length} in ${rounds} rounds`);
  if (remaining.length > 0) {
    console.log(`  Remaining: ${remaining.map(m => `${m.bracket}R${m.round}P${m.position}(${m.participant1Id ? 'p1' : '-'}/${m.participant2Id ? 'p2' : '-'})`).join(', ')}`);
  }

  // Check elimination status
  const eliminated = t.participants.filter(p => p.status === 'eliminated');
  const active = t.participants.filter(p => p.status !== 'eliminated');
  console.log(`  Eliminated: ${eliminated.length}, Active: ${active.length}`);
  for (const p of t.participants) {
    console.log(`    ${p.name}: W${p.wins} L${p.losses} ${p.status}`);
  }

  // Check GF
  const gf = t.matches.find(m => m.bracket === 'grand-final');
  if (gf) {
    const p1 = gf.participant1Id ? fp(t.participants, gf.participant1Id)?.name : '-';
    const p2 = gf.participant2Id ? fp(t.participants, gf.participant2Id)?.name : '-';
    console.log(`  GF: ${p1} vs ${p2} ${gf.completed ? `(winner: ${fp(t.participants, gf.winnerId)?.name})` : ''}`);
  }

  if (remaining.length === 0 && rounds < maxRounds) {
    console.log('  PASS: All matches resolved!');
  } else if (rounds >= maxRounds) {
    console.log('  FAIL: Infinite loop detected!');
  }
}

[3, 4, 5, 6, 7, 8, 10, 12, 16].forEach(simulateTournament);
