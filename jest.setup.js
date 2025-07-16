// Try to load dotenv, but don't fail if it's not available
try {
  require('dotenv').config();
} catch (error) {
  // Ignore - dotenv not available in CI
}

// Set timeout for integration tests
jest.setTimeout(60000);