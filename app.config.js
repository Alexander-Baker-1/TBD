if (process.env.CI) {
  console.log("CI detected. Skipping dotenv config.");
} else {
  require('dotenv').config();
}
export default {
  expo: {
    name: process.env.EXPO_PUBLIC_APP_NAME,
    slug: process.env.EXPO_PUBLIC_APP_SLUG,
    scheme: process.env.EXPO_PUBLIC_APP_SCHEME,
    version: process.env.EXPO_PUBLIC_APP_VERSION,
    orientation: "portrait",
    userInterfaceStyle: "automatic",
    icon: "./assets/images/icon.png",
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
      dark: {
        image: "./assets/images/splash-icon-dark.png",
        backgroundColor: "#000000"
      },
      imageWidth: 200
    },
    assetBundlePatterns: ["**/*"],
    newArchEnabled: true,
    experiments: {
      typedRoutes: true
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          backgroundColor: "#232323",
          image: "./assets/images/splash-icon.png",
          dark: {
            image: "./assets/images/splash-icon-dark.png",
            backgroundColor: "#000000"
          },
          imageWidth: 200
        }
      ]
    ],
    ios: {
      supportsTablet: true,
      runtimeVersion: {
        policy: "appVersion"
      }
    },
    android: {
      package: process.env.EXPO_PUBLIC_APPWRITE_PACKAGE_NAME,
      runtimeVersion: "1.0.0",
      edgeToEdgeEnabled: true,
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      }
    },
    web: {
      favicon: "./assets/images/favicon.png",
      bundler: "metro",
      output: "static"
    },
    updates: {
      url: `https://u.expo.dev/${process.env.EXPO_PUBLIC_EAS_PROJECT_ID}`
    },
    extra: {
      eas: {
        projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID
      },
      EXPO_PUBLIC_APPWRITE_ENDPOINT: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
      EXPO_PUBLIC_APPWRITE_PROJECT_ID: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
      EXPO_PUBLIC_APPWRITE_PACKAGE_NAME: process.env.EXPO_PUBLIC_APPWRITE_PACKAGE_NAME
    },
    owner: process.env.EXPO_PUBLIC_EXPO_OWNER
  }
};
