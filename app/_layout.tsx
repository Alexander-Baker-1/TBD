import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import NavigationBar from 'expo-navigation-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { useRouter, usePathname } from 'expo-router';

function RootLayoutNav() {
  const { session, user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    // Don't do anything while auth is still loading
    if (loading) return;
    
    console.log('Navigation check:', { 
      user: !!user, 
      session: !!session, 
      pathname,
      loading 
    });
    
    // If user is logged in but on auth pages, redirect to main app
    if (user && (pathname === '/login' || pathname === '/register')) {
      console.log('User logged in, redirecting to main app');
      router.replace('/(pages)');
      return;
    }
    
    // If user is not logged in and not on auth pages, redirect to login
    if (!user && !pathname.includes('login') && !pathname.includes('register')) {
      console.log('User not logged in, redirecting to login');
      router.replace('/login');
      return;
    }
    
  }, [user, session, pathname, loading]);
  
  // Show loading while auth state is being determined
  if (loading) {
    return (
      <Stack screenOptions={{headerShown: false}}>
        <Stack.Screen name="loading" />
      </Stack>
    );
  }
  
  // Use user state instead of session for more reliable auth checking
  const isAuthenticated = !!user;
  const navigationKey = isAuthenticated ? 'authenticated' : 'unauthenticated';
  
  return (
    <Stack key={navigationKey} screenOptions={{headerShown: false}}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="(pages)" />
        </>
      ) : (
        <>
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
        </>
      )}
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