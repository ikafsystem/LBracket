'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getAllTournaments } from '@/lib/db';
import { TournamentCard } from '@/components/tournament-card';
import { StatsCard } from '@/components/stats-card';
import { Button } from '@/components/ui/button';
import {
  Trophy,
  Users,
  Swords,
  Skull,
  Plus,
  Download,
  Upload,
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
        <Trophy className="h-7 w-7 text-blue-400" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">L-Bracket</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Double-elimination tournament manager
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

      <div className="flex gap-2">
        <Button
          onClick={() => router.push('/create')}
          className="flex-1"
          size="lg"
        >
          <Plus className="h-5 w-5" />
          New Tournament
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => router.push('/import')}
          className="bg-white/10 text-white border-slate-600 hover:bg-white/20"
        >
          <Upload className="h-5 w-5" />
        </Button>
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

      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-slate-900 border-t border-slate-800 px-4 py-3">
        <div className="flex items-center justify-center gap-6 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Trophy className="h-3.5 w-3.5" />
            L-Bracket
          </span>
          <span className="text-slate-700">|</span>
          <button
            className="hover:text-slate-300 transition-colors flex items-center gap-1"
            onClick={async () => {
              const all = await getAllTournaments();
              const blob = new Blob(
                [JSON.stringify(all, null, 2)],
                { type: 'application/json' }
              );
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'lbracket-export.json';
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download className="h-3.5 w-3.5" />
            Export All
          </button>
        </div>
      </div>
    </div>
  );
}
