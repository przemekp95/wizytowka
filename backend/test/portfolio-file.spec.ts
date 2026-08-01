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

  it('publishes exactly five complete evidence-backed case studies', () => {
    const items = portfolioData as PortfolioFileItem[];
    const publishedItems = items.filter((item) => item.status === 'published');

    expect(publishedItems.map((item) => item.slug)).toEqual([
      'orgon-platform',
      'pp-solutions-website',
      'kraina-karpat-storefront',
      'casn-modernization',
      'strona-wizytowka',
    ]);

    for (const item of publishedItems) {
      const caseStudy = item as PortfolioFileItem & {
        problem?: string;
        problem_en?: string;
        role?: string;
        role_en?: string;
        decisions?: string[];
        decisions_en?: string[];
        result?: string;
        result_en?: string;
      };

      expect(caseStudy.problem?.trim()).toBeTruthy();
      expect(caseStudy.problem_en?.trim()).toBeTruthy();
      expect(caseStudy.role?.trim()).toBeTruthy();
      expect(caseStudy.role_en?.trim()).toBeTruthy();
      expect(caseStudy.decisions?.length).toBeGreaterThanOrEqual(2);
      expect(caseStudy.decisions_en?.length).toBe(caseStudy.decisions?.length);
      expect(caseStudy.result?.trim()).toBeTruthy();
      expect(caseStudy.result_en?.trim()).toBeTruthy();
      expect(item.tags.length).toBeGreaterThan(0);
      expect(Boolean(item.href.trim()) || Boolean(item.repoUrl?.trim())).toBe(
        true,
      );
    }
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('keeps published portfolio links and the business-card stack factual', () => {
    const items = portfolioData as PortfolioFileItem[];
    const publishedItems = items.filter((item) => item.status === 'published');
    const businessCard = items.find((item) => item.slug === 'strona-wizytowka');
    const orgon = items.find((item) => item.slug === 'orgon-platform');
    const ppSolutions = items.find(
      (item) => item.slug === 'pp-solutions-website',
    );

    expect(
      publishedItems.every(
        (item) => Boolean(item.href?.trim()) || Boolean(item.repoUrl?.trim()),
      ),
    ).toBe(true);
    expect(ppSolutions?.repoUrl).toBeUndefined();
    expect(businessCard?.tags).toEqual(
      expect.arrayContaining(['Next.js 16', 'NestJS 11', 'Prisma', 'MongoDB']),
    );
    expect(businessCard?.tags).not.toEqual(
      expect.arrayContaining([
        'PostgreSQL',
        'MUI',
        'Microservices',
        'Kubernetes',
      ]),
    );
    expect(orgon?.status).toBe('published');
    expect(orgon?.tags).toEqual(
      expect.arrayContaining(['Symfony 7.4', 'Next.js 16', 'Go', 'PostgreSQL']),
    );
    expect(orgon?.tags).not.toEqual(
      expect.arrayContaining(['MySQL', 'Twig', 'Kubernetes', 'Microservices']),
    );
    expect(ppSolutions?.tags).toEqual(
      expect.arrayContaining([
        'Next.js',
        'Fastify',
        'OpenAPI',
        'PostgreSQL',
        'Redis',
      ]),
    );
    expect(ppSolutions?.tags).not.toEqual(
      expect.arrayContaining(['Vite', 'Express', 'GCP']),
    );
  });

  it('keeps every tracked portfolio item valid for production synchronization', () => {
    expect(() =>
      portfolioData.map((item, index) =>
        toPortfolioMongoDocument(item as PortfolioFileItem, index),
      ),
    ).not.toThrow();
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
      href: '  https://example.com/project  ',
      desc: '  Project description  ',
      desc_en: '  Project description EN  ',
      problem: '  A documented problem.  ',
      problem_en: '  A documented problem EN.  ',
      role: '  Full-stack implementation.  ',
      role_en: '  Full-stack implementation EN.  ',
      decisions: [' Decision one ', ' Decision two '],
      decisions_en: [' Decision one EN ', ' Decision two EN '],
      result: '  A verified result.  ',
      result_en: '  A verified result EN.  ',
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
      href: 'https://example.com/project',
      desc: 'Project description',
      desc_en: 'Project description EN',
      problem: 'A documented problem.',
      problem_en: 'A documented problem EN.',
      role: 'Full-stack implementation.',
      role_en: 'Full-stack implementation EN.',
      decisions: ['Decision one', 'Decision two'],
      decisions_en: ['Decision one EN', 'Decision two EN'],
      result: 'A verified result.',
      result_en: 'A verified result EN.',
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
