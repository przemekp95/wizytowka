import { Test, TestingModule } from '@nestjs/testing';
import { RequestIdMiddleware } from './request-id.middleware';
import type { Request, Response } from 'express';

describe('RequestIdMiddleware', () => {
  let middleware: RequestIdMiddleware;
  let mockRequest: Partial<Request & { requestId?: string }>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RequestIdMiddleware],
    }).compile();

    middleware = module.get<RequestIdMiddleware>(RequestIdMiddleware);

    mockRequest = {
      header: jest.fn(),
      requestId: undefined,
    };

    mockResponse = {
      setHeader: jest.fn(),
    };

    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  it('should use existing X-Request-Id header', () => {
    (mockRequest.header as jest.Mock).mockReturnValue('existing-request-id');

    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    expect((mockRequest as any).requestId).toBe('existing-request-id');
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'X-Request-Id',
      'existing-request-id',
    );
    expect(mockNext).toHaveBeenCalled();
  });

  it('should generate new request ID when no header exists', () => {
    (mockRequest.header as jest.Mock).mockReturnValue(undefined);

    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockRequest.requestId).toEqual(expect.any(String));
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'X-Request-Id',
      expect.any(String),
    );
    expect(mockNext).toHaveBeenCalled();
  });

  it('should generate new request ID when header is empty string', () => {
    (mockRequest.header as jest.Mock).mockReturnValue('');

    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockRequest.requestId).toEqual(expect.any(String));
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'X-Request-Id',
      expect.any(String),
    );
    expect(mockNext).toHaveBeenCalled();
  });

  it('should always call next function', () => {
    (mockRequest.header as jest.Mock).mockReturnValue('some-id');

    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should preserve request ID for use in application', () => {
    (mockRequest.header as jest.Mock).mockReturnValue('custom-id-456');

    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockRequest.requestId).toBe('custom-id-456');
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'X-Request-Id',
      'custom-id-456',
    );
  });
});
