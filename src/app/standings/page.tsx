'use client';

import { Suspense } from 'react';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getTournament } from '@/lib/db';
import { getParticipantMatchHistory } from '@/lib/engine';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, Swords, Skull } from 'lucide-react';
import type { Tournament } from '@/types';

const statusConfig = {
  undefeated: { label: 'Undefeated', variant: 'success' as const, icon: Trophy },
  'lower-bracket': { label: 'Lower Bracket', variant: 'warning' as const, icon: Swords },
  eliminated: { label: 'Eliminated', variant: 'destructive' as const, icon: Skull },
};

export default function StandingsPageWrapper() {
  return (
    <Suspense fallback={<div className="p-4 space-y-3 animate-pulse"><div className="h-8 bg-slate-800 rounded-lg w-1/2" />{[1, 2, 3, 4].map((i) => <div key={i} className="h-16 bg-slate-800 rounded-xl" />)}</div>}>
      <StandingsPage />
    </Suspense>
  );
}

function StandingsPage() {
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
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-16 bg-slate-800 rounded-xl" />)}
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

  const sorted = [...tournament.participants].sort((a, b) => {
    if (a.status !== b.status) {
      const order = { undefeated: 0, 'lower-bracket': 1, eliminated: 2 };
      return order[a.status] - order[b.status];
    }
    if (a.wins !== b.wins) return b.wins - a.wins;
    return a.losses - b.losses;
  });

  return (
    <div className="pb-24">
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-lg hover:bg-slate-800 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold">Standings</h1>
            <p className="text-xs text-slate-400">{tournament.name}</p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-slate-800">
        {sorted.map((p, i) => {
          const config = statusConfig[p.status];
          const Icon = config.icon;
          return (
            <div key={p.id} className="p-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono text-slate-500 w-6">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{p.name}</span>
                    <Badge variant={config.variant} className="shrink-0">
                      <Icon className="h-3 w-3 mr-1 inline" />
                      {config.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    <span>W: <span className="text-emerald-400">{p.wins}</span></span>
                    <span>L: <span className="text-red-400">{p.losses}</span></span>
                    <span>Seed: <span className="text-slate-400">#{p.seed}</span></span>
                  </div>
                </div>
                <div className="text-right">
                  {tournament.championId === p.id && <Trophy className="h-5 w-5 text-amber-400" />}
                  {tournament.secondPlaceId === p.id && <Trophy className="h-5 w-5 text-slate-400" />}
                  {tournament.loserIds?.includes(p.id) && <Skull className="h-5 w-5 text-red-400" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
