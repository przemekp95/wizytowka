import '@/styles/custom.scss';
import Image from 'next/image';
import Script from 'next/script';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';

import Header from '@/app/_components/Header';
import ContactForm from '@/app/_components/ContactForm';
import { ChatBot } from '@/components/Chat/ChatBot';
import { ThreeBackground } from '@/components/ThreeBackground';
import dynamicImport from 'next/dynamic';

// Import PortfolioSection as client component
const PortfolioSection = dynamicImport(() => import('@/components/PortfolioSection'));

export const revalidate = 300;

type PortfolioItem = {
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
  newTech?: boolean;
  category?: string;
  repoUrl?: string | null;
  dateFrom?: Date;
  dateTo?: Date;
};

type TranslationParams = Record<string, string | number>;
type TranslationSection = Record<string, string>;
type TranslationMessages = Record<string, unknown>;
type PortfolioFetchResult = {
  items: PortfolioItem[];
  isDegraded: boolean;
};

function getPortfolioUnavailableMessage(locale: string): string {
  return locale === 'en'
    ? 'Portfolio is temporarily unavailable. Please try again later.'
    : 'Portfolio jest chwilowo niedostępne. Spróbuj ponownie później.';
}

async function fetchPortfolio(): Promise<PortfolioFetchResult> {
  const apiOrigin = process.env.BACKEND_API_URL ?? 'http://localhost:4000';

  try {
    const res = await fetch(`${apiOrigin}/api/portfolio`, {
      next: { revalidate },
    });

    if (!res.ok) {
      return { items: [], isDegraded: true };
    }

    const data = (await res.json()) as { ok: boolean; items: PortfolioItem[] };
    if (!data?.ok) {
      return { items: [], isDegraded: true };
    }

    return {
      items: data.items ?? [],
      isDegraded: false,
    };
  } catch (error) {
    console.error('Portfolio fetch failed, using fallback data', error);
    return { items: [], isDegraded: true };
  }
}

async function loadMessages(locale: string): Promise<TranslationMessages> {
  try {
    return (await import(`@/i18n/messages/${locale}.json`)).default;
  } catch (error) {
    console.error('Error loading translations for locale:', locale, error);
    return {};
  }
}

function getSection(messages: TranslationMessages, section: string): TranslationSection {
  const value = messages[section];
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  const sectionEntries = Object.entries(value);
  return Object.fromEntries(
    sectionEntries.filter(([, v]) => typeof v === 'string')
  ) as TranslationSection;
}

function createTranslator(messages: TranslationMessages) {
  return (key: string, params?: TranslationParams) => {
    const keys = key.split('.');
    let value: unknown = messages;

    for (const currentKey of keys) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return key;
      }
      value = (value as TranslationMessages)[currentKey];
    }

    if (typeof value !== 'string') {
      return key;
    }

    if (!params) {
      return value;
    }

    return value.replace(/{(\w+)}/g, (match, param) => String(params[param] ?? match));
  };
}

