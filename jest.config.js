module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'node',
  setupFiles: ['./jest.setup.js'],
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|expo-constants|expo-modules-core|react-navigation|@react-navigation|native-base|@unimodules|unimodules|sentry-expo|react-native-svg)/)',
  ],
};
