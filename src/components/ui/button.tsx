import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
          {
            'text-white bg-[#2557D6] hover:bg-[#2557D6]/90 focus:ring-4 focus:ring-[#2557D6]/50 focus:outline-none shadow-none':
              variant === 'default',
            'bg-red-600 text-white hover:bg-red-700 shadow-sm':
              variant === 'destructive',
            'border border-slate-300 bg-white text-slate-900 hover:bg-slate-100':
              variant === 'outline',
            'bg-slate-100 text-slate-900 hover:bg-slate-200':
              variant === 'secondary',
            'text-slate-600 hover:bg-slate-100 hover:text-slate-900':
              variant === 'ghost',
            'text-blue-600 underline-offset-4 hover:underline':
              variant === 'link',
          },
          {
            'h-11 px-5': size === 'default',
            'h-9 px-3 text-xs': size === 'sm',
            'h-12 px-8': size === 'lg',
            'h-11 w-11': size === 'icon',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
