'use client';

import { usePathname } from 'next/navigation';
import { useTransition, useEffect, useState } from 'react';

// Funkcja do ładowania tłumaczeń
async function loadTranslations(locale: string, section: string) {
  try {
    const messages = (await import(`@/i18n/messages/${locale}.json`)).default;
    const sectionData = messages[section] || {};
    return sectionData;
  } catch {
    return {};
  }
}

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLanguageTranslations = async () => {
      const locale = document.querySelector('#i18n-provider')?.getAttribute('data-locale') || 'en';
      const languageTranslations = await loadTranslations(locale, 'language');
      setTranslations(languageTranslations);
      setLoading(false);
    };

    loadLanguageTranslations();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  const t = (key: string) => translations[key] || key;

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
