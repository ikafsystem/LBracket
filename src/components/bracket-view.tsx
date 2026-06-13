'use client';

import type { Tournament } from '@/types';
import { MatchCard } from './match-card';
import { getRounds } from '@/lib/engine';
import { cn } from '@/lib/utils';

interface BracketViewProps {
  tournament: Tournament;
  onCompleteMatch: (matchId: string, winnerId: string) => void;
  bracket: 'winners' | 'losers';
  title: string;
}

export function BracketView({
  tournament,
  onCompleteMatch,
  bracket,
  title,
}: BracketViewProps) {
  const rounds = getRounds(tournament.matches, bracket);

  if (rounds.length === 0) return null;

  const matchesForBracket = tournament.matches.filter(
    (m) => m.bracket === bracket
  );

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
        {title}
      </h3>
      {rounds.map((round, roundIdx) => {
        const roundMatches = matchesForBracket.filter(
          (m) => m.round === round
        );
        const nonBye = roundMatches.filter((m) => !m.bye);
        if (nonBye.length === 0) return null;

        return (
          <div key={round} className="space-y-2">
            {rounds.length > 1 && (
              <div className="flex items-center gap-2 mb-1">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                  Round {round}
                </span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>
            )}
            <div
              className={cn(
                'grid gap-2',
                nonBye.length <= 2
                  ? 'grid-cols-1 sm:grid-cols-2'
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
              )}
            >
              {nonBye.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  participants={tournament.participants}
                  onComplete={onCompleteMatch}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
