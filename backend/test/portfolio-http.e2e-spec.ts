import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.bootstrap';
import { PortfolioService } from '../src/portfolio/portfolio.service';

describe('Portfolio HTTP (e2e)', () => {
  let app: INestApplication;
  const originalAdminToken = process.env.ADMIN_TOKEN;
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

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PortfolioService)
      .useValue(portfolioService)
      .compile();

    app = moduleRef.createNestApplication();
    configureApp(app, { enableSwagger: false });
    await app.init();
  });

  beforeEach(() => {
    portfolioService.listPublished.mockReset();
    portfolioService.createPortfolioItem.mockReset();
    portfolioService.updatePortfolioItem.mockReset();
    portfolioService.deletePortfolioItem.mockReset();

    portfolioService.listPublished.mockResolvedValue([
      {
        _id: 'item-1',
        title: 'Project One',
        slug: 'project-one',
        href: '/portfolio/project-one',
        desc: 'Testowy opis projektu portfolio.',
        tags: ['NestJS', 'MongoDB'],
        img: 'https://example.com/image.jpg',
        status: 'published',
      },
    ]);
    portfolioService.createPortfolioItem.mockResolvedValue({
      _id: 'item-2',
      title: 'Project Two',
      slug: 'project-two',
      href: '/portfolio/project-two',
      desc: 'Drugi testowy opis projektu portfolio.',
      tags: ['React'],
      img: 'https://example.com/image-2.jpg',
      status: 'draft',
    });
    portfolioService.updatePortfolioItem.mockResolvedValue({
      _id: 'item-2',
      title: 'Updated title',
      slug: 'project-two',
      href: '/portfolio/project-two',
      desc: 'Drugi testowy opis projektu portfolio.',
      tags: ['React'],
      img: 'https://example.com/image-2.jpg',
      status: 'draft',
    });
    portfolioService.deletePortfolioItem.mockResolvedValue(true);
  });

  afterAll(async () => {
    if (originalAdminToken === undefined) {
      delete process.env.ADMIN_TOKEN;
    } else {
      process.env.ADMIN_TOKEN = originalAdminToken;
    }

    await app.close();
  });

  it('GET /api/portfolio -> 200 with published items', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/portfolio')
      .expect(200);

    expect(response.body).toEqual({
      ok: true,
      items: expect.arrayContaining([
        expect.objectContaining({
          _id: 'item-1',
          slug: 'project-one',
        }),
      ]),
    });
    expect(portfolioService.listPublished).toHaveBeenCalled();
  });

  it('POST /api/portfolio -> 201 for authenticated create', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/portfolio')
      .set('Authorization', 'Bearer test-admin-token')
      .send({
        title: 'Project Two',
        slug: 'project-two',
        href: '/portfolio/project-two',
        desc: 'Drugi testowy opis projektu portfolio.',
        tags: ['React'],
        img: 'https://example.com/image-2.jpg',
        status: 'draft',
      })
      .expect(201);

    expect(response.body).toEqual({
      ok: true,
      item: expect.objectContaining({
        _id: 'item-2',
        slug: 'project-two',
      }),
    });
    expect(portfolioService.createPortfolioItem).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Project Two',
        tags: ['React'],
        img: 'https://example.com/image-2.jpg',
      }),
      undefined,
    );
  });

  it('PATCH /api/portfolio/:id -> 200 for authenticated partial update', async () => {
    const response = await request(app.getHttpServer())
      .patch('/api/portfolio/item-2')
      .set('Authorization', 'Bearer test-admin-token')
      .send({
        title: 'Updated title',
      })
      .expect(200);

    expect(response.body).toEqual({
      ok: true,
      item: expect.objectContaining({
        _id: 'item-2',
        title: 'Updated title',
      }),
    });
    expect(portfolioService.updatePortfolioItem).toHaveBeenCalledWith(
      'item-2',
      {
        title: 'Updated title',
      },
      undefined,
    );
  });

  it('DELETE /api/portfolio/:id -> 200 for authenticated delete', async () => {
    const response = await request(app.getHttpServer())
      .delete('/api/portfolio/item-2')
      .set('Authorization', 'Bearer test-admin-token')
      .expect(200);

    expect(response.body).toEqual({
      ok: true,
      deleted: true,
    });
    expect(portfolioService.deletePortfolioItem).toHaveBeenCalledWith('item-2');
  });
});
