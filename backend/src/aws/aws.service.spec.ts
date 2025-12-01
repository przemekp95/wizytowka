import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AwsService } from './aws.service';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Logger } from '@nestjs/common';

jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/lib-storage');
jest.mock('uuid', () => ({
  __esModule: true,
  default: { v4: jest.fn() },
  v4: jest.fn(),
}));
jest.mock('path', () => ({
  extname: jest.fn(() => '.jpg'),
}));

const pathMock = require('path');

describe('AwsService', () => {
  let service: AwsService;
  let configService: ConfigService;
  let mockS3Client: any;
  let mockUpload: any;
  let loggerSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AwsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                'aws.s3.bucketName': 'test-bucket',
                'aws.region': 'us-east-1',
                'aws.accessKeyId': 'test-key',
                'aws.secretAccessKey': 'test-secret',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AwsService>(AwsService);
    configService = module.get<ConfigService>(ConfigService);

    // Get mocked instances
    mockS3Client = S3Client as jest.MockedClass<typeof S3Client>;
    mockUpload = Upload as jest.MockedClass<typeof Upload>;

    // Spy on logger
    loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadImage', () => {
    const mockFile = {
      originalname: 'test-image.jpg',
      buffer: Buffer.from('test-file-content'),
      mimetype: 'image/jpeg',
    };

    const mockBucketName = 'test-bucket';

    beforeEach(() => {
      (configService.get as jest.Mock).mockImplementation((key: string) => {
        if (key === 'aws.s3.bucketName') return mockBucketName;
        if (key === 'aws.region') return 'us-east-1';
        if (key === 'aws.accessKeyId') return 'test-key';
        if (key === 'aws.secretAccessKey') return 'test-secret';
        return undefined;
      });
    });

    it('should successfully upload an image with default folder', async () => {
      // Mock the uuid function
      const { v4: uuidv4 } = require('uuid');
      (uuidv4 as jest.Mock).mockReturnValue('mocked-uuid');

      // Set up path mock
      (pathMock.extname as jest.Mock).mockReturnValue('.jpg');

      const mockUploadInstance = {
        done: jest.fn().mockResolvedValue({
          Location: 'https://test-bucket.s3.amazonaws.com/portfolio/mocked-uuid.jpg',
        }),
      };
      (mockUpload as any).mockImplementation(() => mockUploadInstance);
      (mockS3Client as any).mockImplementation(() => ({
        send: jest.fn(),
      }));

      const result = await service.uploadImage(mockFile);

      expect(result).toBe('https://test-bucket.s3.amazonaws.com/portfolio/mocked-uuid.jpg');
      expect(mockUpload).toHaveBeenCalledWith({
        client: expect.any(Object),
        params: {
          Bucket: mockBucketName,
          Key: 'portfolio/mocked-uuid.jpg',
          Body: mockFile.buffer,
          ContentType: mockFile.mimetype,
          ACL: 'public-read',
        },
      });
      expect(loggerSpy).toHaveBeenCalledWith('🔧 Initializing AWS S3 client...');
      expect(loggerSpy).toHaveBeenCalledWith('✅ AWS S3 client initialized');
      expect(loggerSpy).toHaveBeenCalledWith(
        'Starting upload: portfolio/mocked-uuid.jpg (17 bytes)',
      );
      expect(loggerSpy).toHaveBeenCalledWith('Image uploaded successfully: portfolio/mocked-uuid.jpg');
    });

    it('should successfully upload an image with custom folder', async () => {
      // Mock the uuid function
      const { v4: uuidv4 } = require('uuid');
      (uuidv4 as jest.Mock).mockReturnValue('mocked-uuid');

      // Set up path mock
      (pathMock.extname as jest.Mock).mockReturnValue('.jpg');

      const mockUploadInstance = {
        done: jest.fn().mockResolvedValue({
          Location: 'https://test-bucket.s3.amazonaws.com/custom/mocked-uuid.jpg',
        }),
      };
      (mockUpload as any).mockImplementation(() => mockUploadInstance);
      (mockS3Client as any).mockImplementation(() => ({
        send: jest.fn(),
      }));

      const result = await service.uploadImage(mockFile, 'custom');

      expect(result).toBe('https://test-bucket.s3.amazonaws.com/custom/mocked-uuid.jpg');
      expect(mockUpload).toHaveBeenCalledWith({
        client: expect.any(Object),
        params: {
          Bucket: mockBucketName,
          Key: 'custom/mocked-uuid.jpg',
          Body: mockFile.buffer,
          ContentType: mockFile.mimetype,
          ACL: 'public-read',
        },
      });
    });

    it('should handle files without extension', async () => {
      const fileWithoutExtension = {
        originalname: 'test-image',
        buffer: Buffer.from('test-file-content'),
        mimetype: 'image/jpeg',
      };

      const mockUploadInstance = {
        done: jest.fn().mockResolvedValue({
          Location: 'https://test-bucket.s3.amazonaws.com/portfolio/mocked-uuid',
        }),
      };
      (mockUpload as any).mockImplementation(() => mockUploadInstance);
      (mockS3Client as any).mockImplementation(() => ({
        send: jest.fn(),
      }));

      const result = await service.uploadImage(fileWithoutExtension);

      expect(result).toBe('https://test-bucket.s3.amazonaws.com/portfolio/mocked-uuid');
      expect(mockUpload).toHaveBeenCalledWith({
        client: expect.any(Object),
        params: {
          Bucket: mockBucketName,
          Key: 'portfolio/mocked-uuid',
          Body: fileWithoutExtension.buffer,
          ContentType: fileWithoutExtension.mimetype,
          ACL: 'public-read',
        },
      });
    });

    it('should throw error on upload failure', async () => {
      const uploadError = new Error('Upload failed');
      const mockUploadInstance = {
        done: jest.fn().mockRejectedValue(uploadError),
      };
      (mockUpload as any).mockImplementation(() => mockUploadInstance);
      (mockS3Client as any).mockImplementation(() => ({
        send: jest.fn(),
      }));

      await expect(service.uploadImage(mockFile)).rejects.toThrow('Upload failed');
      expect(loggerSpy).toHaveBeenCalledWith('🔧 Initializing AWS S3 client...');
      expect(loggerSpy).toHaveBeenCalledWith('✅ AWS S3 client initialized');
    });

    it('should handle timeout on upload', async () => {
      jest.setTimeout(35000); // Increase timeout for this test
      const mockUploadInstance = {
        done: jest.fn().mockImplementation(
          () => new Promise(resolve => setTimeout(resolve, 35000))
        ),
      };
      (mockUpload as any).mockImplementation(() => mockUploadInstance);
      (mockS3Client as any).mockImplementation(() => ({
        send: jest.fn(),
      }));

      await expect(service.uploadImage(mockFile)).rejects.toThrow('Upload timeout after 30s');
    }, 40000);

    it('should reuse S3 client instance', async () => {
      const mockUploadInstance = {
        done: jest.fn().mockResolvedValue({
          Location: 'https://test-bucket.s3.amazonaws.com/portfolio/mocked-uuid.jpg',
        }),
      };
      (mockUpload as any).mockImplementation(() => mockUploadInstance);
      const mockSend = jest.fn();
      (mockS3Client as any).mockImplementation(() => ({
        send: mockSend,
      }));

      // First upload
      await service.uploadImage(mockFile);
      // Second upload - should reuse client
      await service.uploadImage(mockFile);

      // Should only log client initialization once
      expect(loggerSpy).toHaveBeenCalledWith('🔧 Initializing AWS S3 client...');
      expect(loggerSpy).toHaveBeenCalledWith('✅ AWS S3 client initialized');
      expect(loggerSpy).toHaveBeenCalledTimes(6); // 2 initializations + 4 logs per upload
    });
  });

  describe('deleteImage', () => {
    const mockImageUrl = 'https://test-bucket.s3.amazonaws.com/portfolio/test-image.jpg';

    beforeEach(() => {
      (configService.get as jest.Mock).mockImplementation((key: string) => {
        if (key === 'aws.s3.bucketName') return 'test-bucket';
        if (key === 'aws.region') return 'us-east-1';
        if (key === 'aws.accessKeyId') return 'test-key';
        if (key === 'aws.secretAccessKey') return 'test-secret';
        return undefined;
      });
    });

    it('should successfully delete an image', async () => {
      const mockSend = jest.fn().mockResolvedValue({});
      (mockS3Client as any).mockImplementation(() => ({
        send: mockSend,
      }));

      await service.deleteImage(mockImageUrl);

      expect(mockSend).toHaveBeenCalledWith(
        expect.any(DeleteObjectCommand)
      );
      expect(loggerSpy).toHaveBeenCalledWith('✅ AWS S3 client initialized');
      expect(loggerSpy).toHaveBeenCalledWith('Image deleted successfully: portfolio/test-image.jpg');
    });

    it('should correctly parse key from URL', async () => {
      const mockSend = jest.fn().mockResolvedValue({});
      (mockS3Client as any).mockImplementation(() => ({
        send: mockSend,
      }));

      const complexUrl = 'https://test-bucket.s3.amazonaws.com/folder/subfolder/image.jpg';
      await service.deleteImage(complexUrl);

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            Bucket: 'test-bucket',
            Key: 'folder/subfolder/image.jpg',
          },
        })
      );
    });

    it('should throw error on delete failure', async () => {
      const deleteError = new Error('Delete failed');
      const mockSend = jest.fn().mockRejectedValue(deleteError);
      (mockS3Client as any).mockImplementation(() => ({
        send: mockSend,
      }));

      await expect(service.deleteImage(mockImageUrl)).rejects.toThrow('Delete failed');
    });
  });

  describe('Configuration', () => {
    it('should initialize S3 client with correct configuration', async () => {
      const mockUploadInstance = {
        done: jest.fn().mockResolvedValue({
          Location: 'https://test-bucket.s3.amazonaws.com/portfolio/mocked-uuid.jpg',
        }),
      };
      (mockUpload as any).mockImplementation(() => mockUploadInstance);
      (mockS3Client as any).mockImplementation(() => ({
        send: jest.fn(),
      }));

      (configService.get as jest.Mock).mockImplementation((key: string) => {
        if (key === 'aws.s3.bucketName') return 'test-bucket';
        if (key === 'aws.region') return 'us-west-2';
        if (key === 'aws.accessKeyId') return 'custom-key';
        if (key === 'aws.secretAccessKey') return 'custom-secret';
        return undefined;
      });

      await service.uploadImage({
        originalname: 'test.jpg',
        buffer: Buffer.from('test'),
        mimetype: 'image/jpeg',
      });

      expect(mockS3Client).toHaveBeenCalledWith({
        region: 'us-west-2',
        credentials: {
          accessKeyId: 'custom-key',
          secretAccessKey: 'custom-secret',
        },
      });
    });

    it('should handle missing bucket name configuration', () => {
      const testConfigService = {
        get: jest.fn((key: string) => {
          if (key !== 'aws.s3.bucketName') return 'test-value';
          return undefined;
        }),
      };

      expect(() => new AwsService(testConfigService as any)).toThrow('AWS S3 bucket name is not configured');
    });
  });
});
