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

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const switchLanguage = (newLocale: string) => {
    startTransition(() => {
      const newPathname = pathname.startsWith('/pl')
        ? pathname.replace('/pl', `/${newLocale}`)
        : pathname.startsWith('/en')
          ? pathname.replace('/en', `/${newLocale}`)
          : `/${newLocale}${pathname}`;

      window.location.href = newPathname;
    });
  };

  const getCurrentLocale = () => {
    if (pathname.startsWith('/pl')) return 'pl';
    if (pathname.startsWith('/en')) return 'en';
    return 'en';
  };

  const getLocaleInfo = (locale: string) => {
    return locale === 'pl' ? { flag: '🇵🇱', name: 'Polski' } : { flag: '🇬🇧', name: 'English' };
  };

  const currentLocale = getCurrentLocale();
  const currentLocaleInfo = getLocaleInfo(currentLocale);
  const otherLocale = currentLocale === 'pl' ? 'en' : 'pl';
  const otherLocaleInfo = getLocaleInfo(otherLocale);

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
