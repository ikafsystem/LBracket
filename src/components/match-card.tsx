'use client';

import type { Match, Participant } from '@/types';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

interface MatchCardProps {
  match: Match;
  participants: Participant[];
  onComplete: (matchId: string, winnerId: string) => void;
  className?: string;
  feederLabels?: [string, string];
}

export function MatchCard({ match, participants, onComplete, className, feederLabels }: MatchCardProps) {
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null);

  if (match.bye) return null;

  const p1 = participants.find((p) => p.id === match.participant1Id);
  const p2 = participants.find((p) => p.id === match.participant2Id);

  const p1Won = match.winnerId === p1?.id;
  const p2Won = match.winnerId === p2?.id;

  const handleSelect = (id: string) => {
    if (match.completed) return;
    setSelectedWinner(id);
    onComplete(match.id, id);
  };

  const participantSlot = (participant: Participant | undefined, won: boolean, side: 'top' | 'bottom', feederLabel?: string) => {
    const isEmpty = !participant;

    if (match.completed && isEmpty) return null;

    const label = isEmpty && feederLabel ? feederLabel : (participant?.name ?? 'TBD');
    const isPlaceholder = isEmpty && !!feederLabel;

    return (
      <button
        onClick={() => participant && handleSelect(participant.id)}
        disabled={match.completed || isEmpty}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-all duration-150 rounded-md',
          side === 'top' ? 'rounded-b-none' : 'rounded-t-none',
          !match.completed && !isEmpty
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
        <div className="flex-1 min-w-0 text-left">
          <span className={cn(
            'truncate block leading-tight',
            isEmpty && 'text-slate-300 italic',
            isPlaceholder && 'text-[11px]'
          )}>
            {label}
          </span>
          {participant?.teamName && (
            <span className="text-[10px] text-slate-400 truncate block leading-tight">
              {participant.teamName}
            </span>
          )}
        </div>
        {participant && (
          <span className="text-[10px] text-slate-400 shrink-0">#{participant.seed}</span>
        )}
      </button>
    );
  };

  return (
    <div className={cn(
      'rounded-lg border bg-white shadow-sm overflow-hidden min-w-[140px] border-slate-200',
      match.completed && 'border-blue-200',
      className
    )}>
      {participantSlot(p1, p1Won, 'top', feederLabels?.[0])}
      {match.label && (
        <div className="flex items-center gap-1.5 px-1.5">
          <hr className="flex-1 border-t border-slate-200" />
          <span className={cn(
            'text-[9px] font-semibold uppercase tracking-wider shrink-0',
            match.bracket === 'play-in' && 'text-indigo-400',
            match.bracket === 'grand-final' && 'text-amber-500',
            match.bracket !== 'play-in' && match.bracket !== 'grand-final' && 'text-slate-400',
          )}>
            {match.label}
          </span>
          <hr className="flex-1 border-t border-slate-200" />
        </div>
      )}
      {participantSlot(p2, p2Won, 'bottom', feederLabels?.[1])}
    </div>
  );
}
