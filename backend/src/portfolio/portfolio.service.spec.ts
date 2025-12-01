import { Test, TestingModule } from '@nestjs/testing';
import { PortfolioService } from './portfolio.service';
import { AwsService } from '../aws/aws.service';

describe('PortfolioService', () => {
  let service: PortfolioService;
  let awsService: jest.Mocked<AwsService>;

  const mockPortfolioItems = [
    {
      _id: '1',
      title: 'Test Project 1',
      title_en: 'Test Project 1 EN',
      slug: 'test-project-1',
      href: 'https://example.com/project1',
      desc: 'Opis projektu testowego',
      desc_en: 'A test project description',
      tags: ['React', 'TypeScript'],
      img: 'https://example.com/image1.jpg',
      isLogo: false,
      newTech: true,
      order: 1,
      status: 'published' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      repoUrl: 'https://github.com/user/project1',
    },
    {
      _id: '2',
      title: 'Test Project 2',
      title_en: 'Test Project 2 EN',
      slug: 'test-project-2',
      href: 'https://example.com/project2',
      desc: 'Drugi projekt testowy',
      desc_en: 'Another test project',
      tags: ['Node.js', 'MongoDB'],
      img: 'https://example.com/image2.jpg',
      isLogo: false,
      newTech: false,
      order: 2,
      status: 'published' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(async () => {
    const mockAwsService = {
      uploadImage: jest.fn(),
      deleteImage: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortfolioService,
        {
          provide: AwsService,
          useValue: mockAwsService,
        },
      ],
    }).compile();

    service = module.get<PortfolioService>(PortfolioService);
    awsService = module.get(AwsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listPublished', () => {
    it('should return published portfolio items', async () => {
      // For unit tests, we need to directly access the database
      // Since the service initializes the connection in onModuleInit
      // we'll create a partial mock that bypasses the connection
      const mockCollection = {
        find: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            toArray: jest.fn().mockResolvedValue(mockPortfolioItems),
          }),
        }),
      };

      const mockDb = {
        collection: jest.fn().mockReturnValue(mockCollection),
      };

      (service as any).db = mockDb;

      const result = await service.listPublished();

      expect(mockDb.collection).toHaveBeenCalledWith('portfolio_items');
      expect(mockCollection.find).toHaveBeenCalledWith({ status: 'published' });
      expect(result).toEqual(mockPortfolioItems);
    });

    it('should throw error when database is not connected', async () => {
      (service as any).db = null;

      await expect(service.listPublished()).rejects.toThrow('MongoDB not connected');
    });
  });

  describe('createPortfolioItem', () => {
    it('should create a portfolio item without image upload', async () => {
      const mockDb = {
        collection: jest.fn().mockReturnValue({
          insertOne: jest.fn().mockResolvedValue({ acknowledged: true }),
        }),
      };

      (service as any).db = mockDb;
      awsService.uploadImage.mockResolvedValue('uploaded-image-url');

      const itemData = {
        title: 'Test Portfolio Item',
        slug: 'test-portfolio-item',
        href: '/portfolio/test',
        desc: 'Test description',
        tags: ['React', 'TypeScript'],
        img: 'existing-image.jpg',
        status: 'draft' as const,
      };

      const result = await service.createPortfolioItem(itemData);

      expect(result.title).toBe('Test Portfolio Item');
      expect(result.slug).toBe('test-portfolio-item');
      expect(result.status).toBe('draft');
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it('should upload image when file is provided', async () => {
      const mockDb = {
        collection: jest.fn().mockReturnValue({
          insertOne: jest.fn().mockResolvedValue({ acknowledged: true }),
        }),
      };

      (service as any).db = mockDb;
      awsService.uploadImage.mockResolvedValue('uploaded-image-url');

      const mockFile = {
        originalname: 'test.jpg',
        buffer: Buffer.from('test'),
        mimetype: 'image/jpeg',
      };

      const itemData = {
        title: 'Test with Image',
        slug: 'test-with-image',
        href: '/portfolio/test-image',
        desc: 'Test description with image',
        tags: ['React'],
        img: 'placeholder.jpg',
        status: 'published' as const,
      };

      const result = await service.createPortfolioItem(itemData, mockFile as any);

      expect(awsService.uploadImage).toHaveBeenCalledWith(mockFile, 'portfolio');
      expect(result.img).toBe('uploaded-image-url');
    });
  });
});
