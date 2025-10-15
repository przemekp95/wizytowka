'use client';

import { usePathname } from 'next/navigation';
import { useTransition } from 'react';

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

  const currentLocale = getCurrentLocale();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => switchLanguage('pl')}
        disabled={isPending || currentLocale === 'pl'}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
          currentLocale === 'pl'
            ? 'bg-indigo-100 text-indigo-700 cursor-default'
            : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
        } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-label="Switch to Polish"
      >
        <span className="text-lg">🇵🇱</span>
      </button>

      <button
        onClick={() => switchLanguage('en')}
        disabled={isPending || currentLocale === 'en'}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
          currentLocale === 'en'
            ? 'bg-indigo-100 text-indigo-700 cursor-default'
            : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
        } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-label="Switch to English"
      >
        <span className="text-lg">🇬🇧</span>
      </button>
    </div>
  );
}
