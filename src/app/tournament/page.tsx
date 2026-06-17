'use client';

import { Suspense } from 'react';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getTournament, saveTournament } from '@/lib/db';
import { completeMatch, hydrateWinnersBracket } from '@/lib/engine';
import { speakLoser, speakLosersComplete } from '@/lib/tts';
import { BracketView } from '@/components/bracket-view';
import { DoubleEliminationBracket } from '@/components/double-elimination-bracket';
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
  ClipboardList,
  Download,
  Info,
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
  const [nextSuggestMode, setNextSuggestMode] = useState<'ub-first' | 'interleave'>('ub-first');
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('nextSuggestMode') as 'ub-first' | 'interleave' | null;
    if (saved) setNextSuggestMode(saved);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toggleNextSuggestMode = useCallback(() => {
    setNextSuggestMode(prev => {
      const next = prev === 'ub-first' ? 'interleave' : 'ub-first';
      localStorage.setItem('nextSuggestMode', next);
      return next;
    });
  }, []);

  const loadTournament = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    try {
      let t = await getTournament(id) ?? null;
      if (t && t.tournamentType === 'winners-bracket') {
        const hydrated = hydrateWinnersBracket(t);
        if (hydrated !== t) {
          t = hydrated;
          await saveTournament(hydrated);
        }
      }
      setTournament(t);
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

  const isDoubleElim = tournament.tournamentType === 'winners-bracket';

  return (
    <>    <div className="flex flex-col min-h-screen pb-36">
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
              <h1 className="text-lg font-bold truncate text-white">
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
            {tournament.prize && (
              <p className="text-xs text-amber-400 mt-0.5">
                Prize: {tournament.prize}
              </p>
            )}
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
      </div>

      {isDoubleElim && (() => {
          const playable = tournament.matches.filter(m =>
            !m.completed && !m.bye &&
            (m.participant1Id !== null || m.participant2Id !== null)
          );

          let next: typeof playable[0] | null = null;
          let isGrandFinal = false;
          if (playable.length > 0) {
            if (nextSuggestMode === 'ub-first') {
              playable.sort((a, b) => {
                if (a.bracket === 'grand-final') return 1;
                if (b.bracket === 'grand-final') return -1;
                const ab = a.bracket === 'upper' ? 0 : 1;
                const bb = b.bracket === 'upper' ? 0 : 1;
                if (ab !== bb) return ab - bb;
                if (a.round !== b.round) return a.round - b.round;
                return a.position - b.position;
              });
              const gfMatch = playable.find(m => m.bracket === 'grand-final');
              const nonGfPlayable = playable.filter(m => m.bracket !== 'grand-final');
              if (gfMatch && nonGfPlayable.length === 0) {
                next = gfMatch;
                isGrandFinal = true;
              } else if (nonGfPlayable.length > 0) {
                next = nonGfPlayable[0];
              }
            } else {
              const allLower = tournament.matches.filter(m => m.bracket === 'lower' && !m.bye);
              const allUpper = tournament.matches.filter(m => m.bracket === 'upper');

              function getUbRoundWhereParticipantLost(participantId: string): number | null {
                const ubMatch = allUpper.find(m => m.loserId === participantId);
                return ubMatch ? ubMatch.round : null;
              }

              function isLbMatchFair(lbMatch: typeof playable[0]): boolean {
                const participants = [lbMatch.participant1Id, lbMatch.participant2Id].filter(Boolean) as string[];
                for (const pid of participants) {
                  const ubRound = getUbRoundWhereParticipantLost(pid);
                  if (ubRound !== null) {
                    const nextUbRound = ubRound + 1;
                    const nextUbMatches = allUpper.filter(m => m.round === nextUbRound);
                    if (nextUbMatches.length === 0) continue;
                    const allFull = nextUbMatches.every(m =>
                      m.participant1Id !== null && m.participant2Id !== null
                    );
                    if (!allFull) return false;
                  }
                }
                return true;
              }

              const gfMatch = playable.find(m => m.bracket === 'grand-final');

              const lbReadyMatches = playable.filter(m =>
                m.bracket === 'lower' &&
                m.participant1Id !== null && m.participant2Id !== null &&
                isLbMatchFair(m)
              );
              lbReadyMatches.sort((a, b) => {
                if (a.round !== b.round) return a.round - b.round;
                return a.position - b.position;
              });
              const earliestLb = lbReadyMatches.length > 0 ? lbReadyMatches[0] : null;

              const ubPlayable = playable.filter(m => m.bracket === 'upper');
              ubPlayable.sort((a, b) => {
                if (a.round !== b.round) return a.round - b.round;
                return a.position - b.position;
              });
              const earliestUb = ubPlayable.length > 0 ? ubPlayable[0] : null;

              if (earliestLb && earliestUb) {
                next = earliestLb.round <= earliestUb.round ? earliestLb : earliestUb;
              } else if (earliestLb || earliestUb) {
                next = earliestLb ?? earliestUb;
              } else if (gfMatch) {
                next = gfMatch;
                isGrandFinal = true;
              }
            }
          }

          if (!next) return null;
          const p1 = next.participant1Id ? tournament.participants.find(p => p.id === next.participant1Id) : null;
          const p2 = next.participant2Id ? tournament.participants.find(p => p.id === next.participant2Id) : null;
          return (
                        <div key="next-match" className="sticky top-0 z-50 py-3 px-4 flex flex-col items-center gap-2">
              <div className="flex items-center justify-center gap-2">
                <span className={`text-[10px] font-medium transition-colors ${nextSuggestMode === 'ub-first' ? 'text-emerald-300' : 'text-slate-500'}`}>
                  UB First
                </span>
                <button
                  onClick={toggleNextSuggestMode}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    nextSuggestMode === 'ub-first' ? 'bg-emerald-500/40' : 'bg-amber-500/40'
                  }`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full shadow transition-all ${
                    nextSuggestMode === 'ub-first'
                      ? 'left-0.5 bg-emerald-400'
                      : 'left-[22px] bg-amber-400'
                  }`} />
                </button>
                <span className={`text-[10px] font-medium transition-colors ${nextSuggestMode === 'interleave' ? 'text-amber-300' : 'text-slate-500'}`}>
                  Interleave
                </span>
                <div className="relative">
                  <button
                    onMouseEnter={() => setShowInfoTooltip(true)}
                    onMouseLeave={() => setShowInfoTooltip(false)}
                    onClick={() => setShowInfoTooltip(!showInfoTooltip)}
                    className="p-1 rounded-full hover:bg-slate-700/50 transition-colors"
                  >
                    <Info className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                  {showInfoTooltip && (
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 text-left">
                      <div className="text-[11px] text-slate-300 space-y-2">
                        <div>
                          <span className="font-bold text-emerald-400">UB First:</span>{' '}
                          Selesaikan semua Upper Bracket round, lalu Lower Bracket. Lebih terstruktur tapi LB menunggu lama.
                        </div>
                        <div>
                          <span className="font-bold text-amber-400">Interleave:</span>{' '}
                          LB round yang sudah penuh participant-nya bisa dimainkan bersamaan UB. Lebih natural & cepat.
                        </div>
                      </div>
                      <div className="absolute left-1/2 -translate-x-1/2 top-full w-2 h-2 bg-slate-800 border-r border-b border-slate-700 rotate-45 -mt-1" />
                    </div>
                  )}
                </div>
              </div>
              <div className={`bg-gradient-to-r border rounded-xl px-5 py-3 shadow-lg transition-all duration-300 ${
                isGrandFinal
                  ? scrolled
                    ? 'bg-slate-900 border-amber-500/40 shadow-amber-500/10'
                    : 'from-amber-600/20 via-yellow-500/20 to-amber-600/20 border-amber-500/40 shadow-amber-500/10'
                  : scrolled
                    ? 'bg-slate-900 border-blue-500/30 shadow-blue-500/10'
                    : 'from-blue-600/20 via-indigo-600/20 to-blue-600/20 border-blue-500/30 shadow-blue-500/10'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="text-right min-w-0">
                    <div className={`text-sm font-bold truncate ${isGrandFinal ? 'text-amber-100' : 'text-white'}`}>{p1?.name ?? 'TBD'}</div>
                    {p1?.teamName && <div className={`text-[10px] truncate ${isGrandFinal ? 'text-amber-300' : 'text-blue-300'}`}>{p1.teamName}</div>}
                  </div>
                  <div className="flex flex-col items-center shrink-0">
                    <span className={`text-[9px] font-bold uppercase tracking-wider mb-0.5 ${isGrandFinal ? 'text-amber-400' : 'text-blue-400'}`}>
                      {isGrandFinal ? 'Grand Final' : 'Next Match'}
                    </span>
                    <Swords className={`w-6 h-6 ${isGrandFinal ? 'text-amber-400' : 'text-blue-400'}`} style={{ animation: 'sword-cross 1.5s ease-in-out infinite' }} />
                    <span className={`text-[9px] mt-0.5 ${isGrandFinal ? 'text-amber-300/70' : 'text-slate-500'}`}>{next.label}</span>
                  </div>
                  <div className="text-left min-w-0">
                    <div className={`text-sm font-bold truncate ${isGrandFinal ? 'text-amber-100' : 'text-white'}`}>{p2?.name ?? 'TBD'}</div>
                    {p2?.teamName && <div className={`text-[10px] truncate ${isGrandFinal ? 'text-amber-300' : 'text-blue-300'}`}>{p2.teamName}</div>}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      <style>{`
        @keyframes sword-cross {
          0%, 100% { transform: rotate(-15deg) scale(1); }
          50% { transform: rotate(15deg) scale(1.1); }
        }
      `}</style>

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
            {(tournament.loserIds?.length ?? 0) > 0 && !isDoubleElim && (
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

      {isDoubleElim ? (
        <div className="flex-1 min-h-0 p-4">
          <DoubleEliminationBracket
            tournament={tournament}
            onCompleteMatch={handleCompleteMatch}
          />
        </div>
      ) : (
        <>
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
        </>
      )}
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
          <span>Crafted with ❤️ by Ikaf Ramadhan</span>
        </div>
      </div>
    </>
  );
}
