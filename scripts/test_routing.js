// Standalone test to check LB routing
const crypto = require('crypto');

function generateId() { return crypto.randomUUID(); }

function largestPow2LE(n) { return Math.pow(2, Math.floor(Math.log2(n))); }
function nextPowerOf2(n) { return Math.pow(2, Math.ceil(Math.log2(n))); }

function assignMatchLabels(matches) {
  let pi = 0, ub = 0, lb = 0;
  for (const m of matches) {
    if (m.bracket === 'play-in') m.label = `P${++pi}`;
    else if (m.bracket === 'upper') m.label = `UB${++ub}`;
    else if (m.bracket === 'lower') m.label = `LB${++lb}`;
    else if (m.bracket === 'grand-final') m.label = 'GF';
  }
}

// Replicate generateLbAndGrandFinal
function generateLbAndGrandFinal(matches, ubRoundMatches, lbRoundMatches, bracketSize, extraFirstRoundLoserMatchIds) {
  const k = Math.log2(bracketSize);
  if (k <= 1) return;

  const ubSizes = [];
  for (let r = 0; r < k; r++) {
    ubSizes.push(bracketSize / Math.pow(2, r + 1));
  }

  const extraR1Matches = Math.ceil((extraFirstRoundLoserMatchIds || []).length / 2);
  const initialLbMatchCount = ubSizes[1] + extraR1Matches;
  const totalMixedRounds = Math.ceil(Math.log2(initialLbMatchCount)) + 1;
  const lbRounds = 2 * totalMixedRounds;
  let lbMatchCount = initialLbMatchCount;

  for (let lbRound = 1; lbRound <= lbRounds; lbRound++) {
    const isPure = lbRound % 2 === 1;
    const roundIds = [];
    for (let i = 0; i < lbMatchCount; i++) {
      const id = generateId();
      roundIds.push(id);
      matches.push({
        id, round: lbRound, bracket: 'lower', position: i,
        participant1Id: null, participant2Id: null,
        winnerId: null, loserId: null,
        winnerNextMatchId: null, loserNextMatchId: null,
        completed: false, bye: false,
      });
    }
    lbRoundMatches.push(roundIds);

    if (isPure) {
      if (lbRound === 1) {
        for (let i = 0; i < ubSizes[1]; i++) {
          const ubMatch1 = matches.find(m => m.id === ubRoundMatches[0][i * 2]);
          const ubMatch2 = matches.find(m => m.id === ubRoundMatches[0][i * 2 + 1]);
          if (ubMatch1 && !ubMatch1.bye) ubMatch1.loserNextMatchId = roundIds[i];
          if (ubMatch2 && !ubMatch2.bye) ubMatch2.loserNextMatchId = roundIds[i];
        }
        for (let e = 0; e < (extraFirstRoundLoserMatchIds || []).length; e++) {
          const targetIdx = ubSizes[1] + Math.floor(e / 2);
          const extraMatch = matches.find(m => m.id === extraFirstRoundLoserMatchIds[e]);
          if (extraMatch) extraMatch.loserNextMatchId = roundIds[targetIdx];
        }
      } else {
        const prevMixed = lbRoundMatches[lbRound - 2];
        for (let i = 0; i < lbMatchCount; i++) {
          const src1 = matches.find(m => m.id === prevMixed?.[i * 2]);
          const src2 = matches.find(m => m.id === prevMixed?.[i * 2 + 1]);
          if (src1) src1.winnerNextMatchId = roundIds[i];
          if (src2) src2.winnerNextMatchId = roundIds[i];
        }
      }
    } else {
      const prevPure = lbRoundMatches[lbRound - 2];
      for (let i = 0; i < lbMatchCount; i++) {
        const prevLB = matches.find(m => m.id === prevPure?.[i]);
        if (prevLB) prevLB.winnerNextMatchId = roundIds[i];
        const ubMatch = matches.find(m => m.id === (ubRoundMatches[lbRound / 2] || [])[i]);
        if (ubMatch && !ubMatch.bye) ubMatch.loserNextMatchId = roundIds[i];
      }
    }

    if (lbRound % 2 === 0) {
      lbMatchCount = Math.ceil(lbMatchCount / 2);
    }
  }
}

// Test with 18 participants
const n = 18;
const potBracketSize = largestPow2LE(n);
const playInCount = n - potBracketSize;
const directCount = potBracketSize - playInCount;
const bracketSize = potBracketSize;

const matches = [];
const ubRoundMatches = [];
const lbRoundMatches = [];

console.log(`n=${n}, potBracketSize=${potBracketSize}, playInCount=${playInCount}, directCount=${directCount}`);

