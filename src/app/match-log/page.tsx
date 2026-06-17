'use client';

import { Suspense } from 'react';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getTournament } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Swords } from 'lucide-react';
import type { Tournament, Match } from '@/types';

const bracketLabel: Record<string, string> = {
  winners: 'Winners',
  losers: 'Losers',
  upper: 'Upper',
  lower: 'Lower',
  'grand-final': 'Grand Final',
};

const bracketColor: Record<string, string> = {
  winners: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  losers: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  upper: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  lower: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'grand-final': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

export default function MatchLogPageWrapper() {
  return (
    <Suspense fallback={<div className="p-4 space-y-3 animate-pulse"><div className="h-8 bg-slate-800 rounded-lg w-1/2" />{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-slate-800 rounded-xl" />)}</div>}>
      <MatchLogPage />
    </Suspense>
  );
}

function MatchLogPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!id) { setLoading(false); return; }
    try {
      const t = await getTournament(id);
      setTournament(t ?? null);
    } catch {
      setTournament(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return (
      <div className="p-4 space-y-3 animate-pulse">
        <div className="h-8 bg-slate-800 rounded-lg w-1/2" />
        {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-slate-800 rounded-xl" />)}
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="p-4 pt-12 text-center">
        <p className="text-slate-400">Tournament not found</p>
        <Button variant="ghost" onClick={() => router.push('/')} className="mt-4">Go Home</Button>
      </div>
    );
  }

  const completedMatches = tournament.matches
    .filter((m) => m.completed)
    .sort((a, b) => b.round - a.round || a.position - b.position);

  const getParticipantName = (id: string | null) => {
    if (!id) return '—';
    return tournament.participants.find((p) => p.id === id)?.name ?? 'Unknown';
  };

  const getParticipantTeam = (id: string | null) => {
    if (!id) return;
    return tournament.participants.find((p) => p.id === id)?.teamName;
  };

  return (
    <div className="pb-24">
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-lg hover:bg-[#2557D6]/20 transition-colors">
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          <div>
            <h1 className="text-lg font-bold">Match Log</h1>
            <p className="text-xs text-slate-400">{tournament.name}</p>
          </div>
        </div>
      </div>

      {completedMatches.length === 0 ? (
        <div className="text-center py-16">
          <Swords className="h-10 w-10 mx-auto text-slate-600 mb-3" />
          <p className="text-slate-400 font-medium">No matches completed yet</p>
          <p className="text-sm text-slate-500 mt-1">Complete matches to see the log</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-800">
          {completedMatches.map((match) => {
            const isWinner1 = match.winnerId === match.participant1Id;
            return (
              <div key={match.id} className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-[10px] ${bracketColor[match.bracket] || ''}`}>
                    {bracketLabel[match.bracket] || match.bracket}
                  </Badge>
                  <span className="text-xs text-slate-500">Round {match.round}</span>
                  {match.bye && (
                    <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-700">Bye</Badge>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className={`flex-1 min-w-0 p-2 rounded-lg ${isWinner1 ? 'bg-emerald-900/20 border border-emerald-800/30' : 'bg-slate-800/50'}`}>
                    <p className="text-sm font-medium truncate">
                      {getParticipantName(match.participant1Id)}
                    </p>
                    {match.participant1Id && getParticipantTeam(match.participant1Id) && (
                      <p className="text-[10px] text-slate-500 truncate">{getParticipantTeam(match.participant1Id)}</p>
                    )}
                  </div>

                  <span className="text-xs text-slate-600 shrink-0">VS</span>

                  <div className={`flex-1 min-w-0 p-2 rounded-lg ${!isWinner1 && match.winnerId ? 'bg-emerald-900/20 border border-emerald-800/30' : 'bg-slate-800/50'}`}>
                    <p className="text-sm font-medium truncate">
                      {getParticipantName(match.participant2Id)}
                    </p>
                    {match.participant2Id && getParticipantTeam(match.participant2Id) && (
                      <p className="text-[10px] text-slate-500 truncate">{getParticipantTeam(match.participant2Id)}</p>
                    )}
                  </div>
                </div>

                {match.winnerId && (
                  <p className="text-xs text-emerald-400 text-center">
                    Winner: {getParticipantName(match.winnerId)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
