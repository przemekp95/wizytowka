import '@/styles/custom.scss';
import Image from 'next/image';
import Script from 'next/script';
import { notFound } from 'next/navigation';

import Header from '@/app/_components/Header';
import ContactForm from '@/app/_components/ContactForm';
import { SkillBar } from '@/components/SkillBar';
import { TechStackChart, PortfolioCategory } from '@/components/TechStackChart';
import { ChatBot } from '@/components/Chat/ChatBot';
import { ThreeBackground } from '@/components/ThreeBackground';
import { calculatePortfolioCategories, calculateDynamicSkills } from '@/data/skills.data';
import dynamicImport from 'next/dynamic';

// Import PortfolioSection as client component
const PortfolioSection = dynamicImport(() => import('@/components/PortfolioSection'));

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

  try {
    const res = await fetch(`${base}/api/portfolio`, {
      next: { revalidate },
    });

    if (!res.ok) {
      return [];
    }

    const data = (await res.json()) as { ok: boolean; items: PortfolioItem[] };
    return data?.items ?? [];
  } catch (error) {
    console.error('Portfolio fetch failed, using fallback data', error);
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

  // Fetch portfolio data - this will be used on the server side
  const itemsPromise = fetchPortfolio();
  const tPromise = getTranslations(locale);

  const [items, t] = await Promise.all([itemsPromise, tPromise]);

  // Wyliczenie kategorii projektów i umiejętności na podstawie portfola
  const portfolioCategories = calculatePortfolioCategories(items);
  const dynamicSkills = calculateDynamicSkills(items);

  // Removed duplicate getCategoryDisplayName function - use component version instead

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

      <main className="pt-14 bg-transparent">
        <section id="home" className="relative overflow-hidden bg-transparent">
          <div className="mx-auto max-w-6xl px-4 py-24 md:py-32 grid md:grid-cols-2 gap-10 items-center">
            <div className="relative w-full max-w-md mx-auto" data-aos="fade-right">
              <div className="absolute inset-0 bg-white bg-opacity-10 rounded-xl -z-10 transform scale-105" />
              <div className="relative overflow-hidden rounded-xl bg-white border border-gray-200 aspect-[4/3]">
                <Image
                  src="/images/PP-2-JPG-01.webp"
                  alt="Przemysław Pietrzak"
                  fill
                  className="object-cover transition-all duration-500 brightness-110 contrast-110 saturate-110"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
              </div>
            </div>

            <div data-aos="fade-left" data-aos-delay="200">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight text-white fade-up">
                {t('hero.title')}
              </h1>
              <p className="mt-5 max-w-prose text-lg text-gray-300 fade-up-delayed">
                {t('hero.description')}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3 fade-up-delayed2">
                <a
                  href="#portfolio"
                  className="inline-flex items-center px-6 py-3 bg-gray-800 border border-gray-600 rounded-lg font-medium text-gray-100 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  data-aos="zoom-in"
                  data-aos-delay="400"
                >
                  {t('hero.viewProjects')}
                </a>
                <a
                  href="#contact"
                  className="inline-flex items-center px-6 py-3 bg-gray-800 border border-gray-600 rounded-lg font-medium text-gray-100 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  data-aos="zoom-in"
                  data-aos-delay="600"
                >
                  {t('hero.contactMe')}
                </a>
              </div>
            </div>
          </div>
        </section>

        <div id="portfolio" className="bg-gray-800/30">
          <PortfolioSection items={items} locale={locale} />
        </div>

        <section id="about" className="bg-gray-800/60">
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
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
                {t('about.title')}
              </h2>
              <p className="mt-3 text-gray-300 leading-relaxed text-justify">
                {t('about.description')}
              </p>

              <div className="mt-8">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
                  {t('about.techStack')}
                </h3>
                <ul className="mt-4 space-y-3 text-gray-300">
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

        {/* Skills section - showing top technologies by project count */}
        <section id="skills" className="py-20 md:py-28 bg-transparent text-white">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-center text-white mb-16">
              {locale === 'en' ? 'Skills & Technologies' : 'Umiejętności i technologie'}
            </h2>

            <div className="flex flex-col items-center">
              <div className="w-full max-w-4xl">
                {dynamicSkills && dynamicSkills.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dynamicSkills
                      .filter(
                        (skill) => skill.category === 'frontEnd' || skill.category === 'backEnd'
                      )
                      .slice(0, 10)
                      .map((skill) => (
                        <SkillBar
                          key={skill.id}
                          skill={skill}
                          locale={locale as 'pl' | 'en'}
                          maxProjects={Math.max(...dynamicSkills.map((s) => s.projectCount))}
                        />
                      ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500">
                    {locale === 'en' ? 'No skills data available' : 'Brak danych o umiejętnościach'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section id="tech-analysis" className="py-20 md:py-28 bg-transparent text-white">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-center text-white mb-16">
              {locale === 'en' ? 'Project Portfolio Analysis' : 'Analiza portfela projektów'}
            </h2>

            {/* Portfolio Categories Chart - using NEW TechStackChart component */}
            <div className="flex flex-col items-center">
              <TechStackChart
                locale={locale as 'pl' | 'en'}
                portfolioCategories={portfolioCategories}
              />
            </div>
          </div>
        </section>

        <section id="contact" className="py-24 bg-transparent text-white">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="section-title text-center text-4xl md:text-5xl font-extrabold tracking-tight text-white">
              {t('contact.title')}
            </h2>
            <div className="mt-10 flex justify-center">
              <ContactForm />
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 border-t border-gray-800">
        <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-gray-300 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-100">
            {t('footer.copyright', { year: new Date().getFullYear() })}
          </p>
          <div className="flex items-center gap-4">
            <a
              className="text-gray-300 hover:text-gray-100 transition-colors"
              href="https://github.com/przemekp95"
            >
              {t('footer.github')}
            </a>
            <a
              className="text-gray-300 hover:text-gray-100 transition-colors"
              href="https://www.linkedin.com/in/przempietrzak/"
            >
              {t('footer.linkedin')}
            </a>
          </div>
        </div>
      </footer>

      <ChatBot />
    </>
  );
}