export default async function OnePager({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const nonce = (await headers()).get('x-nonce') ?? undefined;

  if (!['pl', 'en'].includes(locale)) {
    notFound();
  }

  // Fetch portfolio data - this will be used on the server side
  const itemsPromise = fetchPortfolio();
  const messagesPromise = loadMessages(locale);

  const [portfolioState, messages] = await Promise.all([itemsPromise, messagesPromise]);
  const t = createTranslator(messages);
  const navTranslations = getSection(messages, 'nav');
  const portfolioTranslations = getSection(messages, 'portfolio');
  const contactTranslations = getSection(messages, 'contact');
  const chatTranslations = getSection(messages, 'chat');
  const portfolioUnavailableMessage = portfolioState.isDegraded
    ? (portfolioTranslations.unavailable ?? getPortfolioUnavailableMessage(locale))
    : null;

  const skillGroups = [
    {
      title: t('skillsSection.primary'),
      technologies: ['TypeScript', 'React', 'Next.js', 'Node.js', 'NestJS', 'Fastify'],
    },
    {
      title: t('skillsSection.backend'),
      technologies: ['PHP', 'Symfony', 'Laravel', 'REST', 'GraphQL', 'OpenAPI', 'Messenger'],
    },
    {
      title: t('skillsSection.delivery'),
      technologies: [
        'PostgreSQL',
        'MySQL',
        'MongoDB',
        'Redis',
        'Docker',
        'GitHub Actions',
        'Playwright',
        'Railway',
        'Render',
      ],
    },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Przemysław Pietrzak',
    jobTitle: 'Full-stack TypeScript Developer',
    description:
      locale === 'en'
        ? 'Full-stack TypeScript Developer working with React, Next.js, Node.js and NestJS, plus PHP/Symfony, APIs, queues and databases.'
        : 'Full-stack TypeScript Developer: React, Next.js, Node.js i NestJS oraz PHP/Symfony, API, kolejki i bazy danych.',
    knowsAbout: [
      'Next.js',
      'React',
      'TypeScript',
      'Node.js',
      'NestJS',
      'PHP',
      'Symfony',
      'Laravel',
      'Messenger',
      'PostgreSQL',
      'MongoDB',
      'REST API',
      'GraphQL',
      'Docker',
    ],
    hasOccupation: {
      '@type': 'Occupation',
      name: 'Full-stack TypeScript Developer',
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
        nonce={nonce}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />
      <ThreeBackground />
      <Header translations={navTranslations} />

      <main className="pt-14 bg-transparent">
        <section id="home" className="relative overflow-hidden bg-transparent">
          <div className="mx-auto max-w-6xl px-4 py-24 md:py-32 grid md:grid-cols-2 gap-10 items-center">
            <div className="relative w-full max-w-md mx-auto" data-aos="fade-right">
              <div className="absolute inset-0 bg-white bg-opacity-10 rounded-xl -z-10 transform scale-105" />
              <div className="relative overflow-hidden rounded-xl bg-white border border-gray-200 aspect-4/3">
                <Image
                  src="/images/PP-2-JPG-01.webp"
                  alt="Przemysław Pietrzak"
                  fill
                  sizes="(min-width: 1024px) 448px, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-all duration-500 brightness-110 contrast-110 saturate-110"
                  priority
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/10 via-transparent to-transparent" />
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
          <PortfolioSection
            items={portfolioState.items}
            locale={locale}
            translations={portfolioTranslations}
            degradedMessage={portfolioUnavailableMessage}
          />
        </div>

        <section id="about" className="bg-gray-800/60">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24 grid gap-10 lg:grid-cols-5 lg:items-center">
            <div className="lg:col-span-2 flex justify-center">
              <div className="relative size-60 overflow-hidden rounded-full shadow-lg">
                <Image
                  src="/portfolio/ai-offline.jpg"
                  alt="Przemysław Pietrzak"
                  fill
                  sizes="240px"
                  className="object-cover object-top"
                  priority
                />
              </div>
            </div>
            <div className="lg:col-span-3">
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
                {t('about.title')}
              </h2>
              <p className="mt-3 text-gray-300 leading-relaxed text-justify">
                {t('about.description')}
              </p>
            </div>
          </div>
        </section>

        {/* Skills section - curated around the public case studies. */}
        <section id="skills" className="py-20 md:py-28 bg-transparent text-white">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid gap-8 border-b border-white/15 pb-12 lg:grid-cols-[0.65fr_1.35fr] lg:gap-16">
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-cyan-300">
                stack / focus
              </p>
              <div>
                <h2 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  {t('skillsSection.title')}
                </h2>
                <p className="mt-5 max-w-2xl text-base leading-7 text-gray-300 sm:text-lg">
                  {t('skillsSection.intro')}
                </p>
              </div>
            </div>

            <div className="grid gap-10 pt-12 md:grid-cols-3 md:gap-8">
              {skillGroups.map((group, index) => (
                <div key={group.title} className="border-t border-white/20 pt-5">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="text-lg font-semibold text-white">{group.title}</h3>
                    <span className="font-mono text-xs text-cyan-300">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-3 text-sm leading-6 text-gray-300">
                    {group.technologies.map((technology) => (
                      <li key={technology} className="border-b border-white/10 pb-1">
                        {technology}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="py-24 bg-transparent text-white">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-center text-4xl md:text-5xl font-extrabold tracking-tight text-white">
              {t('contact.title')}
            </h2>
            <div className="mt-10 flex justify-center">
              <ContactForm locale={locale} translations={contactTranslations} />
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

      <ChatBot locale={locale} translations={chatTranslations} />
    </>
  );
}
