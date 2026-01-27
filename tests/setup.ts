import { jest } from '@jest/globals';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DATABASE_URL = 'sqlite::memory:';

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  // Keep log and warn for debugging
  // Uncomment to silence them:
  // log: jest.fn(),
  // warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Set longer timeout for integration tests
jest.setTimeout(10000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Clean up after all tests
afterAll(async () => {
  // Close database connections, etc.
});