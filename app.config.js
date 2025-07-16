import 'dotenv/config';

export default {
  expo: {
    name: "TBD",
    slug: "TBD",
    scheme: "tbd",
    version: "1.0.0",
    plugins: [
      "expo-router",
    ],
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      runtimeVersion: {
        policy: "appVersion"
      }
    },
    android: {
      package: process.env.EXPO_PUBLIC_APPWRITE_PACKAGE_NAME,
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      runtimeVersion: "1.0.0"
    },
    web: {
      favicon: "./assets/images/favicon.png"
    },
    updates: {
      url: `https://u.expo.dev/${process.env.EXPO_PUBLIC_EAS_PROJECT_ID}`
    },
    extra: {
      EXPO_PUBLIC_APPWRITE_ENDPOINT: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
      EXPO_PUBLIC_APPWRITE_PROJECT_ID: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
      EXPO_PUBLIC_APPWRITE_PACKAGE_NAME: process.env.EXPO_PUBLIC_APPWRITE_PACKAGE_NAME,
      eas: {
        projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID
      }
    }
  }
};
