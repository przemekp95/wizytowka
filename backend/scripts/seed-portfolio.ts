/* pnpm tsx scripts/seed-portfolio.ts */
import 'dotenv/config'; // <-- wczyta backend/.env
import { MongoClient } from 'mongodb';

const items = [
  {
    title: 'CASN Laravel',
    href: 'https://casn.pietrzakprzemyslaw.pl',
    desc: 'Stworzyłem aplikację webową w frameworku Laravel dla Centrum Analiz Służby Niepodległej. Wdrożyłem routing, responsywny front (Blade), deploy na hosting. (link prowadzi do zdjętej wersji strony)',
    tags: ['Laravel', 'PHP', 'Blade', 'Github', 'Bootstrap'],
    img: '/images/logo.jpg',
    isLogo: true,
    newTech: false,
    slug: 'casn-laravel',
  },
  {
    title: 'CASN Next.js',
    href: 'https://casn.pl',
    desc: 'Migracja strony think-tanku z Laravel na Next.js 15 App Router.',
    tags: ['Next.js', 'Prisma', 'MySQL', 'Typescript', 'Markdown', 'Github'],
    img: '/images/logo.jpg',
    isLogo: true,
    newTech: false,
    slug: 'casn-nextjs',
  },
  {
    title: 'Mazowieści',
    href: 'https://mazowiesci.pl',
    desc: 'Przeprowadziłem pełną migrację serwisu informacyjnego z WIX do WordPress. Zautomatyzowałem ekstrakcję artykułów z pomocą Python (Scrapy) i zaimportowałem treści do bazy danych WordPress. Stworzyłem niestandardowe skrypty PHP do integracji danych, wdrożyłem politykę optymalizacji SEO, przebudowałem menu i system tagów. Zoptymalizowałem szybkość strony i poprawiłem jej pozycję w Google.',
    tags: ['Python (Scrapy)', 'WordPress', 'PHP', 'HTML', 'CSS', 'REST API', 'SEO'],
    img: '/images/mazo.png',
    isLogo: true,
    newTech: false,
    slug: 'mazowiesci',
  },
  {
    title: 'Strona Wizytówka',
    href: 'https://pietrzakprzemyslaw.pl',
    desc: 'One-pager w Next.js z Tailwind i Sass.',
    tags: ['Next.js', 'Tailwind', 'Sass'],
    img: '/images/PP-2-JPG-01.webp',
    isLogo: true,
    newTech: false,
    slug: 'strona-wizytowka',
  },
  {
    title: 'Fundacja Służba Niepodległej',
    href: 'https://sluzbaniepodleglej.pl',
    desc: 'Administrowałem i rozwijałem stronę fundacji opartą na WordPress. Wdrażałem nowe podstrony, strategię treści SEO.',
    tags: ['WordPress', 'PHP', 'CSS', 'HTML', 'Google Search Console', 'SEO'],
    img: '/images/logo-sluzba-niepodleglej.png',
    isLogo: true,
    newTech: false,
    slug: 'fundacja-sluzba-niepodleglej',
  },
];

(async () => {
  const uri =
    process.env.MONGODB_URI ??
    'mongodb://root:root@localhost:27017/?authSource=admin';
  const dbName = process.env.MONGODB_DB ?? 'wizytowka';

  if (!uri.startsWith('mongodb')) {
    throw new Error('Brak poprawnego MONGODB_URI w .env');
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const col = db.collection('portfolio_items');

  const now = new Date();
  await col.deleteMany({});
  await col.insertMany(
    items.map((p, i) => ({
      ...p,
      _id: p.slug,
      order: i + 1,
      status: 'published',
      createdAt: now,
      updatedAt: now,
    })),
  );

  await client.close();
  console.log('Seed OK');
})();
