'use client';

import { Suspense } from 'react';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getTournament, saveTournament } from '@/lib/db';
import { completeMatch } from '@/lib/engine';
import { speakLoser, speakLosersComplete } from '@/lib/tts';
import { BracketView } from '@/components/bracket-view';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatsCard } from '@/components/stats-card';
import {
  ArrowLeft,
  Trophy,
  Users,
  Swords,
  Skull,
  ListOrdered,
} from 'lucide-react';
import type { Tournament } from '@/types';

export default function TournamentPageWrapper() {
  return (
    <Suspense fallback={<div className="p-4 space-y-4 animate-pulse"><div className="h-8 bg-slate-800 rounded-lg w-2/3" /><div className="h-24 bg-slate-800 rounded-xl" /><div className="h-32 bg-slate-800 rounded-xl" /></div>}>
      <TournamentPage />
    </Suspense>
  );
}

function TournamentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'winners' | 'losers'>('winners');

  const loadTournament = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    try {
      const t = await getTournament(id);
      setTournament(t ?? null);
    } catch {
      setTournament(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTournament();
  }, [loadTournament]);

  const handleCompleteMatch = useCallback(
    async (matchId: string, winnerId: string) => {
      if (!tournament) return;
      const match = tournament.matches.find((m) => m.id === matchId);
      if (!match) return;
      const loserId =
        match.participant1Id === winnerId
          ? match.participant2Id
          : match.participant1Id;
      if (loserId) {
        const loser = tournament.participants.find((p) => p.id === loserId);
        if (loser) void speakLoser(loser.name, loser.losses);
      }
      const updated = completeMatch(tournament, matchId, winnerId);
      setTournament(updated);
      await saveTournament(updated);
      if (updated.status === 'completed' && updated.loserIds) {
        const names = updated.loserIds
          .map((id) => updated.participants.find((p) => p.id === id)?.name)
          .filter((n): n is string => !!n);
        if (names.length > 0) void speakLosersComplete(names);
      }
    },
    [tournament]
  );

  if (!id) {
    return (
      <div className="p-4 pt-12 text-center">
        <p className="text-slate-400">No tournament specified</p>
        <Button variant="ghost" onClick={() => router.push('/')} className="mt-4">
          Go Home
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 space-y-4 animate-pulse">
        <div className="h-8 bg-slate-800 rounded-lg w-2/3" />
        <div className="h-24 bg-slate-800 rounded-xl" />
        <div className="h-32 bg-slate-800 rounded-xl" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="p-4 pt-12 text-center">
        <p className="text-slate-400">Tournament not found</p>
        <Button variant="ghost" onClick={() => router.push('/')} className="mt-4">
          Go Home
        </Button>
      </div>
    );
  }

  const undefeated = tournament.participants.filter(
    (p) => p.status === 'undefeated'
  ).length;
  const lowerBracket = tournament.participants.filter(
    (p) => p.status === 'lower-bracket'
  ).length;
  const eliminated = tournament.participants.filter(
    (p) => p.status === 'eliminated'
  ).length;

  return (
    <>    <div className="pb-36">
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => router.push('/')}
            className="p-2 -ml-2 rounded-lg hover:bg-[#2557D6]/20 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold truncate">
                {tournament.name}
              </h1>
              <Badge
                variant={
                  tournament.status === 'completed'
                    ? 'success'
                    : 'default'
                }
                className="shrink-0"
              >
                {tournament.status}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <StatsCard
            title="Players"
            value={tournament.participants.length}
            icon={<Users className="h-4 w-4" />}
          />
          <StatsCard
            title="0 Loss"
            value={undefeated}
            icon={<Trophy className="h-4 w-4" />}
            variant="success"
          />
          <StatsCard
            title="1 Loss"
            value={lowerBracket}
            icon={<Swords className="h-4 w-4" />}
            variant="warning"
          />
          <StatsCard
            title="Out"
            value={eliminated}
            icon={<Skull className="h-4 w-4" />}
            variant="destructive"
          />
        </div>

        {tournament.status === 'completed' && (
          <div className="mt-3 p-3 rounded-lg bg-blue-900/30 border border-blue-800 text-center space-y-1">
            <div>
              <Trophy className="h-5 w-5 inline-block text-blue-400 mr-2" />
              <span className="text-sm font-semibold text-blue-300">
                Champion:{' '}
                {tournament.participants.find(
                  (p) => p.id === tournament.championId
                )?.name ?? 'Unknown'}
              </span>
            </div>
            {tournament.secondPlaceId && (
              <div className="text-xs text-slate-400">
                Runner-up:{' '}
                {tournament.participants.find(
                  (p) => p.id === tournament.secondPlaceId
                )?.name ?? 'Unknown'}
              </div>
            )}
            {(tournament.loserIds?.length ?? 0) > 0 && (
              <div className="text-xs text-red-400">
                <Skull className="h-4 w-4 inline-block mr-1" />
                Loser:{' '}
                {(tournament.loserIds ?? [])
                  .map((id) =>
                    tournament.participants.find((p) => p.id === id)?.name ?? 'Unknown'
                  )
                  .join(' & ')}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('winners')}
          className={`flex-1 py-3 text-sm font-medium text-center transition-colors relative ${
            activeTab === 'winners'
              ? 'text-blue-400'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          Winners Bracket
          {activeTab === 'winners' && (
            <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-blue-500 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('losers')}
          className={`flex-1 py-3 text-sm font-medium text-center transition-colors relative ${
            activeTab === 'losers'
              ? 'text-amber-400'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          Losers Bracket
          {activeTab === 'losers' && (
            <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-amber-500 rounded-full" />
          )}
        </button>
      </div>

      <div className="p-4 space-y-4">
        <BracketView
          tournament={tournament}
          onCompleteMatch={handleCompleteMatch}
          bracket={activeTab}
        />
      </div>
    </div>

    <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-slate-900 border-t border-slate-800">
        <div className="flex">
          <button
            onClick={() =>
              router.push(`/standings?id=${tournament.id}`)
            }
            className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs text-white transition-colors"
          >
            <ListOrdered className="h-4 w-4" />
            Standings
          </button>
          <button
            onClick={() =>
              router.push(`/eliminated?id=${tournament.id}`)
            }
            className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs text-white transition-colors"
          >
            <Skull className="h-4 w-4" />
            Eliminated
          </button>
        </div>
        <div className="flex items-center justify-center gap-1.5 px-4 py-2 border-t border-slate-800 text-[11px] text-slate-500">
          <div className="flex items-center gap-1">
            <img src="/logo.png" alt="" className="h-3 w-3" />
            <span className="font-semibold text-slate-400">L-BRACKET</span>
          </div>
          <span className="text-slate-600">|</span>
          <span>Lose Once. Fight Again.</span>
          <span className="text-slate-600">|</span>
          <span>Crafted with ❤️ by Ikaf Ramadhan</span>
        </div>
      </div>
    </>
  );
}
