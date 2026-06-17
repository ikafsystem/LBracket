'use client';

import { useState, useEffect, type SVGProps } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createTournament, createWinnersBracketTournament } from '@/lib/engine';
import { saveTournament, enforceMaxTournaments, getAllTournaments } from '@/lib/db';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ArrowLeft, Plus, Trash2, Shuffle, Trophy, ClipboardCopy } from 'lucide-react';
import type { TournamentType } from '@/types';

interface ParticipantEntry {
  name: string;
  teamName: string;
}

export default function CreateTournament() {
  const router = useRouter();
  const [step, setStep] = useState<'choose' | 'form'>('choose');
  const [tournamentType, setTournamentType] = useState<TournamentType | null>(null);
  const [name, setName] = useState('');
  const [participants, setParticipants] = useState<ParticipantEntry[]>(
    Array.from({ length: 5 }, () => ({ name: '', teamName: '' }))
  );
  const [prize, setPrize] = useState('');
  const [randomSeeding, setRandomSeeding] = useState(true);
  const [losersToFind, setLosersToFind] = useState<1 | 2>(1);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [deletedName, setDeletedName] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [recentTournaments, setRecentTournaments] = useState<{ id: string; name: string; participants: ParticipantEntry[] }[]>([]);

  useEffect(() => {
    getAllTournaments().then(all => {
      setRecentTournaments(all.slice(0, 5).map(t => ({
        id: t.id,
        name: t.name,
        participants: t.participants.map(p => ({ name: p.name, teamName: p.teamName ?? '' })),
      })));
    });
  }, []);

  const selectType = (type: TournamentType) => {
    setTournamentType(type);
    setStep('form');
  };

  const addParticipant = () => {
    setParticipants([...participants, { name: '', teamName: '' }]);
  };

  const removeParticipant = (index: number) => {
    if (participants.length <= 2) return;
    setParticipants(participants.filter((_, i) => i !== index));
  };

  const updateParticipant = (index: number, field: 'name' | 'teamName', value: string) => {
    const updated = [...participants];
    updated[index] = { ...updated[index], [field]: value };
    setParticipants(updated);
  };

  const shuffleParticipants = () => {
    const filled = participants.filter(p => p.name.trim().length > 0);
    const empty = participants.filter(p => p.name.trim().length === 0);
    for (let i = filled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [filled[i], filled[j]] = [filled[j], filled[i]];
    }
    setParticipants([...filled, ...empty]);
  };

  const validParticipants = participants.filter((p) => p.name.trim().length > 0);
  const isWb = tournamentType === 'winners-bracket';
  const canCreate =
    name.trim().length > 0 &&
    validParticipants.length >= 2 &&
    validParticipants.length <= 20 &&
    !creating;

  const handleCreate = async () => {
    if (!canCreate || !tournamentType) return;
    setCreating(true);

    const deleted = await enforceMaxTournaments();
    if (deleted) {
      setDeletedName(deleted);
      setShowDeleteWarning(true);
      return;
    }

    await doCreate();
  };

  const doCreate = async () => {
    if (!tournamentType) return;
    let tournament;

    if (isWb) {
      tournament = createWinnersBracketTournament({
        name: name.trim(),
        participants: validParticipants.map(p => ({ name: p.name.trim(), teamName: p.teamName.trim() })),
      });
    } else {
      tournament = createTournament({
        name: name.trim(),
        participants: validParticipants.map(p => p.name.trim()),
        randomSeeding,
        doubleElimination: true,
        losersToFind,
      });
      tournament = {
        ...tournament,
        participants: tournament.participants.map((p, i) => ({
          ...p,
          teamName: validParticipants[i]?.teamName?.trim() || undefined,
        })),
      };
    }

    tournament.prize = prize.trim() || undefined;
    await saveTournament(tournament);
    router.push(`/tournament?id=${tournament.id}`);
  };

  if (step === 'choose') {
    return (
      <div className="p-4 pb-24 space-y-6">
        <div className="flex items-center gap-3 pt-4">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-lg hover:bg-[#2557D6]/20 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">New Tournament</h1>
            <p className="text-sm text-slate-400">Choose tournament type</p>
          </div>
        </div>

        <button onClick={() => selectType('losers-bracket')} className="w-full text-left">
          <Card className="bg-slate-800 border-slate-700 hover:border-red-500/50 transition-all cursor-pointer hover:bg-slate-750">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-900/30">
                  <SkullIcon className="h-6 w-6 text-red-400" />
                </div>
                <div>
                  <CardTitle className="text-white">Losers Bracket Tournament</CardTitle>
                  <CardDescription className="text-slate-400">
                    Single elimination + losers bracket to determine the bottom
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </button>

        <button onClick={() => selectType('winners-bracket')} className="w-full text-left">
          <Card className="bg-slate-800 border-slate-700 hover:border-emerald-500/50 transition-all cursor-pointer hover:bg-slate-750">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-900/30">
                  <Trophy className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <CardTitle className="text-white">Winner Bracket Tournament</CardTitle>
                  <CardDescription className="text-slate-400">
                    Double elimination — Upper & Lower bracket, everyone gets 2 chances
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 space-y-6">
      <div className="flex items-center gap-3 pt-4">
        <button
          onClick={() => { setStep('choose'); setTournamentType(null); }}
          className="p-2 -ml-2 rounded-lg hover:bg-[#2557D6]/20 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">
            {isWb ? 'Winner Bracket' : 'Losers Bracket'}
          </h1>
          <p className="text-sm text-slate-400">Set up your bracket</p>
        </div>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Tournament Name</CardTitle>
          <CardDescription className="text-slate-400">Give your tournament a name</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="e.g. Friday Night Fights"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
            maxLength={50}
          />
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Prize / Hadiah</CardTitle>
          <CardDescription className="text-slate-400">Optional prize for the champion</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="e.g. Rp 500,000"
            value={prize}
            onChange={(e) => setPrize(e.target.value)}
            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
            maxLength={100}
          />
        </CardContent>
      </Card>

      {recentTournaments.length > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-sm">Load from Recent Tournament</CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Pick a tournament to copy its participants
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {recentTournaments.map((rt) => (
              <button
                key={rt.id}
                onClick={() => {
                  setParticipants(
                    rt.participants.length >= 2
                      ? rt.participants.map(p => ({ ...p }))
                      : [{ name: '', teamName: '' }]
                  );
                }}
                className="w-full flex items-center gap-2 p-2.5 rounded-lg hover:bg-slate-700 transition-colors text-left"
              >
                <ClipboardCopy className="h-4 w-4 text-slate-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white truncate">{rt.name}</p>
                  <p className="text-[10px] text-slate-500">{rt.participants.length} participant{rt.participants.length !== 1 ? 's' : ''}</p>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Participants</CardTitle>
          <CardDescription className="text-slate-400">
            Add 2–20 participants with their team names
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {participants.map((p, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-xs text-slate-500 w-6 text-right font-mono pt-3">{i + 1}</span>
              <div className="flex-1 space-y-1.5">
                <Input
                  placeholder="Name"
                  value={p.name}
                  onChange={(e) => updateParticipant(i, 'name', e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                  maxLength={30}
                />
                <Input
                  placeholder="Team (optional)"
                  value={p.teamName}
                  onChange={(e) => updateParticipant(i, 'teamName', e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 text-xs"
                  maxLength={30}
                />
              </div>
              {participants.length > 2 && (
                <button
                  onClick={() => removeParticipant(i)}
                  className="p-2 rounded-lg hover:bg-red-900/30 text-slate-400 hover:text-red-400 transition-colors mt-2"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          <div className="flex gap-2">
            {validParticipants.length >= 2 && (
              <Button
                variant="ghost"
                onClick={shuffleParticipants}
                className="flex-1 text-slate-400 hover:text-white hover:bg-slate-700"
              >
                <Shuffle className="h-4 w-4" />
                Shuffle
              </Button>
            )}
            {participants.length < 20 && (
              <Button
                variant="ghost"
                onClick={addParticipant}
                className="flex-1 text-slate-400 hover:text-white hover:bg-slate-700"
              >
                <Plus className="h-4 w-4" />
                Add Participant
              </Button>
            )}
          </div>
          <div className="text-xs text-slate-500">
            {validParticipants.length} participant{validParticipants.length !== 1 ? 's' : ''} added
          </div>
        </CardContent>
      </Card>

      {!isWb && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-white">Losers to Find</Label>
              <p className="text-xs text-slate-400 mt-0.5 mb-3">
                How many last-place players to determine
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setLosersToFind(1)}
                  className={`flex-1 py-3 rounded-lg font-semibold text-sm transition-all ${
                    losersToFind === 1
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  1 Loser
                </button>
                <button
                  onClick={() => setLosersToFind(2)}
                  className={`flex-1 py-3 rounded-lg font-semibold text-sm transition-all ${
                    losersToFind === 2
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  2 Losers
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white">Random Seeding</Label>
                <p className="text-xs text-slate-400 mt-0.5">
                  Randomize initial bracket positions
                </p>
              </div>
              <button
                onClick={() => setRandomSeeding(!randomSeeding)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  randomSeeding ? 'bg-blue-600' : 'bg-slate-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    randomSeeding ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Shuffle className="h-4 w-4" />
              <span>
                {randomSeeding
                  ? 'Participants will be randomly seeded'
                  : 'Participants will be ordered as entered'}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <Button
        onClick={handleCreate}
        disabled={!canCreate}
        size="lg"
        className="w-full"
      >
        <Plus className="h-5 w-5" />
        Create {isWb ? 'Winner Bracket' : 'Losers Bracket'} Tournament
      </Button>

      <Dialog open={showDeleteWarning} onOpenChange={setShowDeleteWarning}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Old Tournament Deleted</DialogTitle>
            <DialogDescription className="text-slate-400">
              Maximum 3 tournaments allowed. &ldquo;{deletedName}&rdquo; was deleted to make room.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={async () => {
                setShowDeleteWarning(false);
                await doCreate();
              }}
              className="w-full"
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SkullIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="12" r="1" />
      <circle cx="15" cy="12" r="1" />
      <path d="M8 20v-2a4 4 0 0 1 8 0v2" />
      <path d="M12 2a8 8 0 0 0-8 8c0 3.5 1.5 6.5 4 8.5V20a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-1.5c2.5-2 4-5 4-8.5a8 8 0 0 0-8-8Z" />
    </svg>
  );
}
