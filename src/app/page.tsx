'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getAllTournaments } from '@/lib/db';
import { TournamentCard } from '@/components/tournament-card';
import { StatsCard } from '@/components/stats-card';
import {
  Trophy,
  Users,
  Swords,
  Skull,
  Shuffle,
  Plus,
} from 'lucide-react';
import type { Tournament, TournamentSummary } from '@/types';

export default function Dashboard() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<TournamentSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const all = await getAllTournaments();
      const summaries: TournamentSummary[] = all.map((t: Tournament) => ({
        id: t.id,
        name: t.name,
        status: t.status,
        participantCount: t.participants.length,
        undefeatedCount: t.participants.filter(
          (p) => p.status === 'undefeated'
        ).length,
        lowerBracketCount: t.participants.filter(
          (p) => p.status === 'lower-bracket'
        ).length,
        eliminatedCount: t.participants.filter(
          (p) => p.status === 'eliminated'
        ).length,
        createdAt: t.createdAt,
        logo: t.logo,
      }));
      setTournaments(summaries);
    } catch {
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalParticipants = tournaments.reduce(
    (acc, t) => acc + t.participantCount,
    0
  );
  const totalUndefeated = tournaments.reduce(
    (acc, t) => acc + t.undefeatedCount,
    0
  );
  const totalLower = tournaments.reduce(
    (acc, t) => acc + t.lowerBracketCount,
    0
  );
  const totalEliminated = tournaments.reduce(
    (acc, t) => acc + t.eliminatedCount,
    0
  );

  return (
    <div className="p-4 pb-24 space-y-6">
      <div className="pt-4 pb-2 flex items-center gap-3">
        <Image
          src="/logo.png"
          alt="L-Bracket logo"
          width={70}
          height={70}
          className="h-[70px] w-[70px]"
        />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">L-BRACKET</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            WHOS GONNA BE LOSER FROM THE LOSERS.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatsCard
          title="Total Participants"
          value={totalParticipants}
          icon={<Users className="h-5 w-5" />}
          variant="default"
        />
        <StatsCard
          title="Undefeated"
          value={totalUndefeated}
          icon={<Trophy className="h-5 w-5" />}
          variant="success"
        />
        <StatsCard
          title="Lower Bracket"
          value={totalLower}
          icon={<Swords className="h-5 w-5" />}
          variant="warning"
        />
        <StatsCard
          title="Eliminated"
          value={totalEliminated}
          icon={<Skull className="h-5 w-5" />}
          variant="destructive"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => router.push('/create')}
          className="text-white bg-[#2557D6] hover:bg-[#2557D6]/90 focus:ring-4 focus:ring-[#2557D6]/50 focus:outline-none font-medium rounded-lg text-sm px-5 py-3 text-center inline-flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
        >
          <Plus className="h-5 w-5" />
          Create Tournament
        </button>
        <button
          onClick={() => router.push('/club-generator')}
          className="text-white bg-[#2557D6] hover:bg-[#2557D6]/90 focus:ring-4 focus:ring-[#2557D6]/50 focus:outline-none font-medium rounded-lg text-sm px-5 py-3 text-center inline-flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
        >
          <Shuffle className="h-5 w-5" />
          Club Generator
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-24 rounded-xl bg-slate-800 animate-pulse"
            />
          ))}
        </div>
      ) : tournaments.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="h-12 w-12 mx-auto text-slate-600 mb-3" />
          <p className="text-slate-400 font-medium">No tournaments yet</p>
          <p className="text-sm text-slate-500 mt-1">
            Create your first tournament to get started
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
            Your Tournaments
          </h2>
          {tournaments.map((t) => (
            <TournamentCard
              key={t.id}
              tournament={t}
              onClick={() => router.push(`/tournament?id=${t.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
