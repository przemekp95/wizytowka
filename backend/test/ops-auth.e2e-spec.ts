import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.bootstrap';
import { PrismaService } from '../src/prisma/prisma.service';
import { PortfolioService } from '../src/portfolio/portfolio.service';

describe('Ops auth (e2e)', () => {
  let app: INestApplication;
  const prismaService = {
    contactMessage: {
      findMany: jest.fn(),
    },
  };
  const portfolioService = {
    listPublished: jest.fn(),
    createPortfolioItem: jest.fn(),
    updatePortfolioItem: jest.fn(),
    deletePortfolioItem: jest.fn(),
    getDependencyStatus: jest.fn().mockResolvedValue({
      name: 'mongo',
      ready: true,
    }),
  };

  beforeAll(async () => {
    process.env.ADMIN_TOKEN = 'test-admin-token';

    const mod = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaService)
      .overrideProvider(PortfolioService)
      .useValue(portfolioService)
      .compile();

    app = mod.createNestApplication();
    configureApp(app, { enableSwagger: false });
    await app.init();
  });

  beforeEach(() => {
    prismaService.contactMessage.findMany.mockReset();
    portfolioService.createPortfolioItem.mockReset();
    portfolioService.updatePortfolioItem.mockReset();
    portfolioService.deletePortfolioItem.mockReset();
    prismaService.contactMessage.findMany.mockResolvedValue([]);
    portfolioService.createPortfolioItem.mockResolvedValue({
      _id: 'item-1',
      title: 'Project',
      slug: 'project',
      href: '/portfolio/project',
      desc: 'Testowy opis projektu portfolio.',
      tags: ['NestJS'],
      img: 'https://example.com/image.jpg',
      status: 'draft',
    });
    portfolioService.updatePortfolioItem.mockResolvedValue({
      _id: 'item-1',
      title: 'Updated Project',
      slug: 'project',
      href: '/portfolio/project',
      desc: 'Testowy opis projektu portfolio.',
      tags: ['NestJS'],
      img: 'https://example.com/image.jpg',
      status: 'draft',
    });
    portfolioService.deletePortfolioItem.mockResolvedValue(true);
  });

  afterAll(async () => {
    delete process.env.ADMIN_TOKEN;
    await app.close();
  });

  it('rejects missing bearer token for admin contact messages', async () => {
    await request(app.getHttpServer()).get('/api/contact/messages').expect(401);
  });

  it('accepts valid bearer token for admin contact messages', async () => {
    await request(app.getHttpServer())
      .get('/api/contact/messages')
      .set('Authorization', 'Bearer test-admin-token')
      .expect(200);

    expect(prismaService.contactMessage.findMany).toHaveBeenCalled();
  });

  it('rejects missing bearer token for portfolio create', async () => {
    await request(app.getHttpServer())
      .post('/api/portfolio')
      .send({
        title: 'Project',
        slug: 'project',
        href: '/portfolio/project',
        desc: 'Testowy opis projektu portfolio.',
        tags: ['NestJS'],
        img: 'https://example.com/image.jpg',
      })
      .expect(401);
  });

  it('accepts valid bearer token for portfolio create', async () => {
    await request(app.getHttpServer())
      .post('/api/portfolio')
      .set('Authorization', 'Bearer test-admin-token')
      .send({
        title: 'Project',
        slug: 'project',
        href: '/portfolio/project',
        desc: 'Testowy opis projektu portfolio.',
        tags: ['NestJS'],
        img: 'https://example.com/image.jpg',
      })
      .expect(201);

    expect(portfolioService.createPortfolioItem).toHaveBeenCalled();
  });

  it('rejects missing bearer token for portfolio update', async () => {
    await request(app.getHttpServer())
      .patch('/api/portfolio/item-1')
      .send({ title: 'Updated Project' })
      .expect(401);
  });

  it('accepts valid bearer token for portfolio update', async () => {
    await request(app.getHttpServer())
      .patch('/api/portfolio/item-1')
      .set('Authorization', 'Bearer test-admin-token')
      .send({ title: 'Updated Project' })
      .expect(200);

    expect(portfolioService.updatePortfolioItem).toHaveBeenCalledWith(
      'item-1',
      { title: 'Updated Project' },
      undefined,
    );
  });

  it('rejects missing bearer token for portfolio delete', async () => {
    await request(app.getHttpServer())
      .delete('/api/portfolio/item-1')
      .expect(401);
  });

  it('accepts valid bearer token for portfolio delete', async () => {
    await request(app.getHttpServer())
      .delete('/api/portfolio/item-1')
      .set('Authorization', 'Bearer test-admin-token')
      .expect(200);

    expect(portfolioService.deletePortfolioItem).toHaveBeenCalledWith('item-1');
  });
});
