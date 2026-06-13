'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
}

const variantStyles = {
  default: 'bg-blue-50 text-blue-700 border-blue-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  destructive: 'bg-red-50 text-red-700 border-red-200',
};

export function StatsCard({ title, value, icon, variant = 'default' }: StatsCardProps) {
  return (
    <Card className={cn('border', variantStyles[variant])}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium opacity-70">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className="opacity-60">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
