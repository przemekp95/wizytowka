'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface PortfolioItem {
  _id: string;
  title: string;
  title_en?: string;
  slug: string;
  href: string;
  desc: string;
  desc_en?: string;
  tags: string[];
  img: string;
  isLogo?: boolean;
  newTech?: boolean;
  category?: string;
  repoUrl?: string | null;
  dateFrom?: Date;
  dateTo?: Date;
}

interface PortfolioSectionProps {
  items: PortfolioItem[];
  locale: string;
}

export default function PortfolioSection({ items, locale }: PortfolioSectionProps) {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [translations, setTranslations] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const messages = (await import(`../i18n/messages/${locale}.json`)).default;
        const portfolioTranslations = messages.portfolio || {};
        setTranslations(portfolioTranslations);
      } catch (error) {
        console.error('Error loading translations:', error);
      }
    };

    loadTranslations();
  }, [locale]);

  const t = (key: string) =>
    translations[key] ??
    {
      title: locale === 'en' ? 'Portfolio' : 'Moje projekty',
      newTech: locale === 'en' ? 'New Tech' : 'Nowy Tech',
      technologies: locale === 'en' ? 'Technologies' : 'Wykorzystane technologie',
      repository: locale === 'en' ? 'Repository' : 'Repozytorium',
    }[key] ??
    key;

  // Extract all unique categories from portfolio items
  const allCategories = useMemo(() => {
    const categorySet = new Set<string>();
    items.forEach(item => {
      if (item.category) {
        // Split by comma and process each category
        const categories = item.category.split(',').map(cat => cat.trim().toLowerCase()).filter(cat => cat.length > 0);
        categories.forEach(cat => categorySet.add(cat));
      }
    });
    return Array.from(categorySet).sort();
  }, [items]);

  // Filter items based on active filter
  const filteredItems = useMemo(() => {
    if (activeFilter === 'all') return items;
    return items.filter(item => {
      if (!item.category) return false;
      const itemCategories = item.category.split(',').map(cat => cat.trim().toLowerCase()).filter(cat => cat.length > 0);
      return itemCategories.includes(activeFilter);
    });
  }, [items, activeFilter]);

  const getCategoryDisplayName = (category?: string, locale: string = 'pl'): string | null => {
    if (!category) return null;

    const categories = category.split(',').map(cat => cat.trim().toLowerCase()).filter(cat => cat.length > 0);
    const mappedCategories: string[] = [];

    for (const normalizedCategory of categories) {
      let displayName: string | null = null;

      if (locale === 'en') {
        if (normalizedCategory === 'web-app' || normalizedCategory === 'webapp') displayName = 'Web App';
        else if (normalizedCategory === 'ecommerce' || normalizedCategory === 'e-commerce') displayName = 'E-commerce';
        else if (normalizedCategory === 'api') displayName = 'API';
        else if (normalizedCategory === 'mobile-apps' || normalizedCategory === 'mobile') displayName = 'Mobile';
        else if (normalizedCategory === 'landing') displayName = 'Landing';
        else if (normalizedCategory === 'tools' || normalizedCategory === 'tools & utilities') displayName = 'Tools';
        else if (normalizedCategory === 'services') displayName = 'Services';
        else if (normalizedCategory === 'ai') displayName = 'AI';
      } else {
        if (normalizedCategory === 'web-app' || normalizedCategory === 'webapp' || normalizedCategory === 'web') displayName = 'Web';
        else if (normalizedCategory === 'ecommerce' || normalizedCategory === 'e-commerce' || normalizedCategory === 'sklep') displayName = 'E-commerce';
        else if (normalizedCategory === 'api') displayName = 'API';
        else if (normalizedCategory === 'services' || normalizedCategory === 'usługi') displayName = 'Services';
        else if (normalizedCategory === 'mobile-apps' || normalizedCategory === 'mobile' || normalizedCategory === 'mobilne') displayName = 'Mobile';
        else if (normalizedCategory === 'landing' || normalizedCategory === 'portfolio' || normalizedCategory === 'wizytówka') displayName = 'Landing';
        else if (normalizedCategory === 'tools' || normalizedCategory === 'narzędzia' || normalizedCategory === 'utilities') displayName = 'Tools';
        else if (normalizedCategory === 'ai') displayName = 'AI';
      }

      if (displayName) {
        mappedCategories.push(displayName);
      }
    }

    return mappedCategories.length > 0 ? mappedCategories.join(', ') : null;
  };

  return (
    <section className="py-20 md:py-28 bg-transparent">
      <div className="mx-auto max-w-6xl px-4">
        <motion.h2
          className="text-4xl md:text-5xl font-extrabold tracking-tight text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          {t('title')}
        </motion.h2>

        {/* Filter Buttons */}
        <motion.div
          className="flex flex-wrap justify-center gap-3 mt-12 mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              activeFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-lg scale-105'
                : 'bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-600 text-black dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 hover:scale-105'
            }`}
          >
            {locale === 'en' ? 'All' : 'Wszystkie'}
          </button>
          {allCategories.slice(0, 8).map((category) => {
            const displayName = getCategoryDisplayName(category, locale) || category.charAt(0).toUpperCase() + category.slice(1);
            return (
              <button
                key={category}
                onClick={() => setActiveFilter(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 capitalize ${
                  activeFilter === category
                    ? 'bg-indigo-600 text-white shadow-lg scale-105'
                    : 'bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-600 text-black dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 hover:scale-105'
                }`}
              >
                {displayName}
              </button>
            );
          })}
        </motion.div>

        {/* Portfolio Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeFilter}
            className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 items-stretch"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            {filteredItems.length === 0 ? (
              <motion.p
                className="col-span-full text-center text-black dark:text-gray-500 py-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {locale === 'en' ? 'No projects found for this filter.' : 'Nie znaleziono projektów dla tego filtru.'}
              </motion.p>
            ) : (
              filteredItems.map((p, index) => {
                const imgClasses = p.isLogo ? 'object-contain bg-white p-6' : 'object-cover';
                const displayTitle = locale === 'en' && p.title_en ? p.title_en : p.title;
                const displayDesc = locale === 'en' && p.desc_en ? p.desc_en : p.desc;

                return (
                  <motion.article
                    key={p._id}
                    className="card group flex flex-col h-full text-center"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.6,
                      delay: index * 0.1,
                      ease: [0.4, 0.0, 0.2, 1]
                    }}
                    whileHover={{
                      y: -5,
                      transition: { duration: 0.2 }
                    }}
                  >
                    <div className="relative overflow-hidden rounded-xl h-64 sm:h-72 lg:h-80">
                      <Image
                        src={p.img}
                        alt={displayTitle}
                        fill
                        className={`${imgClasses} transition-transform duration-500 group-hover:scale-[1.02]`}
                        sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                        unoptimized
                      />
                      {getCategoryDisplayName(p.category, locale) && (
                        <span className="badge category">{getCategoryDisplayName(p.category, locale)}</span>
                      )}
                      {p.newTech && <span className="badge new-tech">{t('newTech')}</span>}
                    </div>

                    <motion.h3
                      className="mt-4 text-lg font-bold"
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      <a
                        href={p.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-black group/link underline-offset-4 hover:underline focus:underline focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-sm"
                      >
                        {displayTitle}
                      </a>
                    </motion.h3>

                    <p className="mt-2 text-sm text-black dark:text-gray-400">{displayDesc}</p>

                    {p.repoUrl?.trim() && (
                      <div className="mt-4">
                        <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-gray-500">
                          {t('repository')}
                        </div>
                        <a
                          href={p.repoUrl!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-black text-sm font-medium underline underline-offset-4 hover:no-underline break-all"
                          aria-label={`Repository ${p.title}`}
                        >
                          {p.repoUrl}
                        </a>
                      </div>
                    )}

                    <div className="mt-4 flex-1 flex flex-col justify-end">
                      <div className="font-semibold text-black mb-2">
                        {t('technologies')}
                      </div>
                      <div className="flex flex-wrap items-start gap-1.5">
                        {p.tags?.map((tag) => (
                          <motion.span
                            key={tag}
                            className={`chip shrink-0 ${
                              activeFilter === tag
                                ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200'
                                : 'bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300'
                            }`}
                            whileHover={{ scale: 1.1 }}
                            transition={{ duration: 0.2 }}
                          >
                            {tag}
                          </motion.span>
                        ))}
                      </div>
                    </div>
                  </motion.article>
                );
              })
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
