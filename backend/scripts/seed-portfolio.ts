import 'dotenv/config';
import { MongoClient } from 'mongodb';

const items = [
  {
    title: 'CASN Laravel',
    href: 'https://casn.pietrzakprzemyslaw.pl',
    desc: 'Stworzyłem aplikację webową...',
    tags: ['Laravel', 'PHP', 'Blade', 'Github', 'Bootstrap'],
    img: '/images/logo.jpg',
    isLogo: true,
    newTech: false,
    slug: 'casn-laravel',
    dateFrom: new Date('2022-03-01'),
    dateTo: new Date('2022-07-31'),
  },
  {
    title: 'CASN Next.js',
    href: 'https://casn.pl',
    desc: 'Migracja strony think-tanku...',
    tags: ['Next.js', 'Prisma', 'MySQL', 'Typescript', 'Markdown', 'Github'],
    img: '/images/logo.jpg',
    isLogo: true,
    newTech: false,
    slug: 'casn-nextjs',
    dateFrom: new Date('2022-08-01'),
    dateTo: new Date('2023-02-28'),
  },
  {
    title: 'Mazowieści',
    href: 'https://mazowiesci.pl',
    desc: 'Migracja z WIX do WordPress, import treści, SEO...',
    tags: ['Python (Scrapy)', 'WordPress', 'PHP', 'HTML', 'CSS', 'REST API', 'SEO'],
    img: '/images/mazo.png',
    isLogo: true,
    newTech: false,
    slug: 'mazowiesci',
    dateFrom: new Date('2023-01-15'),
    dateTo: new Date('2023-06-30'),
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
    dateFrom: new Date('2024-03-01'),
    // dateTo: null - wciąż trwający projekt (do dzisiaj)
  },
  {
    title: 'Fundacja Służba Niepodległej',
    href: 'https://sluzbaniepodleglej.pl',
    desc: 'Administrowanie i rozwój strony (WordPress, SEO)...',
    tags: ['WordPress', 'PHP', 'CSS', 'HTML', 'Google Search Console', 'SEO'],
    img: '/images/logo-sluzba-niepodleglej.png',
    isLogo: true,
    newTech: false,
    slug: 'fundacja-sluzba-niepodleglej',
    dateFrom: new Date('2023-09-01'),
    // dateTo: null - wciąż trwający projekt
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
    items.map((p, i) => {
      const doc: any = {
        ...p,
        _id: p.slug,
        order: i + 1,
        status: 'published',
        createdAt: now,
        updatedAt: now,
      };
      return doc;
    }),
  );

  await client.close();
})();
