'use client';

import { Suspense } from 'react';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getTournament } from '@/lib/db';
import { getEliminatedParticipants } from '@/lib/engine';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skull, ArrowLeft, Crosshair } from 'lucide-react';
import type { Tournament } from '@/types';

export default function EliminatedPageWrapper() {
  return (
    <Suspense fallback={<div className="p-4 space-y-3 animate-pulse"><div className="h-8 bg-slate-800 rounded-lg w-1/2" />{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-slate-800 rounded-xl" />)}</div>}>
      <EliminatedPage />
    </Suspense>
  );
}

function EliminatedPage() {
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

  const eliminated = getEliminatedParticipants(tournament.participants);

  return (
    <div className="pb-24">
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-lg hover:bg-[#2557D6]/20 transition-colors">
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          <div>
            <h1 className="text-lg font-bold">Eliminated</h1>
            <p className="text-xs text-slate-400">{tournament.name}</p>
          </div>
        </div>
      </div>

      {eliminated.length === 0 ? (
        <div className="text-center py-16">
          <Skull className="h-10 w-10 mx-auto text-slate-600 mb-3" />
          <p className="text-slate-400 font-medium">No one eliminated yet</p>
          <p className="text-sm text-slate-500 mt-1">The bracket is still in progress</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-800">
          {eliminated.map((p, i) => (
            <div key={p.id} className="p-4 flex items-center gap-3">
              <span className="text-sm font-mono text-slate-600 w-6">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <span className="font-medium">{p.name}</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-500">
                    W: <span className="text-emerald-400">{p.wins}</span> L: <span className="text-red-400">{p.losses}</span>
                  </span>
                </div>
              </div>
              <Badge variant="destructive" className="shrink-0">
                <Crosshair className="h-3 w-3 mr-1" />
                R{p.eliminatedInRound ?? '?'}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
