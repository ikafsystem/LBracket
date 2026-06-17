'use client';

import type { Tournament } from '@/types';
import { MatchCard } from './match-card';
import { getRounds } from '@/lib/engine';
import { cn } from '@/lib/utils';

interface BracketViewProps {
  tournament: Tournament;
  onCompleteMatch: (matchId: string, winnerId: string) => void;
  bracket: 'winners' | 'losers';
}

export function BracketView({
  tournament,
  onCompleteMatch,
  bracket,
}: BracketViewProps) {
  const rounds = getRounds(tournament.matches, bracket);

  if (rounds.length === 0) return null;

  const matchesForBracket = tournament.matches.filter(
    (m) => m.bracket === bracket
  );

  return (
    <div className="space-y-6">
      {rounds.map((round, roundIdx) => {
        const roundMatches = matchesForBracket.filter(
          (m) => m.round === round
        );
        const activeMatches = roundMatches.filter(
          (m) => !m.bye && (m.completed || m.participant1Id !== null || m.participant2Id !== null)
        );
        if (activeMatches.length === 0) return null;

        return (
          <div key={round}>
            {rounds.length > 1 && (
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                  Round {round}
                </span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>
            )}
            <div
              className={cn(
                'flex flex-wrap gap-3',
                activeMatches.length === 1 && 'justify-center'
              )}
            >
              {activeMatches.map((match) => (
                <div key={match.id} className="min-w-0 flex-shrink-0">
                  <MatchCard
                    match={match}
                    participants={tournament.participants}
                    onComplete={onCompleteMatch}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
