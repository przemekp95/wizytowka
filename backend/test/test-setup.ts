process.env.SKIP_PRISMA = 'true';

// Mock problematic ES6 modules for Jest E2E tests
// @ts-ignore
jest.mock('uuid', () => ({
  // @ts-ignore
  v4: jest.fn(() => 'mocked-uuid-1234-5678-9abc-def012345678')
}));

// @ts-ignore
jest.mock('@aws-sdk/client-s3', () => ({
  // @ts-ignore
  S3Client: jest.fn().mockImplementation(() => ({
    // @ts-ignore
    send: jest.fn()
  })),
  // @ts-ignore
  DeleteObjectCommand: jest.fn()
}));

// @ts-ignore
jest.mock('@aws-sdk/lib-storage', () => ({
  // @ts-ignore
  Upload: jest.fn().mockImplementation(() => ({
    // @ts-ignore
    done: jest.fn().mockResolvedValue({ Location: 'mocked-s3-url' })
  }))
}));
