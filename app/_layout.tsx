import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import NavigationBar from 'expo-navigation-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';

export default function RootLayout() {
  return (
    <Stack screenOptions={{headerShown: false}}>
      <Stack.Screen name="(pages)" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}