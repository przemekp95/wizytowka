'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import LanguageSwitcher from './LanguageSwitcher';

async function loadTranslations(locale: string, section: string) {
  try {
    const messages = (await import(`@/i18n/messages/${locale}.json`)).default;
    const sectionData = messages[section] || {};
    return sectionData;
  } catch {
    return {};
  }
}

export default function Header() {
  const headerRef = useRef<HTMLElement>(null);
  const [translations, setTranslations] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadNavTranslations = async () => {
      const locale = document.querySelector('#i18n-provider')?.getAttribute('data-locale') || 'en';
      const navTranslations = await loadTranslations(locale, 'nav');
      setTranslations(navTranslations);
    };

    loadNavTranslations();
  }, []);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const onScroll = () => {
      const scrolled = window.scrollY > 8;
      el.classList.toggle('scrolled', scrolled);
    };

    onScroll(); // stan początkowy po odświeżeniu
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const t = (key: string) => translations[key] || key;

  return (
    <header ref={headerRef} className="site-header sticky top-0 z-40">
      <nav className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link className="brand" href="/">
          Przemysław Pietrzak
        </Link>
        <div className="hidden sm:flex items-center gap-6 text-sm">
          <Link className="nav-link" href="/#portfolio">
            {t('portfolio')}
          </Link>
          <Link className="nav-link" href="/#about">
            {t('about')}
          </Link>
          <Link className="nav-link" href="/#skills">
            {t('skills')}
          </Link>
          <Link className="nav-link" href="/#contact">
            {t('contact')}
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <Link className="nav-btn" href="/#contact">
            {t('contactMe')}
          </Link>
        </div>
      </nav>
    </header>
  );
}
