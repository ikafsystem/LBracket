'use client';

import { usePathname } from 'next/navigation';
import Image from 'next/image';

export function Footer() {
  const pathname = usePathname();
  const isTournamentPage = pathname?.startsWith('/tournament');

  if (isTournamentPage) return null;

  return (
    <footer className="px-4 py-3 border-t border-slate-800">
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
        <div className="flex items-center gap-1">
          <Image src="/logo.png" alt="" width={12} height={12} className="h-3 w-3" />
          <span className="font-semibold text-slate-400">L-BRACKET</span>
        </div>
        <span className="text-slate-600">|</span>
        <span>Lose Once. Fight Again.</span>
        <span className="text-slate-600">|</span>
        <span>Crafted with ❤️ by Ikaf Ramadhan</span>
      </div>
    </footer>
  );
}