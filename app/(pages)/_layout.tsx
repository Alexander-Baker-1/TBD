import { Tabs, Redirect } from 'expo-router';
import { usePathname } from 'expo-router';

export default function TabLayout() {

  const pathname = usePathname();
  
  // If we're at the root of (pages), redirect to discover
  if (pathname === '/(pages)') {
    return <Redirect href="/(pages)/(discover)" />;
  }

  return (
    <Tabs>
      <Tabs.Screen name="index"  options={{ href: null}}/>
      <Tabs.Screen name="(discover)" options={{ title: "Discover", href: "/"}}/>
      <Tabs.Screen name="(collaborate)" options={{ title: "Collaborate" }}/>
      <Tabs.Screen name="(profile)" options={{ title: "Profile" }}/>
    </Tabs>
  );
}