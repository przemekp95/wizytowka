import { Test } from '@nestjs/testing';
import {
  PORTFOLIO_IMAGE_STORAGE,
  type PortfolioImageStoragePort,
} from './application/ports/portfolio-image-storage.port';
import {
  PORTFOLIO_REPOSITORY,
  type PortfolioRepositoryPort,
} from './application/ports/portfolio-repository.port';
import { PortfolioService } from './portfolio.service';

describe('PortfolioService', () => {
  let service: PortfolioService;

  const repository: jest.Mocked<PortfolioRepositoryPort> = {
    listPublished: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    deleteById: jest.fn(),
    getDependencyStatus: jest.fn(),
  };

  const imageStorage: jest.Mocked<PortfolioImageStoragePort> = {
    uploadImage: jest.fn(),
    deleteImage: jest.fn(),
  };

  const caseStudyFields = {
    problem: 'Problem projektu.',
    problem_en: 'Project problem.',
    role: 'Implementacja full-stack.',
    role_en: 'Full-stack implementation.',
    decisions: ['Decyzja pierwsza.', 'Decyzja druga.'],
    decisions_en: ['Decision one.', 'Decision two.'],
    result: 'Zweryfikowany wynik.',
    result_en: 'Verified result.',
  };

  const mockPortfolioItem = {
    _id: 'item-1',
    title: 'Project One',
    title_en: 'Project One EN',
    slug: 'project-one',
    href: '/portfolio/project-one',
    desc: 'Testowy opis projektu portfolio.',
    desc_en: 'English description.',
    tags: ['NestJS', 'MongoDB'],
    img: 'https://example.com/image.jpg',
    isLogo: false,
    newTech: true,
    order: 1,
    status: 'published' as const,
    createdAt: new Date('2026-03-20T10:00:00.000Z'),
    updatedAt: new Date('2026-03-20T10:00:00.000Z'),
    repoUrl: 'https://github.com/user/project-one',
    ...caseStudyFields,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    repository.listPublished.mockResolvedValue([mockPortfolioItem]);
    repository.findById.mockResolvedValue(mockPortfolioItem);
    repository.create.mockImplementation(async (item) => item);
    repository.update.mockImplementation(async (item) => item);
    repository.deleteById.mockResolvedValue(true);
    repository.getDependencyStatus.mockResolvedValue({
      name: 'mongo',
      ready: true,
    });

    imageStorage.uploadImage.mockResolvedValue(
      'https://example.com/uploaded-image.jpg',
    );
    imageStorage.deleteImage.mockResolvedValue();

    const moduleRef = await Test.createTestingModule({
      providers: [
        PortfolioService,
        {
          provide: PORTFOLIO_REPOSITORY,
          useValue: repository,
        },
        {
          provide: PORTFOLIO_IMAGE_STORAGE,
          useValue: imageStorage,
        },
      ],
    }).compile();

    service = moduleRef.get(PortfolioService);
  });

  it('lists published items through the repository port', async () => {
    await expect(service.listPublished()).resolves.toEqual([mockPortfolioItem]);
    expect(repository.listPublished).toHaveBeenCalledTimes(1);
  });

  it('delegates dependency status to the repository port', async () => {
    await expect(service.getDependencyStatus()).resolves.toEqual({
      name: 'mongo',
      ready: true,
    });
    expect(repository.getDependencyStatus).toHaveBeenCalledTimes(1);
  });

  it('creates a portfolio item without uploading an image when img is provided', async () => {
    const result = await service.createPortfolioItem({
      title: '  Project Two  ',
      slug: '  project-two  ',
      href: ' /portfolio/project-two ',
      desc: '  Drugi testowy opis projektu portfolio.  ',
      tags: [' React ', ' TypeScript '],
      img: ' https://example.com/image-2.jpg ',
      status: 'draft',
    });

    expect(imageStorage.uploadImage).not.toHaveBeenCalled();
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Project Two',
        slug: 'project-two',
        href: '/portfolio/project-two',
        desc: 'Drugi testowy opis projektu portfolio.',
        tags: ['React', 'TypeScript'],
        img: 'https://example.com/image-2.jpg',
        status: 'draft',
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        slug: 'project-two',
      }),
    );
  });

  it('uploads an image before creating a portfolio item when a file is provided', async () => {
    const result = await service.createPortfolioItem(
      {
        title: 'Project with file',
        slug: 'project-with-file',
        href: '/portfolio/project-with-file',
        desc: 'Opis projektu z plikiem.',
        tags: ['NestJS'],
        img: '',
        status: 'published',
        ...caseStudyFields,
      },
      {
        originalname: 'portfolio.jpg',
        buffer: Buffer.from('file'),
        mimetype: 'image/jpeg',
      },
    );

    expect(imageStorage.uploadImage).toHaveBeenCalledWith(
      expect.objectContaining({
        originalname: 'portfolio.jpg',
      }),
    );
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        img: 'https://example.com/uploaded-image.jpg',
      }),
    );
    expect(result.img).toBe('https://example.com/uploaded-image.jpg');
  });

  it('rolls back an uploaded image when create persistence fails', async () => {
    repository.create.mockRejectedValue(new Error('Insert failed'));

    await expect(
      service.createPortfolioItem(
        {
          title: 'Project with file',
          slug: 'project-with-file',
          href: '/portfolio/project-with-file',
          desc: 'Opis projektu z plikiem.',
          tags: ['NestJS'],
          img: '',
          status: 'published',
          ...caseStudyFields,
        },
        {
          originalname: 'portfolio.jpg',
          buffer: Buffer.from('file'),
          mimetype: 'image/jpeg',
        },
      ),
    ).rejects.toThrow('Insert failed');

    expect(imageStorage.deleteImage).toHaveBeenCalledWith(
      'https://example.com/uploaded-image.jpg',
    );
  });

  it('updates an item and deletes the replaced image after success', async () => {
    repository.update.mockImplementation(async (item) => item);

    const result = await service.updatePortfolioItem(
      'item-1',
      { title: ' Updated title ' },
      {
        originalname: 'new-image.jpg',
        buffer: Buffer.from('image'),
        mimetype: 'image/jpeg',
      },
    );

    expect(repository.findById).toHaveBeenCalledWith('item-1');
    expect(imageStorage.uploadImage).toHaveBeenCalled();
    expect(repository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: 'item-1',
        title: 'Updated title',
        img: 'https://example.com/uploaded-image.jpg',
      }),
    );
    expect(imageStorage.deleteImage).toHaveBeenCalledWith(
      'https://example.com/image.jpg',
    );
    expect(result).toEqual(
      expect.objectContaining({
        _id: 'item-1',
        title: 'Updated title',
      }),
    );
  });

  it('rolls back a freshly uploaded image when update persistence fails', async () => {
    repository.update.mockRejectedValue(new Error('Update failed'));

    await expect(
      service.updatePortfolioItem(
        'item-1',
        { title: 'Updated title' },
        {
          originalname: 'new-image.jpg',
          buffer: Buffer.from('image'),
          mimetype: 'image/jpeg',
        },
      ),
    ).rejects.toThrow('Update failed');

    expect(imageStorage.deleteImage).toHaveBeenCalledWith(
      'https://example.com/uploaded-image.jpg',
    );
    expect(imageStorage.deleteImage).not.toHaveBeenCalledWith(
      mockPortfolioItem.img,
    );
  });

  it('returns null when updating a missing item', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      service.updatePortfolioItem('missing-id', { title: 'Updated title' }),
    ).resolves.toBeNull();
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('deletes the record before removing the image from storage', async () => {
    await expect(service.deletePortfolioItem('item-1')).resolves.toBe(true);

    expect(repository.deleteById).toHaveBeenCalledWith('item-1');
    expect(imageStorage.deleteImage).toHaveBeenCalledWith(
      'https://example.com/image.jpg',
    );
    expect(repository.deleteById.mock.invocationCallOrder[0]).toBeLessThan(
      imageStorage.deleteImage.mock.invocationCallOrder[0],
    );
  });

  it('returns false when deleting a missing item', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(service.deletePortfolioItem('missing-id')).resolves.toBe(
      false,
    );
    expect(repository.deleteById).not.toHaveBeenCalled();
    expect(imageStorage.deleteImage).not.toHaveBeenCalled();
  });
});
