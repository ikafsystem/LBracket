'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Users, Calendar } from 'lucide-react';
import type { TournamentSummary } from '@/types';

interface TournamentCardProps {
  tournament: TournamentSummary;
  onClick: () => void;
}

export function TournamentCard({ tournament, onClick }: TournamentCardProps) {
  return (
    <Card
      className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-blue-300 active:scale-[0.99]"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-base leading-tight">
            {tournament.name}
          </h3>
          <Badge
            variant={
              tournament.status === 'completed'
                ? 'success'
                : tournament.status === 'active'
                  ? 'default'
                  : 'secondary'
            }
          >
            {tournament.status}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {tournament.participantCount}
          </span>
          <span className="flex items-center gap-1">
            <Trophy className="h-3.5 w-3.5" />
            {tournament.undefeatedCount} undefeated
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(tournament.createdAt).toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
