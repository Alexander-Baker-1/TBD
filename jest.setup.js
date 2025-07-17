// Try to load dotenv, but don't fail if it's not available
try {
  require('dotenv').config();
} catch (error) {
  // Ignore - dotenv not available in CI
}

// Mock app config to prevent config validation errors in CI
jest.mock('./app.config.js', () => ({
  __esModule: true,
  default: {
    expo: {
      name: 'Test App',
      slug: 'test-app',
      scheme: 'test-app',
      version: '1.0.0',
      orientation: 'portrait',
      userInterfaceStyle: 'automatic',
      icon: './assets/images/icon.png',
      android: {
        package: 'com.test.app',
        runtimeVersion: '1.0.0',
        adaptiveIcon: {
          foregroundImage: './assets/images/adaptive-icon.png',
          backgroundColor: '#ffffff'
        }
      },
      ios: {
        supportsTablet: true,
        runtimeVersion: {
          policy: 'appVersion'
        }
      },
      web: {
        favicon: './assets/images/favicon.png',
        bundler: 'metro',
        output: 'static'
      },
      extra: {
        eas: {
          projectId: 'test-project-id'
        }
      },
      owner: 'test-owner'
    }
  }
}));

// Mock expo modules that might cause issues in tests
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    manifest: {},
    appOwnership: 'standalone',
    expoConfig: {
      name: 'Test App',
      slug: 'test-app'
    }
  }
}));

// Set timeout for integration tests
jest.setTimeout(60000);