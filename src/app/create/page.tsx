'use client';

import { useState } from 'react';
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
import { createTournament } from '@/lib/engine';
import { saveTournament, enforceMaxTournaments } from '@/lib/db';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ArrowLeft, Plus, Trash2, Shuffle } from 'lucide-react';

export default function CreateTournament() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [participants, setParticipants] = useState<string[]>(['', '', '', '', '']);
  const [randomSeeding, setRandomSeeding] = useState(true);
  const [losersToFind, setLosersToFind] = useState<1 | 2>(1);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [deletedName, setDeletedName] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const addParticipant = () => {
    setParticipants([...participants, '']);
  };

  const removeParticipant = (index: number) => {
    if (participants.length <= 2) return;
    setParticipants(participants.filter((_, i) => i !== index));
  };

  const updateParticipant = (index: number, value: string) => {
    const updated = [...participants];
    updated[index] = value;
    setParticipants(updated);
  };

  const validParticipants = participants.filter((p) => p.trim().length > 0);
    const canCreate =
      name.trim().length > 0 &&
      validParticipants.length >= 2 &&
      validParticipants.length <= 11 &&
      !creating;

    const handleCreate = async () => {
      if (!canCreate) return;
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
      const tournament = createTournament({
        name: name.trim(),
        participants: validParticipants,
        randomSeeding,
        doubleElimination: true,
        losersToFind,
      });

      await saveTournament(tournament);
      router.push(`/tournament?id=${tournament.id}`);
    };

    return (
      <div className="p-4 pb-24 space-y-6">
        <div className="flex items-center gap-3 pt-4">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">New Tournament</h1>
            <p className="text-sm text-slate-400">Set up your bracket</p>
          </div>
        </div>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Tournament Name</CardTitle>
            <CardDescription className="text-slate-400">
              Give your tournament a name
            </CardDescription>
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
            <CardTitle className="text-white">Participants</CardTitle>
            <CardDescription className="text-slate-400">
              Add 2–11 participants
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {participants.map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-slate-500 w-6 text-right font-mono">
                  {i + 1}
                </span>
                <Input
                  placeholder={`Participant ${i + 1}`}
                  value={p}
                  onChange={(e) => updateParticipant(i, e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                  maxLength={30}
                />
                {participants.length > 2 && (
                  <button
                    onClick={() => removeParticipant(i)}
                    className="p-2 rounded-lg hover:bg-red-900/30 text-slate-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            {participants.length < 11 && (
              <Button
                variant="ghost"
                onClick={addParticipant}
                className="w-full text-slate-400 hover:text-white hover:bg-slate-700"
              >
                <Plus className="h-4 w-4" />
                Add Participant
              </Button>
            )}
            <div className="text-xs text-slate-500">
              {validParticipants.length} participant
              {validParticipants.length !== 1 ? 's' : ''} added
            </div>
          </CardContent>
        </Card>

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

        <Button
          onClick={handleCreate}
          disabled={!canCreate}
          size="lg"
          className="w-full"
        >
          <Plus className="h-5 w-5" />
          Create Tournament
        </Button>

        <Dialog open={showDeleteWarning} onOpenChange={setShowDeleteWarning}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>Old Tournament Deleted</DialogTitle>
              <DialogDescription className="text-slate-400">
                Maximum 3 tournaments allowed. &ldquo;{deletedName}&rdquo; was
                deleted to make room.
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
