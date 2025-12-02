import '@/styles/custom.scss';
import Image from 'next/image';
import Script from 'next/script';
import { notFound } from 'next/navigation';

import Header from '@/app/_components/Header';
import ContactForm from '@/app/_components/ContactForm';
import { SkillProgress, TechTrend } from '@/components/SkillProgress';
import { TechStackChart, PortfolioCategory } from '@/components/TechStackChart';
import { ChatBot } from '@/components/Chat/ChatBot';
import { ThreeBackground } from '@/components/ThreeBackground';
import { calculateTechTrends, calculatePortfolioCategories } from '@/data/skills.data';

export const dynamic = 'force-static';
export const revalidate = 300;

type PortfolioItem = {
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
};

async function fetchPortfolio(): Promise<PortfolioItem[]> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  console.log('🔍 Portfolio fetch: API_BASE_URL =', base);

  try {
    const res = await fetch(`${base}/api/portfolio`, {
      next: { revalidate },
    });

    console.log('🔍 Portfolio fetch: HTTP status =', res.status);

    if (!res.ok) {
      console.log('❌ Portfolio API returned not ok, using fallback data');
      return [];
    }

    const data = (await res.json()) as { ok: boolean; items: PortfolioItem[] };
    const items = data?.items ?? [];

    console.log('✅ Portfolio fetched from API, items count:', items.length);

    // Log first item to see if it's real data or fallback
    if (items.length > 0) {
      console.log('📊 First portfolio item:', {
        title: items[0].title,
        tags: items[0].tags,
        dateFrom: items[0].dateFrom,
      });
    }

    return items;
  } catch (error) {
    console.log('❌ Portfolio fetch failed:', error);
    console.log('📋 Using fallback hardcoded data');
    return [];
  }
}

async function getTranslations(locale: string) {
  try {
    const messages = (await import(`@/i18n/messages/${locale}.json`)).default;
    return (key: string, params?: Record<string, string | number>) => {
      const keys = key.split('.');
      let value = messages;
      for (const k of keys) {
        value = value?.[k];
      }
      if (typeof value === 'string' && params) {
        return value.replace(/{(\w+)}/g, (match, param) => String(params[param] || match));
      }
      return value || key;
    };
  } catch (error) {
    console.error('Error loading translations for locale:', locale, error);
    return (key: string) => key;
  }
}

