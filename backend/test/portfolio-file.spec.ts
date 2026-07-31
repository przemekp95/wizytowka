import {
  getMongoConnectionConfig,
  toPortfolioFileItem,
  toPortfolioMongoDocument,
  type PortfolioFileItem,
  type PortfolioMongoDocument,
} from '../scripts/portfolio-file';
import portfolioData from '../scripts/portfolio.data.json';

describe('portfolio file sync helpers', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('keeps published portfolio links and the business-card stack factual', () => {
    const items = portfolioData as PortfolioFileItem[];
    const businessCard = items.find((item) => item.slug === 'strona-wizytowka');
    const ppSolutions = items.find((item) => item.slug === 'pp-solutions-website');

    expect(items.filter((item) => item.status === 'published')).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ href: '' })]),
    );
    expect(ppSolutions?.repoUrl).toBeUndefined();
    expect(businessCard?.tags).toEqual(
      expect.arrayContaining(['NextJS', 'NestJS', 'Prisma', 'MongoDB']),
    );
    expect(businessCard?.tags).not.toEqual(
      expect.arrayContaining(['PostgreSQL', 'MUI', 'Microservices']),
    );
  });

  it('normalizes a file item into a Mongo document while preserving existing identity', () => {
    const now = new Date('2026-03-23T10:00:00.000Z');
    const createdAt = new Date('2026-03-01T09:00:00.000Z');
    const existing: PortfolioMongoDocument = {
      _id: 'existing-id',
      title: 'Existing',
      slug: 'project-slug',
      href: 'https://example.com',
      desc: 'Existing description',
      tags: ['Node.js'],
      img: 'https://example.com/image.png',
      order: 7,
      status: 'draft',
      createdAt,
      updatedAt: createdAt,
      dateTo: null,
    };

    const fileItem: PortfolioFileItem = {
      title: '  Project title  ',
      title_en: '  Project title EN  ',
      slug: '  project-slug  ',
      href: '  ',
      desc: '  Project description  ',
      desc_en: '  Project description EN  ',
      tags: [' TypeScript ', ' NestJS '],
      img: '  https://example.com/next.png  ',
      isLogo: true,
      newTech: false,
      category: ' web-app, ai ',
      repoUrl: '  ',
      dateFrom: '2025-02-03',
      dateTo: null,
      order: 5,
      status: 'published',
    };

    expect(toPortfolioMongoDocument(fileItem, 0, existing, now)).toEqual({
      _id: 'existing-id',
      title: 'Project title',
      title_en: 'Project title EN',
      slug: 'project-slug',
      href: '',
      desc: 'Project description',
      desc_en: 'Project description EN',
      tags: ['TypeScript', 'NestJS'],
      img: 'https://example.com/next.png',
      isLogo: true,
      newTech: false,
      category: 'web-app, ai',
      dateFrom: new Date('2025-02-03T00:00:00.000Z'),
      dateTo: null,
      order: 5,
      status: 'published',
      createdAt,
      updatedAt: now,
    });
  });

  it('serializes a Mongo document into the tracked file format', () => {
    const document: PortfolioMongoDocument = {
      _id: 'project-slug',
      title: 'Project title',
      title_en: 'Project title EN',
      slug: 'project-slug',
      href: 'https://example.com',
      desc: 'Project description',
      desc_en: 'Project description EN',
      tags: ['TypeScript', 'NestJS'],
      img: 'https://example.com/image.png',
      isLogo: true,
      newTech: true,
      category: 'web-app',
      repoUrl: 'https://github.com/example/project',
      dateFrom: new Date('2025-02-03T00:00:00.000Z'),
      dateTo: null,
      order: 2,
      status: 'draft',
      createdAt: new Date('2025-02-01T00:00:00.000Z'),
      updatedAt: new Date('2025-02-10T00:00:00.000Z'),
    };

    expect(toPortfolioFileItem(document)).toEqual({
      title: 'Project title',
      title_en: 'Project title EN',
      slug: 'project-slug',
      href: 'https://example.com',
      desc: 'Project description',
      desc_en: 'Project description EN',
      tags: ['TypeScript', 'NestJS'],
      img: 'https://example.com/image.png',
      isLogo: true,
      newTech: true,
      category: 'web-app',
      repoUrl: 'https://github.com/example/project',
      dateFrom: '2025-02-03',
      dateTo: null,
      order: 2,
      status: 'draft',
    });
  });

  it('accepts Mongo URI aliases and falls back to the database name from the URI', () => {
    delete process.env.MONGODB_URI;
    process.env.MONGODB_URL =
      'mongodb+srv://user:secret@cluster.example.net/atlas-db?retryWrites=true&w=majority';
    delete process.env.MONGO_URL;
    delete process.env.MONGODB_DB;

    expect(getMongoConnectionConfig()).toEqual({
      uri: 'mongodb+srv://user:secret@cluster.example.net/atlas-db?retryWrites=true&w=majority',
      dbName: 'atlas-db',
    });
  });

  it('prefers an explicit database name over the URI path', () => {
    delete process.env.MONGODB_URI;
    delete process.env.MONGODB_URL;
    process.env.MONGO_URL =
      'mongodb+srv://user:secret@cluster.example.net/atlas-db?retryWrites=true&w=majority';
    process.env.MONGODB_DB = 'override-db';

    expect(getMongoConnectionConfig()).toEqual({
      uri: 'mongodb+srv://user:secret@cluster.example.net/atlas-db?retryWrites=true&w=majority',
      dbName: 'override-db',
    });
  });
});
