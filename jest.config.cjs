// jest.config.cjs
// ESM-compatible Jest config for the monolith (plain .js files).
// The existing jest.config.ts targets src/**/*.ts (TypeScript).
// This config targets tests/unit and tests/integration (plain JS).

/** @type {import('jest').Config} */
module.exports = {
  displayName: 'bece-monolith',
  testEnvironment: 'node',
  transform: {},
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.js',
    '<rootDir>/tests/integration/**/*.test.js',
  ],
  testTimeout: 15000,
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  moduleNameMapper: {
    // Map relative imports from src/ to absolute paths so mocks resolve correctly
    '^(\\.\\.?/)+utils/logger\\.js$': '<rootDir>/utils/logger.js',
    '^(\\.\\.?/)+utils/sendEmail\\.js$': '<rootDir>/utils/sendEmail.js',
    '^(\\.\\.?/)+config/env\\.js$': '<rootDir>/config/env.js',
    '^(\\.\\.?/)+models/index\\.js$': '<rootDir>/models/index.js',
  },
  // Coverage only from the new layered auth code
  collectCoverageFrom: [
    'src/auth/**/*.js',
    'src/errors/**/*.js',
    '!src/**/*.test.js',
  ],
  coverageDirectory: 'coverage/unit',
  coverageReporters: ['text', 'lcov'],
};
