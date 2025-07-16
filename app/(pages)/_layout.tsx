import { Tabs } from 'expo-router';
import { usePathname } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs initialRouteName="(discover)">
      <Tabs.Screen name="(discover)" options={{ title: "Discover" }}/>
      <Tabs.Screen name="(collaborate)" options={{ title: "Collaborate" }}/>
      <Tabs.Screen name="(profile)" options={{ title: "Profile" }}/>
    </Tabs>
  );
}