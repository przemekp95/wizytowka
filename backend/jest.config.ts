import { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  moduleFileExtensions: ['js', 'json', 'ts'],
  testMatch: ['**/*.spec.ts', '**/*.test.ts'],

  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
        useESM: false,
        transpilation: true,
      },
    ],
  },

  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    '!src/**/*.d.ts',
    '!src/main.ts',
    '!src/**/*.module.ts',
  ],
  coverageDirectory: '../coverage',
  coverageReporters: ['text', 'lcov', 'html'],

  setupFilesAfterEnv: ['<rootDir>/test/test-setup.ts'],

  moduleNameMapper: {
    '^uuid$': '<rootDir>/test/__mocks__/uuid.ts',
    '^@aws-sdk/client-s3$': '<rootDir>/test/__mocks__/aws-sdk-client-s3.ts',
    '^@aws-sdk/lib-storage$': '<rootDir>/test/__mocks__/aws-sdk-lib-storage.ts',
  },

  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  transformIgnorePatterns: [
    'node_modules/(?!(uuid|@aws-sdk|nodemailer|@nestjs)/)',
  ],

  maxWorkers: 1,
  forceExit: true,
  detectOpenHandles: true,
  testTimeout: 10000,

  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },

  extensionsToTreatAsEsm: ['.ts'],
};

export default config;
