module.exports = {
  testEnvironment: 'node',
  testTimeout: 60000,
  maxWorkers: 1,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/__tests__/**/*.spec.js'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/dist/',
    '/coverage/',
    'app/',
    'components/',
    'context/'
  ],
  collectCoverageFrom: [
    'lib/**/*.{js,jsx}',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/app/**',
    '!**/components/**',
    '!**/context/**',
    '!babel.config.js',
    '!jest.config.js',
    '!jest.setup.js'
  ],
  coverageDirectory: 'coverage',
  verbose: true,
  transformIgnorePatterns: [
    'node_modules/(?!appwrite)'
  ],
  moduleFileExtensions: ['js', 'json']
};