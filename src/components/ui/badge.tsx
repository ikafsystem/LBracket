import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
        {
          'bg-blue-100 text-blue-800': variant === 'default',
          'bg-slate-100 text-slate-800': variant === 'secondary',
          'bg-red-100 text-red-800': variant === 'destructive',
          'border border-slate-300 text-slate-700': variant === 'outline',
          'bg-emerald-100 text-emerald-800': variant === 'success',
          'bg-amber-100 text-amber-800': variant === 'warning',
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
