import { Link, router } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const navigateToMusicGenerator = () => {
    router.push('/AIMusicGenerator' as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Collaborate</Text>
      
      {/* AI Music Generator Button */}
      <TouchableOpacity 
        style={styles.musicButton} 
        onPress={navigateToMusicGenerator}
      >
        <Ionicons name="musical-notes" size={24} color="white" />
        <Text style={styles.musicButtonText}>AI Music Generator</Text>
      </TouchableOpacity>
      
      {/* Existing link */}
      <Link href="/details" style={styles.link}>
        <Text style={styles.linkText}>View details</Text>
      </Link>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#1f2937',
  },
  musicButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 200,
  },
  musicButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  link: {
    padding: 12,
  },
  linkText: {
    color: '#6366f1',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});