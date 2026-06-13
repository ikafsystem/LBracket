'use client';

import type { Match, Participant } from '@/types';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

interface MatchCardProps {
  match: Match;
  participants: Participant[];
  onComplete: (matchId: string, winnerId: string) => void;
}

export function MatchCard({ match, participants, onComplete }: MatchCardProps) {
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null);

  if (match.bye) return null;
  if (!match.participant1Id && !match.participant2Id && !match.completed) return null;

  const p1 = participants.find((p) => p.id === match.participant1Id);
  const p2 = participants.find((p) => p.id === match.participant2Id);

  const p1Won = match.winnerId === p1?.id;
  const p2Won = match.winnerId === p2?.id;

  const handleSelect = (id: string) => {
    if (match.completed) return;
    setSelectedWinner(id);
    onComplete(match.id, id);
  };

  const participantSlot = (participant: Participant | undefined, won: boolean, side: 'top' | 'bottom') => {
    const isActive = match.participant1Id !== null && match.participant2Id !== null;
    const isEmpty = !participant;

    return (
      <button
        onClick={() => participant && handleSelect(participant.id)}
        disabled={match.completed || isEmpty || !isActive}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-all duration-150 rounded-md',
          side === 'top' ? 'rounded-b-none' : 'rounded-t-none border-t',
          !match.completed && isActive && !isEmpty
            ? 'hover:bg-blue-50 cursor-pointer active:bg-blue-100'
            : '',
          match.completed && won
            ? 'bg-blue-50 text-blue-700 font-medium'
            : match.completed && !won && !isEmpty
              ? 'bg-slate-50 text-slate-400'
              : '',
          !match.completed && selectedWinner === participant?.id
            ? 'bg-blue-50 ring-1 ring-blue-300'
            : ''
        )}
      >
        {match.completed && won && (
          <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" />
        )}
        {match.completed && !won && !isEmpty && (
          <span className="w-4 shrink-0" />
        )}
        <span className={cn(
          'truncate flex-1 text-left',
          isEmpty && 'text-slate-300 italic'
        )}>
          {participant?.name ?? 'TBD'}
        </span>
        {participant && (
          <span className="text-xs text-slate-400">#{participant.seed}</span>
        )}
      </button>
    );
  };

  return (
    <div className={cn(
      'rounded-lg border bg-white shadow-sm overflow-hidden',
      !match.completed && match.participant1Id && match.participant2Id
        ? 'border-slate-200'
        : match.completed
          ? 'border-blue-200'
          : 'border-slate-100 bg-slate-50/50'
    )}>
      {participantSlot(p1, p1Won, 'top')}
      {participantSlot(p2, p2Won, 'bottom')}
    </div>
  );
}
