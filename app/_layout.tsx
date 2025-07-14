import { Stack, Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import NavigationBar from 'expo-navigation-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';

export default function RootLayout() {
  // Check if user is authenticated (replace with real auth logic)
  const session = useAuth()
  
  return (
    // Wrap everything in AuthProvider to provide auth context
   <AuthProvider>
      <Stack screenOptions={{headerShown: false}}>
        {session ? (
          // Show protected pages when logged in
          <>
            <Stack.Screen name="(pages)" />
          </>
        ) : (
          // Show login page when not logged in
          <Stack.Screen name="login" />
        )}
        {/* 404 page - always available */}
        <Stack.Screen name="+not-found" />
      </Stack>
      </AuthProvider>
    );
}