export default async function OnePager({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  if (!['pl', 'en'].includes(locale)) {
    notFound();
  }

  const items = await fetchPortfolio();
  const t = await getTranslations(locale);

  // Wyliczenie trendów technologii i kategorii projektów na podstawie portfola
  const techTrends = calculateTechTrends(items);
  const portfolioCategories = calculatePortfolioCategories(items);

  // Funkcja do mapowania nazw kategorii na czytelne nazwy dla oznaczeń
  const getCategoryDisplayName = (category?: string, locale: string = 'pl'): string | null => {
    if (!category) return null;

    // Dla wielu kategorii oddzielonych przecinkami, przetwaramy każdą
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
        else if (normalizedCategory === 'ai') displayName = 'AI';
      } else {
        if (normalizedCategory === 'web-app' || normalizedCategory === 'webapp' || normalizedCategory === 'web') displayName = 'WEB';
        else if (normalizedCategory === 'ecommerce' || normalizedCategory === 'e-commerce' || normalizedCategory === 'sklep') displayName = 'E-COMMERCE';
        else if (normalizedCategory === 'api' || normalizedCategory === 'services' || normalizedCategory === 'usługi') displayName = 'SERVICES';
        else if (normalizedCategory === 'mobile-apps' || normalizedCategory === 'mobile' || normalizedCategory === 'mobilne') displayName = 'MOBILE';
        else if (normalizedCategory === 'landing' || normalizedCategory === 'portfolio' || normalizedCategory === 'wizytówka') displayName = 'LANDING';
        else if (normalizedCategory === 'tools' || normalizedCategory === 'narzędzia' || normalizedCategory === 'utilities') displayName = 'TOOLS';
        else if (normalizedCategory === 'ai') displayName = 'AI';
      }

      if (displayName) {
        mappedCategories.push(displayName);
      }
    }

    // Zwracamy wszystkie mapowane kategorie rozdzielone przecinkami
    return mappedCategories.length > 0 ? mappedCategories.join(', ') : null;
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Przemysław Pietrzak',
    jobTitle: locale === 'en' ? 'Full Stack Web Developer' : 'Full Stack Web Developer',
    description:
      locale === 'en'
        ? 'I build modern web applications (Next.js, Laravel, Node) and design solutions based on SQL, NoSQL and API (REST, GraphQL). I combine legal knowledge with technology.'
        : 'Buduję nowoczesne aplikacje webowe (Next.js, Laravel, Node) i projektuję rozwiązania oparte na SQL, NoSQL oraz API (REST, GraphQL). Łączę wiedzę prawniczą z technologią.',
    knowsAbout: [
      'Next.js',
      'React',
      'TypeScript',
      'Node.js',
      'PHP',
      'Laravel',
      'PostgreSQL',
      'MongoDB',
      'REST API',
      'GraphQL',
      'Docker',
      'Kubernetes',
    ],
    hasOccupation: {
      '@type': 'Occupation',
      name: 'Full Stack Developer',
      occupationalCategory: 'Software Development',
    },
    sameAs: [
      'https://github.com/przemekp95',
      'https://www.linkedin.com/in/przempietrzak/',
      'https://pietrzakprzemyslaw.pl',
    ],
    nationality: {
      '@type': 'Country',
      name: 'Poland',
    },
    knowsLanguage: [
      {
        '@type': 'Language',
        name: 'Polish',
        alternateName: 'pl',
      },
      {
        '@type': 'Language',
        name: 'English',
        alternateName: 'en',
      },
    ],
      url: `https://pietrzakprzemyslaw.pl/${locale}`,
    image: 'https://wizytowka.s3.eu-north-1.amazonaws.com/PP-2-JPG-01.webp',
  };

  return (
    <>
      <Script
        id="structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />
      <ThreeBackground />
      <Header />

      <main className="pt-14 bg-transparent text-slate-900">
        <section id="home" className="relative overflow-hidden bg-transparent">
          <div className="mx-auto max-w-6xl px-4 py-24 md:py-32 grid md:grid-cols-2 gap-10 items-center">
            <div className="relative">
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
                <Image
                  src="/images/PP-2-JPG-01.webp"
                  alt="Przemysław Pietrzak"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>

            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight fade-up">
                {t('hero.title')}
              </h1>
              <p className="mt-5 max-w-prose text-lg text-slate-600 fade-up-delayed">
                {t('hero.description')}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3 fade-up-delayed2">
                <a
                  href="#portfolio"
                  className="inline-flex items-center px-6 py-3 bg-white border border-slate-300 rounded-lg font-medium text-slate-900 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                >
                  {t('hero.viewProjects')}
                </a>
                <a
                  href="#contact"
                  className="inline-flex items-center px-6 py-3 bg-white border border-slate-300 rounded-lg font-medium text-slate-900 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                >
                  {t('hero.contactMe')}
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="portfolio" className="py-20 md:py-28 bg-transparent">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-center">
              {t('portfolio.title')}
            </h2>

            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
              {items.length === 0 && (
                <p className="col-span-full text-center text-slate-500">{t('portfolio.noItems')}</p>
              )}

              {items.map((p) => {
                const imgClasses = p.isLogo ? 'object-contain bg-white p-6' : 'object-cover';
                const displayTitle = locale === 'en' && p.title_en ? p.title_en : p.title;
                const displayDesc = locale === 'en' && p.desc_en ? p.desc_en : p.desc;

                return (
                  <article key={p._id} className="card group flex flex-col h-full text-center">
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
                      {p.newTech && <span className="badge new-tech">{t('portfolio.newTech')}</span>}
                    </div>
                    <h3 className="mt-4 text-lg font-bold">
                      <a
                        href={p.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group/link underline-offset-4 hover:underline focus:underline focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-sm"
                      >
                        {displayTitle}
                      </a>
                    </h3>
                    <p className="mt-2 text-sm text-slate-600">{displayDesc}</p>

                    {p.repoUrl?.trim() && (
                      <div className="mt-4">
                        <div className="text-xs uppercase tracking-wide text-slate-500">
                          {t('portfolio.repository')}
                        </div>
                        <a
                          href={p.repoUrl!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium underline underline-offset-4 hover:no-underline break-all"
                          aria-label={`Repozytorium ${p.title}`}
                        >
                          {p.repoUrl}
                        </a>
                      </div>
                    )}

                    <div className="mt-4">
                      <div className="font-semibold text-slate-800">
                        {t('portfolio.technologies')}
                      </div>
                      <div className="mt-2 flex flex-wrap items-start gap-1.5 max-w-full">
                        {p.tags?.map((t) => (
                          <span key={t} className="chip shrink-0">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="about" className="bg-transparent">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24 grid gap-10 lg:grid-cols-5 lg:items-center">
            <div className="lg:col-span-2 flex justify-center">
              <Image
                src="/portfolio/ai-offline.jpg"
                alt="Przemysław Pietrzak"
                width={240}
                height={240}
                className="rounded-full shadow-lg object-cover"
                priority
              />
            </div>
            <div className="lg:col-span-3">
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                {t('about.title')}
              </h2>
              <p className="mt-3 text-slate-700 leading-relaxed text-justify">
                {t('about.description')}
              </p>

              <div className="mt-8">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  {t('about.techStack')}
                </h3>
                <ul className="mt-4 space-y-3">
                  <li className="bullet">
                    <strong>{t('about.frontend')}</strong>
                  </li>
                  <li className="bullet">
                    <strong>{t('about.backend')}</strong>
                  </li>
                  <li className="bullet">
                    <strong>{t('about.databases')}</strong>
                  </li>
                  <li className="bullet">
                    <strong>{t('about.devops')}</strong>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section id="skills" className="py-20 md:py-28 bg-transparent">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-center mb-16">
              {locale === 'en' ? 'Technology Analysis' : 'Analiza technologiczna'}
            </h2>

            <div className="grid gap-12 lg:grid-cols-2 items-start">
              {/* Technology Trends year-over-year - using NEW SkillProgress component */}
              <div>
                <h3 className="text-xl font-semibold text-slate-700 mb-6">
                  {locale === 'en' ? 'Technology Trends (YoY)' : 'Trendy technologii (rok do roku)'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {techTrends
                    .filter(trend => trend.category === 'frontEnd' || trend.category === 'backEnd')
                    .map((trend) => (
                      <SkillProgress key={trend.id} trend={trend} />
                    ))}
                </div>
              </div>

              {/* Portfolio Categories Chart - using NEW TechStackChart component */}
              <div className="flex flex-col items-center">
                <h3 className="text-xl font-semibold text-slate-700 mb-6">
                  {locale === 'en' ? 'Portfolio Categories' : 'Kategorie projektów'}
                </h3>
                <TechStackChart
                  locale={locale as 'pl' | 'en'}
                  portfolioCategories={portfolioCategories}
                />
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className="py-24 bg-transparent">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="section-title text-center text-4xl md:text-5xl font-extrabold tracking-tight">
              {t('contact.title')}
            </h2>
            <p className="mt-2 text-center text-slate-600">{t('contact.description')}</p>
            <div className="mt-10 flex justify-center">
              <ContactForm />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
          <div className="flex items-center gap-4">
            <a className="link" href="https://github.com/przemekp95">
              {t('footer.github')}
            </a>
            <a className="link" href="https://www.linkedin.com/in/przempietrzak/">
              {t('footer.linkedin')}
            </a>
          </div>
        </div>
      </footer>

      <ChatBot />
    </>
  );
}
