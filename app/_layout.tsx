import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import NavigationBar from 'expo-navigation-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { useRouter, usePathname } from 'expo-router';

function RootLayoutNav() {
  const { session, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    // Only redirect if we're not already on the right type of page
    if (session === null && !pathname.includes('login') && !pathname.includes('register')) {
      router.replace('/login');
    }
    // Don't force redirect when session exists - let the user stay where they are
  }, [session, pathname]);
  
  // Use a key to force re-render when auth state changes
  const navigationKey = session ? 'authenticated' : 'unauthenticated';
  
  return (
    <Stack key={navigationKey} screenOptions={{headerShown: false}}>
      {session ? (
        <Stack.Screen name="(pages)" />
      ) : (
        <Stack.Screen name="login" />
      )}
      <Stack.Screen name="register" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}