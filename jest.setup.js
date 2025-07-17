// Prevent "Cannot redefine property: window"
if (typeof window === 'undefined') {
  global.window = global;
}

// Polyfill fetch if missing
if (typeof fetch === 'undefined') {
  require('whatwg-fetch');
}

// Gracefully load dotenv in local envs (skip in CI)
try {
  require('dotenv').config();
} catch {
  // Ignore if dotenv is unavailable (like in CI)
}

// Mock app.config.js to prevent Expo config validation failures
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
          backgroundColor: '#ffffff',
        },
      },
      ios: {
        supportsTablet: true,
        runtimeVersion: {
          policy: 'appVersion',
        },
      },
      web: {
        favicon: './assets/images/favicon.png',
        bundler: 'metro',
        output: 'static',
      },
      extra: {
        eas: {
          projectId: 'test-project-id',
        },
      },
      owner: 'test-owner',
    },
  },
}));

// Mock Expo modules that crash in test environments
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    manifest: {},
    appOwnership: 'standalone',
    expoConfig: {
      name: 'Test App',
      slug: 'test-app',
    },
  },
}));

// Increase timeout for long integration tests
jest.setTimeout(60000);
