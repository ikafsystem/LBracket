'use client';

import type { Tournament, Match } from '@/types';
import { MatchCard } from './match-card';
import { getRounds } from '@/lib/engine';
import { Trophy } from 'lucide-react';

interface Props {
  tournament: Tournament;
  onCompleteMatch: (matchId: string, winnerId: string) => void;
  disabled?: boolean;
}

const CARD_H = 64;
const GAP = 48;
const ROUND_W = 160;

function computeCenters(matchCounts: number[]): number[][] {
  const result: number[][] = [];
  if (matchCounts.length === 0) return result;
  const spacing = CARD_H + GAP;

  result.push(matchCounts[0] > 0
    ? Array.from({ length: matchCounts[0] }, (_, i) => i * spacing + spacing / 2)
    : []
  );

  for (let r = 1; r < matchCounts.length; r++) {
    const prev = result[r - 1];
    const cur: number[] = [];
    if (matchCounts[r] === matchCounts[r - 1]) {
      for (let p = 0; p < matchCounts[r]; p++) {
        cur.push(prev[p] ?? 0);
      }
    } else {
      for (let p = 0; p < matchCounts[r]; p++) {
        const a = prev[p * 2];
        const b = prev[p * 2 + 1];
        if (a !== undefined && b !== undefined) {
          cur.push((a + b) / 2);
        } else if (matchCounts[r] === 1 && matchCounts[r - 1] === 1) {
          cur.push((a ?? 0) + spacing / 2);
        } else {
          cur.push(a ?? b ?? 0);
        }
      }
    }
    result.push(cur);
  }
  return result;
}

interface Pos {
  match: Match;
  cx: number;
  cy: number;
}

