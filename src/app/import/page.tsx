'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { saveTournament, enforceMaxTournaments } from '@/lib/db';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ArrowLeft, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import type { Tournament } from '@/types';

export default function ImportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [pendingData, setPendingData] = useState<Tournament | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setImporting(true);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (Array.isArray(data)) {
        for (const item of data) {
          await importSingle(item);
        }
        router.push('/');
        return;
      }

      if (!data.id || !data.participants || !data.matches) {
        setError('Invalid tournament file format');
        setImporting(false);
        return;
      }

      const deleted = await enforceMaxTournaments();
      if (deleted) {
        setPendingData(data as Tournament);
        setShowDeleteWarning(true);
        setImporting(false);
        return;
      }

      await importSingle(data);
      router.push('/');
    } catch {
      setError('Failed to parse file. Make sure it is a valid JSON.');
    } finally {
      setImporting(false);
    }
  };

  const importSingle = async (data: Tournament) => {
    const tournament: Tournament = {
      ...data,
      losersToFind: data.losersToFind ?? 1,
      loserIds: data.loserIds ?? [],
      tournamentType: (data as any).tournamentType ?? 'losers-bracket',
      prize: (data as any).prize ?? undefined,
      updatedAt: Date.now(),
    };
    await saveTournament(tournament);
  };

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
          <h1 className="text-xl font-bold">Import Tournament</h1>
          <p className="text-sm text-slate-400">
            Load a tournament from a JSON file
          </p>
        </div>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Select File</CardTitle>
          <CardDescription className="text-slate-400">
            Choose a previously exported tournament JSON file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFile}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            size="lg"
            className="w-full bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
            disabled={importing}
          >
            <Upload className="h-5 w-5" />
            {importing ? 'Importing...' : 'Choose JSON File'}
          </Button>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-900/30 border border-red-800">
              <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-slate-500">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            Supports single tournament or array of tournaments
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDeleteWarning} onOpenChange={setShowDeleteWarning}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Maximum Tournaments Reached</DialogTitle>
            <DialogDescription className="text-slate-400">
              You can have a maximum of 3 tournaments. The oldest tournament
              will be deleted to make room.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={async () => {
                setShowDeleteWarning(false);
                if (pendingData) {
                  await importSingle(pendingData);
                  router.push('/');
                }
              }}
              className="w-full"
            >
              Delete Oldest and Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
