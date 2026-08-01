'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

interface PortfolioItem {
  _id: string;
  title: string;
  title_en?: string;
  slug: string;
  href: string;
  desc: string;
  desc_en?: string;
  problem?: string;
  problem_en?: string;
  role?: string;
  role_en?: string;
  decisions?: string[];
  decisions_en?: string[];
  result?: string;
  result_en?: string;
  tags: string[];
  img: string;
  isLogo?: boolean;
  category?: string;
  repoUrl?: string | null;
}

interface PortfolioSectionProps {
  items: PortfolioItem[];
  locale: string;
  translations: Record<string, string>;
  degradedMessage?: string | null;
}

type LocalizedCaseStudy = {
  title: string;
  summary: string;
  problem?: string;
  role?: string;
  decisions: string[];
  result?: string;
};

function localize(item: PortfolioItem, locale: string): LocalizedCaseStudy {
  const isEnglish = locale === 'en';

  return {
    title: isEnglish && item.title_en ? item.title_en : item.title,
    summary: isEnglish && item.desc_en ? item.desc_en : item.desc,
    problem: isEnglish && item.problem_en ? item.problem_en : item.problem,
    role: isEnglish && item.role_en ? item.role_en : item.role,
    decisions: isEnglish && item.decisions_en ? item.decisions_en : (item.decisions ?? []),
    result: isEnglish && item.result_en ? item.result_en : item.result,
  };
}

export default function PortfolioSection({
  items,
  locale,
  translations,
  degradedMessage,
}: PortfolioSectionProps) {
  const fallback = {
    title: locale === 'en' ? 'Selected projects' : 'Wybrane projekty',
    intro:
      locale === 'en'
        ? 'Five projects where I was responsible for the code, technical decisions and delivery.'
        : 'Pięć projektów, przy których odpowiadałem za kod, decyzje techniczne i wdrożenie.',
    noItems: locale === 'en' ? 'No case studies to display.' : 'Brak case studies do wyświetlenia.',
    problem: locale === 'en' ? 'Project goal' : 'Cel projektu',
    role: locale === 'en' ? 'My scope' : 'Mój zakres',
    decisions: locale === 'en' ? 'What I did' : 'Co zrobiłem',
    result: locale === 'en' ? 'Outcome' : 'Efekt',
    stack: 'Stack',
    liveProof: locale === 'en' ? 'View project' : 'Zobacz projekt',
    sourceRepository: locale === 'en' ? 'Code on GitHub' : 'Kod na GitHubie',
  };
  const t = (key: keyof typeof fallback) => translations[key] ?? fallback[key];
  const showDegradedState = Boolean(degradedMessage && items.length === 0);

  return (
    <section className="bg-slate-950 py-24 text-white md:py-32" aria-labelledby="portfolio-heading">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <motion.div
          className="grid gap-6 border-b border-white/15 pb-14 lg:grid-cols-[0.65fr_1.35fr] lg:gap-16"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          viewport={{ once: true, amount: 0.35 }}
        >
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-cyan-300">
            01 — 05 / portfolio
          </p>
          <div>
            <h2
              id="portfolio-heading"
              className="text-4xl font-semibold tracking-tight sm:text-5xl"
            >
              {t('title')}
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              {t('intro')}
            </p>
          </div>
        </motion.div>

        {showDegradedState ? (
          <p
            className="mt-12 border-l-2 border-amber-300 bg-amber-300/10 px-6 py-5 text-sm text-amber-100"
            role="status"
            aria-live="polite"
          >
            {degradedMessage}
          </p>
        ) : items.length === 0 ? (
          <p className="py-16 text-center text-slate-400">{t('noItems')}</p>
        ) : (
          <div>
            {items.map((item, index) => {
              const content = localize(item, locale);
              const articleNumber = String(index + 1).padStart(2, '0');

              return (
                <motion.article
                  key={item._id}
                  className="group grid gap-8 border-b border-white/15 py-14 lg:grid-cols-[0.65fr_1.35fr] lg:gap-16 lg:py-20"
                >
                  <div>
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="font-mono text-sm text-cyan-300">{articleNumber}</span>
                      {item.category && (
                        <span className="text-right font-mono text-[0.68rem] uppercase tracking-[0.18em] text-slate-500">
                          {item.category.replaceAll(',', ' /')}
                        </span>
                      )}
                    </div>
                    <div
                      className={`relative mt-6 overflow-hidden ${
                        item.isLogo
                          ? 'aspect-[16/9] bg-white lg:aspect-[4/3]'
                          : 'aspect-[4/3] bg-white/5'
                      }`}
                    >
                      <Image
                        src={item.img}
                        alt=""
                        fill
                        className={`${
                          item.isLogo ? 'object-contain bg-white p-8' : 'object-cover'
                        } transition-transform duration-700 group-hover:scale-[1.025]`}
                        sizes="(min-width: 1024px) 34vw, 100vw"
                        unoptimized
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                      {content.title}
                    </h3>
                    <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300">
                      {content.summary}
                    </p>

                    <dl className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2">
                      {content.problem && (
                        <div className="border-l border-cyan-300/50 pl-5">
                          <dt className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-300">
                            {t('problem')}
                          </dt>
                          <dd className="mt-3 text-sm leading-6 text-slate-200">
                            {content.problem}
                          </dd>
                        </div>
                      )}
                      {content.role && (
                        <div className="border-l border-cyan-300/50 pl-5">
                          <dt className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-300">
                            {t('role')}
                          </dt>
                          <dd className="mt-3 text-sm leading-6 text-slate-200">{content.role}</dd>
                        </div>
                      )}
                      {content.decisions.length > 0 && (
                        <div className="border-l border-cyan-300/50 pl-5 sm:col-span-2">
                          <dt className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-300">
                            {t('decisions')}
                          </dt>
                          <dd className="mt-3">
                            <ul className="grid gap-3 text-sm leading-6 text-slate-200 sm:grid-cols-2">
                              {content.decisions.map((decision) => (
                                <li
                                  key={decision}
                                  className="relative pl-5 before:absolute before:left-0 before:text-cyan-300 before:content-['→']"
                                >
                                  {decision}
                                </li>
                              ))}
                            </ul>
                          </dd>
                        </div>
                      )}
                      {content.result && (
                        <div className="border-l border-cyan-300/50 pl-5 sm:col-span-2">
                          <dt className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-300">
                            {t('result')}
                          </dt>
                          <dd className="mt-3 text-sm leading-6 text-slate-200">
                            {content.result}
                          </dd>
                        </div>
                      )}
                    </dl>

                    <div className="mt-10 border-t border-white/10 pt-7">
                      <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-500">
                        {t('stack')}
                      </p>
                      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2" aria-label={t('stack')}>
                        {item.tags.map((tag) => (
                          <li key={tag} className="text-sm text-slate-300">
                            {tag}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3">
                      {item.href.trim() && (
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="border-b border-cyan-300 pb-1 text-sm font-semibold text-white transition-colors hover:text-cyan-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                          aria-label={t('liveProof')}
                        >
                          {t('liveProof')} ↗
                        </a>
                      )}
                      {item.repoUrl?.trim() && (
                        <a
                          href={item.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="border-b border-slate-500 pb-1 text-sm font-semibold text-slate-200 transition-colors hover:border-cyan-300 hover:text-cyan-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                          aria-label={t('sourceRepository')}
                        >
                          {t('sourceRepository')} ↗
                        </a>
                      )}
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
