import { Link } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../context/AuthContext.js';

export default function HomeScreen() {
  const { logout, user } = useAuth();
  return (
    // Temporary log out button, should be put in settings page
    <SafeAreaView style={{ flex: 1 }}>
      <TouchableOpacity 
            style={styles.button} 
            onPress={logout}
            >
            <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      <Text>Profile</Text>
      <Link href="/details">View details</Link>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal:20,
  },
  headline:{
    paddingVertical:20
  },
  button: {
      backgroundColor: 'black',
      padding: 12,
      borderRadius: 6,
      alignItems: 'center',
      margin:20,
    },
    buttonText: {
      color: 'white',
      fontSize: 18,
    },
});