// Play-in matches
const playInMatchIds = [];
for (let i = 0; i < playInCount; i++) {
  const id = generateId();
  playInMatchIds.push(id);
  matches.push({
    id, round: 1, bracket: 'play-in', position: i,
    participant1Id: 'p' + (directCount + i * 2 + 1),
    participant2Id: 'p' + (directCount + i * 2 + 2),
    winnerId: null, loserId: null,
    winnerNextMatchId: null, loserNextMatchId: null,
    completed: false, bye: false,
  });
}

// UB R1
const r1Count = bracketSize / 2;
const r1MatchIds = [];
for (let i = 0; i < r1Count; i++) {
  const id = generateId();
  r1MatchIds.push(id);
  matches.push({
    id, round: 1, bracket: 'upper', position: i,
    participant1Id: null, participant2Id: null,
    winnerId: null, loserId: null,
    winnerNextMatchId: null, loserNextMatchId: null,
    completed: false, bye: false,
  });
  if (!ubRoundMatches[0]) ubRoundMatches[0] = [];
  ubRoundMatches[0].push(id);
}

// Fill R1 direct entries
for (let s = 0; s < directCount; s++) {
  const matchIdx = Math.floor(s / 2);
  const isP1 = s % 2 === 0;
  const match = matches.find(m => m.id === r1MatchIds[matchIdx]);
  if (isP1) match.participant1Id = 'p' + (s + 1);
  else match.participant2Id = 'p' + (s + 1);
}

// Route play-in winners to remaining R1 slots
for (let i = 0; i < playInCount; i++) {
  const targetSlot = directCount + i;
  const targetMatchIdx = Math.floor(targetSlot / 2);
  const playInMatch = matches[i]; // play-in matches are at the beginning
  playInMatch.winnerNextMatchId = r1MatchIds[targetMatchIdx];
}

// UB R2, R3, R4
const k = Math.log2(bracketSize);
for (let r = 1; r < k; r++) {
  const count = bracketSize / Math.pow(2, r + 1);
  for (let i = 0; i < count; i++) {
    const id = generateId();
    matches.push({
      id, round: r + 1, bracket: 'upper', position: i,
      participant1Id: null, participant2Id: null,
      winnerId: null, loserId: null,
      winnerNextMatchId: null, loserNextMatchId: null,
      completed: false, bye: false,
    });
    if (!ubRoundMatches[r]) ubRoundMatches[r] = [];
    ubRoundMatches[r].push(id);
  }
}

// UB winner routing
for (let r = 0; r < k - 1; r++) {
  for (let i = 0; i < ubRoundMatches[r + 1].length; i++) {
    const nextId = ubRoundMatches[r + 1][i];
    const src1 = matches.find(m => m.id === ubRoundMatches[r][i * 2]);
    const src2 = matches.find(m => m.id === ubRoundMatches[r][i * 2 + 1]);
    if (src1) src1.winnerNextMatchId = nextId;
    if (src2) src2.winnerNextMatchId = nextId;
  }
}

// Generate LB
generateLbAndGrandFinal(matches, ubRoundMatches, lbRoundMatches, bracketSize, playInMatchIds);

// GF
const grandFinalId = generateId();
const ubFinalId = ubRoundMatches[k - 1]?.[0];
const ubFinalMatch = matches.find(m => m.id === ubFinalId);
if (ubFinalMatch) ubFinalMatch.winnerNextMatchId = grandFinalId;

if (lbRoundMatches.length > 0) {
  const lbFinalId = lbRoundMatches[lbRoundMatches.length - 1]?.[0];
  const lbFinalMatch = matches.find(m => m.id === lbFinalId);
  if (lbFinalMatch) lbFinalMatch.winnerNextMatchId = grandFinalId;
}

matches.push({
  id: grandFinalId, round: 1, bracket: 'grand-final', position: 0,
  participant1Id: null, participant2Id: null,
  winnerId: null, loserId: null,
  winnerNextMatchId: null, loserNextMatchId: null,
  completed: false, bye: false,
});

assignMatchLabels(matches);

// Dump LB R1 -> R2 routing
console.log("\n=== LB R1 matches ===");
const lbR1 = matches.filter(m => m.bracket === 'lower' && m.round === 1).sort((a,b) => a.position - b.position);
lbR1.forEach(m => {
  const target = matches.find(m2 => m2.id === m.winnerNextMatchId);
  console.log(`  ${m.label} (pos=${m.position}) -> ${target ? target.label + ' (pos=' + target.position + ', round=' + target.round + ')' : 'N/A'}`);
});

console.log("\n=== LB R2 matches ===");
const lbR2 = matches.filter(m => m.bracket === 'lower' && m.round === 2).sort((a,b) => a.position - b.position);
lbR2.forEach(m => {
  const sources = matches.filter(m2 => m2.winnerNextMatchId === m.id || m2.loserNextMatchId === m.id);
  console.log(`  ${m.label} (pos=${m.position}) sources: ${sources.map(s => s.label).join(', ')}`);
});
