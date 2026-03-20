'use client';

import { usePathname } from 'next/navigation';
import { useTransition } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import type { Locale } from '@/lib/routing';
import { buildLocalizedPath, getLocaleFromPathname } from '@/lib/routing';

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const currentLocale = getLocaleFromPathname(pathname);
  const currentLocaleInfo =
    currentLocale === 'pl' ? { flag: '🇵🇱', name: 'Polski' } : { flag: '🇬🇧', name: 'English' };
  const otherLocale: Locale = currentLocale === 'pl' ? 'en' : 'pl';
  const otherLocaleInfo =
    otherLocale === 'pl' ? { flag: '🇵🇱', name: 'Polski' } : { flag: '🇬🇧', name: 'English' };

  const switchLanguage = (newLocale: Locale) => {
    startTransition(() => {
      const nextPathname = buildLocalizedPath(pathname, newLocale);
      window.location.href = `${nextPathname}${window.location.hash}`;
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          className="gap-2 text-slate-100 border-slate-300 bg-slate-900 hover:bg-slate-800"
          aria-label={`Current language: ${currentLocaleInfo.name}`}
        >
          <span className="text-base">{currentLocaleInfo.flag}</span>
          <span className="hidden sm:inline">{currentLocaleInfo.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => switchLanguage(otherLocale)}
          disabled={isPending}
          className="gap-2 cursor-pointer"
        >
          <span className="text-base">{otherLocaleInfo.flag}</span>
          <span>{otherLocaleInfo.name}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
