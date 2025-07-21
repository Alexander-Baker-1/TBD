import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'expo-router';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  TextInput, 
  Alert,
  ActivityIndicator,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { useAuth } from '../../../context/AuthContext.js';
import { fileStorageService } from '../../services/FileStorageService';

// Define interfaces for TypeScript
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

interface Song {
  id: string;
  title: string;
  artist?: string;
  duration?: number;
  audioUrl?: string;
  tags?: string[];
  createdAt: string;
  prompt?: string;
  style?: string;
  model?: string;
  taskId?: string;
}

export default function HomeScreen() {
  const { logout, user } = useAuth();
  const typedUser = user as AppwriteUser | null;
  
  // State management with proper typing
  const [savedSongs, setSavedSongs] = useState<Song[]>([]);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [editingBio, setEditingBio] = useState(false);
  const [editingSkills, setEditingSkills] = useState(false);
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [showAllTopTracks, setShowAllTopTracks] = useState(false);
  const [showAllCollabs, setShowAllCollabs] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const soundRef = useRef<Audio.Sound | null>(null);

  // Profile data with placeholder stats
  const profileData = {
    name: typedUser?.name || typedUser?.email || "User Name",
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=300&fit=crop',
    followers: 1247,
    following: 832,
    joinDate: "March 2023",
    location: "San Francisco, CA",
    totalPlays: 25431,
    totalLikes: 3247
  };

  const socialPlatforms = [
    { name: "Apple Music", color: "#FF2D92", icon: "musical-notes" as const },
    { name: "YouTube Music", color: "#FF0000", icon: "logo-youtube" as const },
    { name: "Podcast", color: "#8B5CF6", icon: "mic" as const },
    { name: "Bandcamp", color: "#FF6B35", icon: "disc" as const },
  ];

  useEffect(() => {
    loadSavedSongs();
    loadProfile();
    
    // Initialize audio session
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const loadSavedSongs = async () => {
    try {
      setIsLoading(true);
      const songs = await fileStorageService.getAllSongs();
      setSavedSongs(songs);
    } catch (error) {
      console.error('Error loading saved songs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProfile = async () => {
    try {
      const profile = await fileStorageService.getProfile();
      setBio(profile.bio || "");
      setSkills(profile.skills || []);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const handlePlay = async (song: Song) => {
    try {
      if (isPlaying === song.id) {
        // Stop current song
        if (soundRef.current) {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }
        setIsPlaying(null);
      } else {
        // Stop any existing sound
        if (soundRef.current) {
          await soundRef.current.unloadAsync();
        }

        // Play new song
        if (song.audioUrl) {
          const { sound } = await Audio.Sound.createAsync(
            { uri: song.audioUrl },
            { shouldPlay: true, isLooping: false }
          );

          soundRef.current = sound;
          setIsPlaying(song.id);

          sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
            if (status.isLoaded && status.didJustFinish) {
              setIsPlaying(null);
            }
          });
        }
      }
    } catch (error) {
      console.error('Playback error:', error);
      Alert.alert('Playback Error', 'Could not play this track');
    }
  };

  const handleSaveBio = async () => {
    try {
      await fileStorageService.updateBio(bio);
      setEditingBio(false);
    } catch (error) {
      console.error('Error saving bio:', error);
      Alert.alert('Error', 'Could not save bio');
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const handleSaveSkills = async () => {
    try {
      await fileStorageService.updateSkills(skills);
      setEditingSkills(false);
    } catch (error) {
      console.error('Error saving skills:', error);
      Alert.alert('Error', 'Could not save skills');
    }
  };

  // Separate songs into top tracks (solo) and collaborations
  const topTracks = savedSongs.filter(song => !song.artist || !song.artist.includes(' x '));
  const collaborations = savedSongs.filter(song => song.artist && song.artist.includes(' x '));

  const displayedTopTracks = showAllTopTracks ? topTracks : topTracks.slice(0, 3);
  const displayedCollabs = showAllCollabs ? collaborations : collaborations.slice(0, 4);

  interface SongItemProps {
    song: Song;
    showArtist?: boolean;
  }

  const SongItem: React.FC<SongItemProps> = ({ song, showArtist = false }) => (
    <View style={styles.trackItem}>
      <Image 
        source={{ uri: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=60&h=60&fit=crop' }}
        style={styles.trackImage}
      />
      <View style={styles.trackInfo}>
        <Text style={styles.trackTitle} numberOfLines={1}>{song.title || 'Untitled Track'}</Text>
        {showArtist && song.artist && (
          <Text style={styles.trackArtist} numberOfLines={1}>{song.artist}</Text>
        )}
        <View style={styles.trackStatsRow}>
          <Text style={styles.trackStat}>👍 {Math.floor(Math.random() * 100) + 50}k</Text>
          <Text style={styles.trackStat}>🎧 {Math.floor(Math.random() * 200) + 100}k</Text>
          {song.duration && <Text style={styles.trackStat}>{formatDuration(song.duration)}</Text>}
        </View>
      </View>
      <TouchableOpacity 
        style={[styles.playButton, isPlaying === song.id && styles.playButtonActive]}
        onPress={() => handlePlay(song)}
      >
        <Ionicons 
          name={isPlaying === song.id ? "pause" : "play"} 
          size={16} 
          color="white" 
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity style={styles.settingsIcon}>
            <Ionicons name="settings-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Cover Image */}
        <View style={styles.coverImageContainer}>
          <Image 
            source={{ uri: profileData.coverImage }}
            style={styles.coverImage}
          />
          <View style={styles.coverOverlay} />
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileContent}>
            <View style={styles.avatarContainer}>
              <Image 
                source={{ uri: profileData.avatar }}
                style={styles.avatar}
              />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.username}>{profileData.name}</Text>
              <View style={styles.profileStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{formatNumber(profileData.followers)}</Text>
                  <Text style={styles.statLabel}>Followers</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{formatNumber(profileData.following)}</Text>
                  <Text style={styles.statLabel}>Following</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{formatNumber(profileData.totalPlays)}</Text>
                  <Text style={styles.statLabel}>Plays</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{formatNumber(profileData.totalLikes)}</Text>
                  <Text style={styles.statLabel}>Likes</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Bio Section */}
          <View style={styles.bioSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderTitle}>About</Text>
              <TouchableOpacity onPress={() => setEditingBio(!editingBio)}>
                <Ionicons name="pencil" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            
            {editingBio ? (
              <View style={styles.editContainer}>
                <TextInput
                  style={styles.bioInput}
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Tell people about yourself..."
                  multiline
                  numberOfLines={3}
                />
                <View style={styles.editButtons}>
                  <TouchableOpacity style={styles.saveButton} onPress={handleSaveBio}>
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setEditingBio(false)}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <Text style={styles.bioText}>{bio || "No bio available"}</Text>
            )}
          </View>

          {/* Skills Section */}
          <View style={styles.skillsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderTitle}>Skills & Genres</Text>
              <TouchableOpacity onPress={() => setEditingSkills(!editingSkills)}>
                <Ionicons name="pencil" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            
            {editingSkills ? (
              <View style={styles.editContainer}>
                <View style={styles.skillsContainer}>
                  {skills.map(skill => (
                    <View key={skill} style={styles.skillTag}>
                      <Text style={styles.skillText}>{skill}</Text>
                      <TouchableOpacity onPress={() => handleRemoveSkill(skill)}>
                        <Ionicons name="close" size={16} color="#8B5CF6" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
                
                <View style={styles.addSkillContainer}>
                  <TextInput
                    style={styles.skillInput}
                    value={newSkill}
                    onChangeText={setNewSkill}
                    placeholder="Add a skill..."
                    onSubmitEditing={handleAddSkill}
                  />
                  <TouchableOpacity style={styles.addSkillButton} onPress={handleAddSkill}>
                    <Ionicons name="add" size={20} color="white" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.editButtons}>
                  <TouchableOpacity style={styles.saveButton} onPress={handleSaveSkills}>
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setEditingSkills(false)}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.skillsContainer}>
                {skills.map(skill => (
                  <View key={skill} style={styles.skillTagReadOnly}>
                    <Text style={styles.skillText}>{skill}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Top Tracks */}
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>Top Tracks</Text>
            {topTracks.length > 3 && (
              <TouchableOpacity onPress={() => setShowAllTopTracks(!showAllTopTracks)}>
                <Text style={styles.showMoreText}>
                  {showAllTopTracks ? 'Show Less' : `Show All (${topTracks.length})`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          {isLoading ? (
            <ActivityIndicator size="large" color="#8B5CF6" style={styles.loadingIndicator} />
          ) : displayedTopTracks.length > 0 ? (
            displayedTopTracks.map((song) => (
              <SongItem key={song.id} song={song} showArtist={false} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="musical-notes" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No tracks yet. Start creating music!</Text>
            </View>
          )}
        </View>

        {/* Collaborations */}
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>Collaborations</Text>
            {collaborations.length > 4 && (
              <TouchableOpacity onPress={() => setShowAllCollabs(!showAllCollabs)}>
                <Text style={styles.showMoreText}>
                  {showAllCollabs ? 'Show Less' : `Show All (${collaborations.length})`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          {isLoading ? (
            <ActivityIndicator size="large" color="#8B5CF6" style={styles.loadingIndicator} />
          ) : displayedCollabs.length > 0 ? (
            displayedCollabs.map((song) => (
              <SongItem key={song.id} song={song} showArtist={true} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="people" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No collaborations yet. Connect with other artists!</Text>
            </View>
          )}
        </View>

        {/* Social Profiles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connect</Text>
          <View style={styles.socialGrid}>
            {socialPlatforms.map((platform, index) => (
              <TouchableOpacity 
                key={index} 
                style={[styles.socialButton, { backgroundColor: platform.color }]}
              >
                <Ionicons name={platform.icon} size={28} color="white" />
                <Text style={styles.socialButtonText}>{platform.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Logout Button */}
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
  coverImageContainer: {
    height: 200,
    position: 'relative',
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 16,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
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
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  avatarContainer: {
    marginRight: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: 'white',
  },
  profileInfo: {
    flex: 1,
  },
  username: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#000',
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  bioSection: {
    marginBottom: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  skillsSection: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  bioText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  editContainer: {
    marginTop: 8,
  },
  bioInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  editButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  saveButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillTag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  skillTagReadOnly: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  skillText: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  addSkillContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    marginBottom: 10,
  },
  skillInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  addSkillButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  showMoreText: {
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: '600',
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  trackImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 16,
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  trackArtist: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  trackStatsRow: {
    flexDirection: 'row',
    gap: 15,
  },
  trackStat: {
    fontSize: 12,
    color: '#666',
  },
  playButton: {
    backgroundColor: '#8B5CF6',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonActive: {
    backgroundColor: '#7C3AED',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
    textAlign: 'center',
  },
  loadingIndicator: {
    padding: 40,
  },
  socialGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 15,
  },
  socialButton: {
    width: '48%',
    height: 80,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  socialButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    margin: 20,
    marginTop: 10,
    marginBottom: 40,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});