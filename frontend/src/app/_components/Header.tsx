'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import { buildLocaleRootHref, buildLocalizedHashHref } from '@/lib/routing';

type HeaderTranslations = Record<string, string>;

type HeaderProps = {
  translations: HeaderTranslations;
};

export default function Header({ translations }: HeaderProps) {
  const headerRef = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const homeHref = buildLocaleRootHref(pathname);
  const sectionHref = (hash: string) => buildLocalizedHashHref(pathname, hash);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const onScroll = () => {
      const scrolled = window.scrollY > 8;
      el.classList.toggle('scrolled', scrolled);
    };

    onScroll(); // Apply initial state after refresh.
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on outside click or scroll
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    const handleScroll = () => {
      setIsMobileMenuOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isMobileMenuOpen]);

  const t = (key: string) => translations[key] || key;

  return (
    <header ref={headerRef} className="site-header sticky top-0 z-40">
      <nav className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link className="brand" href={homeHref}>
          Przemysław Pietrzak
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden sm:flex items-center gap-6 text-sm">
          <Link className="nav-link" href={sectionHref('#portfolio')}>
            {t('portfolio')}
          </Link>
          <Link className="nav-link" href={sectionHref('#about')}>
            {t('about')}
          </Link>
          <Link className="nav-link" href={sectionHref('#skills')}>
            {t('skills')}
          </Link>
          <Link className="nav-link" href={sectionHref('#contact')}>
            {t('contact')}
          </Link>
        </div>

        {/* Desktop Controls */}
        <div className="hidden sm:flex items-center gap-4">
          <LanguageSwitcher />
          <Link className="nav-btn" href={sectionHref('#contact')}>
            {t('contactMe')}
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="sm:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle mobile menu"
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-navigation"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            id="mobile-navigation"
            className="sm:hidden absolute top-14 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{
              duration: 0.3,
              ease: 'easeInOut',
              opacity: { duration: 0.2 },
              height: { duration: 0.25 },
            }}
          >
            <div className="px-4 py-6 flex flex-col space-y-4">
              <motion.div
                className="flex items-center justify-center mb-4"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.2 }}
              >
                <LanguageSwitcher />
              </motion.div>

              {[
                { href: sectionHref('#portfolio'), key: 'portfolio' },
                { href: sectionHref('#about'), key: 'about' },
                { href: sectionHref('#skills'), key: 'skills' },
                { href: sectionHref('#contact'), key: 'contact' },
              ].map((item, index) => (
                <motion.div
                  key={item.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05, duration: 0.2 }}
                >
                  <Link
                    className="nav-link block py-2 text-center hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition-colors"
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t(item.key)}
                  </Link>
                </motion.div>
              ))}

              <motion.div
                className="pt-4 border-t border-gray-200 dark:border-gray-700"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.2 }}
              >
                <Link
                  className="nav-btn block w-full text-center py-3"
                  href={sectionHref('#contact')}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t('contactMe')}
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
