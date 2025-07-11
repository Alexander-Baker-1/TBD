import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="(discover)" options={{ title: "Discover" }}/>
      <Tabs.Screen name="(collaborate)" options={{ title: "Collaborate" }}/>
      <Tabs.Screen name="(profile)" options={{ title: "Profile" }}/>
    </Tabs>
  );
}