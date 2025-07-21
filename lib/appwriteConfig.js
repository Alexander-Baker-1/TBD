import { Client, Account } from "react-native-appwrite";
import { Platform } from "react-native";
import Constants from 'expo-constants';

const client = new Client()
    .setEndpoint(Constants.expoConfig.extra.EXPO_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(Constants.expoConfig.extra.EXPO_PUBLIC_APPWRITE_PROJECT_ID)

switch (Platform.OS) {
    case 'ios':
        break;
    case 'android':
        client.setPlatform(Constants.expoConfig.extra.EXPO_PUBLIC_APPWRITE_PACKAGE_NAME);
        break;
}

const account = new Account(client);

export { account }