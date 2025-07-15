import { Stack, Slot, Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import NavigationBar from 'expo-navigation-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';

function RootLayoutNav() {
  // Check if user is authenticated (replace with real auth logic)
  const { session } = useAuth()
  
  return (
    <Stack screenOptions={{headerShown: false}}>
      {session ? (
        // Show protected pages when logged in
        <Stack.Screen name="(pages)" />
      ) : (
        // Show login page when not logged in
        <Stack.Screen name="login" />
      )}
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

// Main component that provides AuthProvider
export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}