export function DoubleEliminationBracket({ tournament, onCompleteMatch, disabled }: Props) {
  const piMatches = tournament.matches.filter(m => m.bracket === 'play-in');
  const ubMatches = tournament.matches.filter(m => m.bracket === 'upper');
  const lbMatches = tournament.matches.filter(m => m.bracket === 'lower');
  const gfMatch = tournament.matches.find(m => m.bracket === 'grand-final');

  const feederLabels = new Map<string, [string, string]>();
  for (const m of tournament.matches) {
    const labels: (string | null)[] = [null, null];
    const src1 = tournament.matches.find(s => s.winnerNextMatchId === m.id && !s.bye);
    const src2 = tournament.matches.find(s => s.loserNextMatchId === m.id && !s.bye);
    if (src1) labels[0] = `Winner ${src1.label}`;
    if (src2) labels[1] = `Loser ${src2.label}`;
    feederLabels.set(m.id, labels as [string, string]);
  }

  const ubRounds = getRounds(tournament.matches, 'upper');
  const lbRounds = getRounds(tournament.matches, 'lower');

  const ubByRound = ubRounds.map(r => ({
    round: r,
    matches: ubMatches.filter(m => m.round === r).sort((a, b) => a.position - b.position),
  }));

  const lbByRound = lbRounds.map(r => ({
    round: r,
    matches: lbMatches.filter(m => m.round === r).sort((a, b) => a.position - b.position),
  }));

  const ubCenters = computeCenters(ubByRound.map(r => r.matches.length));
  const lbCenters = computeCenters(lbByRound.map(r => r.matches.length));

  const hasPlayIns = piMatches.length > 0;
  const piCol = hasPlayIns ? 0 : -1;
  const ubColOffset = hasPlayIns ? 1 : 0;

  const ubHeight = ubCenters.flat().length > 0 ? Math.max(...ubCenters.flat()) + CARD_H : CARD_H;
  const lbHeight = lbCenters.flat().length > 0 ? Math.max(...lbCenters.flat()) + CARD_H : CARD_H;
  const sectionGap = 60;
  const lbYOffset = ubHeight + sectionGap;

  const gfColumn = Math.max(ubByRound.length, lbByRound.length) + ubColOffset;
  const totalColumns = gfMatch ? gfColumn + 1 : Math.max(ubByRound.length, lbByRound.length) + ubColOffset;

  const allPositions: Pos[] = [];

  // Play-in column (if any)
  if (hasPlayIns) {
    const spacing = CARD_H + GAP;
    piMatches.sort((a, b) => a.position - b.position).forEach((m, mi) => {
      allPositions.push({
        match: m,
        cx: piCol * ROUND_W + ROUND_W / 2,
        cy: mi * spacing + spacing / 2,
      });
    });
  }

  ubByRound.forEach((rd, ri) => {
    const centers = ubCenters[ri] || [];
    rd.matches.forEach((m, mi) => {
      allPositions.push({
        match: m,
        cx: (ri + ubColOffset) * ROUND_W + ROUND_W / 2,
        cy: centers[mi] ?? 0,
      });
    });
  });

  let gfCy = 0;
  if (gfMatch) {
    const ubFinalC = ubCenters[ubCenters.length - 1]?.[0] ?? 0;
    const lbFinalC = lbCenters.length > 0 ? lbCenters[lbCenters.length - 1]?.[0] ?? 0 : 0;
    gfCy = (ubFinalC + lbFinalC + lbYOffset) / 2;

    allPositions.push({
      match: gfMatch,
      cx: gfColumn * ROUND_W + ROUND_W / 2,
      cy: gfCy,
    });
  }

  lbByRound.forEach((rd, ri) => {
    const centers = lbCenters[ri] || [];
    rd.matches.forEach((m, mi) => {
      allPositions.push({
        match: m,
        cx: (ri + ubColOffset) * ROUND_W + ROUND_W / 2,
        cy: (centers[mi] ?? 0) + lbYOffset,
      });
    });
  });

  // uniform top padding so labels aren't clipped
  const minCardTop = allPositions.length > 0
    ? Math.min(...allPositions.map(p => p.cy - CARD_H / 2))
    : 0;
  const topPad = minCardTop < 36 ? 36 - minCardTop : 0;
  if (topPad > 0) {
    allPositions.forEach(p => p.cy += topPad);
    gfCy += topPad;
  }

  const totalHeight = ubHeight + sectionGap + lbHeight + topPad;
  const totalWidth = totalColumns * ROUND_W;

  const visiblePositions = allPositions;

  const connectors: { from: Pos; to: Pos }[] = [];

  for (const pos of visiblePositions) {
    if (pos.match.winnerNextMatchId) {
      const to = visiblePositions.find(p => p.match.id === pos.match.winnerNextMatchId);
      if (to) connectors.push({ from: pos, to });
    }
  }

  const champion = tournament.championId
    ? tournament.participants.find(p => p.id === tournament.championId)
    : null;

  // column labels
  const columnLabels: { ub?: string; lb?: string; pi?: string }[] = [];
  for (let i = 0; i < totalColumns; i++) {
    const label: { ub?: string; lb?: string; pi?: string } = {};
    if (hasPlayIns && i === piCol) {
      label.pi = 'Play-In';
    } else {
      const ubIdx = i - ubColOffset;
      if (ubIdx >= 0 && ubIdx < ubByRound.length) {
        label.ub = ubIdx === ubByRound.length - 1 ? 'Upper Final' : `Round ${ubIdx + 1}`;
      }
      if (gfMatch && i === gfColumn) {
        label.ub = 'Grand Final';
      } else {
        const lbIdx = i - ubColOffset;
        if (lbIdx >= 0 && lbIdx < lbByRound.length) {
          label.lb = lbIdx === lbByRound.length - 1 ? 'Lower Final' : `Losers R${lbIdx + 1}`;
        }
      }
    }
    columnLabels.push(label);
  }

  // topmost card Y per column & section for label placement
  const colTopY: Record<number, { ub: number; lb: number; pi: number }> = {};
  for (const pos of visiblePositions) {
    const col = Math.round((pos.cx - ROUND_W / 2) / ROUND_W);
    if (!colTopY[col]) colTopY[col] = { ub: Infinity, lb: Infinity, pi: Infinity };
    let key: 'ub' | 'lb' | 'pi';
    if (pos.match.bracket === 'lower') key = 'lb';
    else if (pos.match.bracket === 'play-in') key = 'pi';
    else key = 'ub';
    const cardTop = pos.cy - CARD_H / 2;
    if (cardTop < colTopY[col][key]) colTopY[col][key] = cardTop;
  }

  const labelGap = 22;

  return (
    <div className="overflow-auto h-full pb-4">
      <div className="relative" style={{ width: totalWidth, height: Math.max(totalHeight, 400), minWidth: totalWidth }}>
        <svg
          className="absolute inset-0 pointer-events-none"
          width={totalWidth}
          height={Math.max(totalHeight, 400)}
          style={{ overflow: 'visible' }}
        >
          {connectors.map(({ from, to }) => {
            const x1 = from.cx + ROUND_W / 2 - 8;
            const y1 = from.cy;
            const x2 = to.cx - ROUND_W / 2 + 8;
            const y2 = to.cy;
            const midX = (x1 + x2) / 2;

            const path = y1 === y2
              ? `M ${x1} ${y1} L ${x2} ${y2}`
              : `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;

            const isGfConnector = to.match.bracket === 'grand-final';

            return (
              <path
                key={`${from.match.id}-${to.match.id}`}
                d={path}
                fill="none"
                stroke={isGfConnector ? '#f59e0b' : '#475569'}
                strokeWidth={isGfConnector ? 2 : 1.5}
                strokeLinejoin="round"
              />);
          })}
        </svg>

        {/* dynamic column labels */}
        {columnLabels.map((label, i) => {
          const yOff = colTopY[i] || { ub: Infinity, lb: Infinity };
          return (
            <div key={i}>
              {label.ub && yOff.ub !== Infinity && (
                <div
                  className="absolute text-center pointer-events-none"
                  style={{ left: i * ROUND_W, width: ROUND_W, top: yOff.ub - labelGap }}
                >
                  <span className={`text-[11px] font-semibold uppercase tracking-wider ${
                    label.ub === 'Grand Final' ? 'text-amber-400' : 'text-slate-400'
                  }`}>
                    {label.ub}
                  </span>
                </div>
              )}
              {label.lb && yOff.lb !== Infinity && (
                <div
                  className="absolute text-center pointer-events-none"
                  style={{ left: i * ROUND_W, width: ROUND_W, top: yOff.lb - labelGap }}
                >
                  <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                    {label.lb}
                  </span>
                </div>
              )}
              {label.pi && yOff.pi !== Infinity && (
                <div
                  className="absolute text-center pointer-events-none"
                  style={{ left: i * ROUND_W, width: ROUND_W, top: yOff.pi - labelGap }}
                >
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400">
                    {label.pi}
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {/* section labels */}
        <div className="absolute text-[13px] font-bold text-white underline decoration-1 underline-offset-2 uppercase tracking-wider"
          style={{ top: 0, left: 3 }}>
          Upper Bracket
        </div>
        <div className="absolute text-[13px] font-bold text-white underline decoration-1 underline-offset-2 uppercase tracking-wider"
          style={{ top: topPad + ubHeight + sectionGap / 2 - 8, left: 3 }}>
          Lower Bracket
        </div>

        {/* match cards */}
        {visiblePositions.map(pos => (
          <div
            key={pos.match.id}
            className="absolute"
            style={{
              left: pos.cx - ROUND_W / 2 + 8,
              top: pos.cy - CARD_H / 2,
              width: ROUND_W - 16,
            }}
          >
            <MatchCard
              match={pos.match}
              participants={tournament.participants}
              onComplete={onCompleteMatch}
              disabled={disabled}
              feederLabels={feederLabels.get(pos.match.id)}
              className={pos.match.bracket === 'grand-final'
                ? 'ring-2 ring-amber-400/60 border-amber-400'
                : undefined}
            />
          </div>
        ))}

        {/* champion box */}
        {champion && (
          <div
            className="absolute p-3 rounded-xl border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-yellow-100 shadow-lg shadow-amber-200/50 flex flex-col items-center gap-1 min-w-[150px]"
            style={{
              left: gfColumn * ROUND_W + ROUND_W / 2 - 75,
              top: (() => {
                const gfPos = visiblePositions.find(p => p.match.bracket === 'grand-final');
                return (gfPos?.cy ?? 0) + CARD_H / 2 + 20;
              })(),
              marginTop: '10%',
            }}
          >
            <Trophy className="h-6 w-6 text-amber-500" />
            <span className="text-sm font-bold text-amber-800 text-center leading-tight">
              {champion.name}
            </span>
            {champion.teamName && (
              <span className="text-[10px] text-amber-600">{champion.teamName}</span>
            )}
            {tournament.prize && (
              <span className="text-[11px] font-semibold text-amber-700 mt-0.5">
                Prize: {tournament.prize}
              </span>
            )}
            <span className="text-[10px] text-amber-500 font-medium uppercase tracking-wider mt-0.5">
              Champion
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
