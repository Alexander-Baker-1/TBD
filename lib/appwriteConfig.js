import { Client, Account } from "react-native-appwrite";
import { Platform } from "react-native";

const client = new Client()
    .setEndpoint(processColor.env.EXPO_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(processColor.end.EXPO_PROJECT_ID)

switch (Platform.OS) {
    // Will add iOS support later
    case 'ios':
        // client.setPlatform(process.env.EXPO_PUBLIC_APPWRITE_BUNDLE_ID);
        break;
    case 'android':
        client.setPlatform(process.env.EXPO_PUBLIC_APPWRITE_PACKAGE_ID);
        break;
}

const account = new Account(client);

export { account }