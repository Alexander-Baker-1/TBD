import { Link } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../context/AuthContext.js';

// Define the user type for TypeScript
interface AppwriteUser {
  $id: string;
  name?: string;
  email: string;
  emailVerification: boolean;
  status: boolean;
  prefs: Record<string, any>;
  registration: string;
  passwordUpdate: string;
  $createdAt: string;
  $updatedAt: string;
}

export default function HomeScreen() {
  const { logout, user } = useAuth();
  
  // Type assertion for the user object
  const typedUser = user as AppwriteUser | null;

  const mockTracks = [
    { id: 1, title: "Red", artist: typedUser?.name || typedUser?.email || "Artist Name", likes: "100k", listens: "215k" },
    { id: 2, title: "Red", artist: typedUser?.name || typedUser?.email || "Artist Name", likes: "100k", listens: "215k" },
  ];

  const socialPlatforms = [
    { name: "Apple Music", color: "#FF2D92", icon: "⭐" },
    { name: "YouTube Music", color: "#FF0000", icon: "♪" },
    { name: "Podcast", color: "#8B5CF6", icon: "🎙" },
    { name: "Bandcamp", color: "#FF6B35", icon: "🎵" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity style={styles.settingsIcon}>
            <Text style={styles.settingsText}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileContent}>
            <View style={styles.avatarContainer}>
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face' }}
                style={styles.avatar}
              />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.username}>{typedUser?.name || typedUser?.email || "User Name"}</Text>
              <TouchableOpacity style={styles.bioButton}>
                <Text style={styles.bioText}>Bio</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <TouchableOpacity style={styles.skillsButton}>
            <Text style={styles.skillsText}>Skills/Tags</Text>
          </TouchableOpacity>
        </View>

        {/* Top Tracks */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Tracks</Text>
          {mockTracks.map((track) => (
            <View key={track.id} style={styles.trackItem}>
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=60&h=60&fit=crop' }}
                style={styles.trackImage}
              />
              <View style={styles.trackInfo}>
                <Text style={styles.trackTitle}>{track.title}</Text>
                <Text style={styles.trackArtist}>{track.artist}</Text>
              </View>
              <View style={styles.trackStats}>
                <Text style={styles.trackStat}>👍 {track.likes}</Text>
                <Text style={styles.trackStat}>🎧 {track.listens}</Text>
              </View>
              <TouchableOpacity style={styles.playButton}>
                <Text style={styles.playButtonText}>▶️ Play</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Collaborations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Collaborations</Text>
          <View style={styles.collaborationGrid}>
            {[1, 2, 3, 4].map((item) => (
              <Image 
                key={item}
                source={{ uri: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=80&h=80&fit=crop' }}
                style={styles.collaborationImage}
              />
            ))}
          </View>
        </View>

        {/* Social Profiles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Social Profiles</Text>
          <View style={styles.socialGrid}>
            {socialPlatforms.map((platform, index) => (
              <TouchableOpacity key={index} style={[styles.socialButton, { backgroundColor: platform.color }]}>
                <Text style={styles.socialIcon}>{platform.icon}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Temporary logout button */}
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={logout}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
  },
  settingsIcon: {
    padding: 8,
  },
  settingsText: {
    fontSize: 24,
  },
  profileSection: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarContainer: {
    marginRight: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileInfo: {
    flex: 1,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  bioButton: {
    backgroundColor: '#e9ecef',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  bioText: {
    fontSize: 16,
    fontWeight: '500',
  },
  skillsButton: {
    backgroundColor: '#e9ecef',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  skillsText: {
    fontSize: 18,
    fontWeight: '600',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#000',
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e9ecef',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  trackImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  trackArtist: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  trackStats: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  trackStat: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  playButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  collaborationGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  collaborationImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
  },
  socialGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  socialButton: {
    width: 70,
    height: 70,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialIcon: {
    fontSize: 28,
  },
  logoutButton: {
    backgroundColor: '#000',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    margin: 20,
    marginTop: 30,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});