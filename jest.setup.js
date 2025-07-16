const dotenv = require('dotenv');

// Load environment variables from .env file
const result = dotenv.config();

if (result.error) {
  console.error('Error loading .env file:', result.error);
} else {
  console.log('Environment variables loaded successfully');
}

console.log('Environment Variables Loaded:');
console.log('EXPO_PUBLIC_APPWRITE_ENDPOINT:', process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT);
console.log('EXPO_PUBLIC_APPWRITE_PROJECT_ID:', process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID);
console.log('APPWRITE_TEST_ENDPOINT:', process.env.APPWRITE_TEST_ENDPOINT);
console.log('APPWRITE_TEST_PROJECT_ID:', process.env.APPWRITE_TEST_PROJECT_ID);

// Configure Jest for async operations
jest.setTimeout(60000);