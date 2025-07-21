import React, { useState } from 'react';
import { Link } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Type definitions
interface Song {
  id: string;
  title: string;
  artist: string;
  genre: string;
  plays: number;
  likes: number;
  duration: number;
  cover: string;
  waveform: string;
}

interface Artist {
  id: string;
  name: string;
  followers: number;
  tracks: number;
  avatar: string;
  verified: boolean;
}

interface Genre {
  name: string;
  count: number;
  color: string;
}

interface SongCardProps {
  song: Song;
}

interface ArtistCardProps {
  artist: Artist;
}

interface GenreCardProps {
  genre: Genre;
}

export default function DiscoverScreen() {
  const [activeTab, setActiveTab] = useState<'trending' | 'artists' | 'genres'>('trending');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Mock data for trending songs
  const trendingSongs: Song[] = [
    {
      id: '1',
      title: 'Neon Dreams',
      artist: 'SynthWave92',
      genre: 'Electronic',
      plays: 45231,
      likes: 1203,
      duration: 189,
      cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=150&h=150&fit=crop',
      waveform: '▁▂▃▅▆▇█▆▅▃▂▁▂▃▅▆▇'
    },
    {
      id: '2',
      title: 'Midnight Coffee',
      artist: 'LoFiVibes',
      genre: 'Lo-Fi',
      plays: 32156,
      likes: 892,
      duration: 156,
      cover: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=150&h=150&fit=crop',
      waveform: '▂▁▃▄▆▅▃▂▁▃▄▆▇▆▄▃'
    },
    {
      id: '3',
      title: 'Ocean Waves',
      artist: 'AmbientSpace',
      genre: 'Ambient',
      plays: 28934,
      likes: 756,
      duration: 243,
      cover: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=150&h=150&fit=crop',
      waveform: '▁▂▁▃▂▄▃▅▄▆▅▇▆▅▄▃'
    },
    {
      id: '4',
      title: 'Urban Jungle',
      artist: 'BeatMaster',
      genre: 'Hip-Hop',
      plays: 67821,
      likes: 2134,
      duration: 201,
      cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=150&h=150&fit=crop',
      waveform: '▇▆▅▄▃▂▁▂▃▄▅▆▇▆▅▄'
    },
    {
      id: '5',
      title: 'Starlight Serenade',
      artist: 'CosmicMelody',
      genre: 'Classical',
      plays: 19876,
      likes: 543,
      duration: 278,
      cover: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=150&h=150&fit=crop',
      waveform: '▂▃▄▅▆▇▆▅▄▃▂▁▂▃▄▅'
    }
  ];

  // Mock data for featured artists
  const featuredArtists: Artist[] = [
    {
      id: '1',
      name: 'SynthWave92',
      followers: 12500,
      tracks: 23,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face',
      verified: true
    },
    {
      id: '2',
      name: 'LoFiVibes',
      followers: 8900,
      tracks: 31,
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b332c2cd?w=80&h=80&fit=crop&crop=face',
      verified: false
    },
    {
      id: '3',
      name: 'AmbientSpace',
      followers: 6700,
      tracks: 18,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face',
      verified: true
    },
    {
      id: '4',
      name: 'BeatMaster',
      followers: 15200,
      tracks: 45,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face',
      verified: true
    }
  ];

  // Mock data for genres
  const genres: Genre[] = [
    { name: 'Electronic', count: 1234, color: '#8B5CF6' },
    { name: 'Lo-Fi', count: 892, color: '#F59E0B' },
    { name: 'Ambient', count: 567, color: '#10B981' },
    { name: 'Hip-Hop', count: 2341, color: '#EF4444' },
    { name: 'Classical', count: 432, color: '#3B82F6' },
    { name: 'Jazz', count: 678, color: '#F97316' }
  ];

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const SongCard: React.FC<SongCardProps> = ({ song }) => (
    <TouchableOpacity style={styles.songCard}>
      <Image source={{ uri: song.cover }} style={styles.songCover} />
      <View style={styles.songInfo}>
        <Text style={styles.songTitle} numberOfLines={1}>{song.title}</Text>
        <Text style={styles.songArtist} numberOfLines={1}>{song.artist}</Text>
        <View style={styles.songStats}>
          <Text style={styles.genre}>{song.genre}</Text>
          <View style={styles.statsRow}>
            <Text style={styles.stat}>🎧 {formatNumber(song.plays)}</Text>
            <Text style={styles.stat}>❤️ {formatNumber(song.likes)}</Text>
            <Text style={styles.stat}>{formatDuration(song.duration)}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity style={styles.playButton}>
        <Ionicons name="play" size={20} color="white" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const ArtistCard: React.FC<ArtistCardProps> = ({ artist }) => (
    <TouchableOpacity style={styles.artistCard}>
      <Image source={{ uri: artist.avatar }} style={styles.artistAvatar} />
      <View style={styles.artistInfo}>
        <View style={styles.artistNameRow}>
          <Text style={styles.artistName} numberOfLines={1}>{artist.name}</Text>
          {artist.verified && <Ionicons name="checkmark-circle" size={16} color="#3B82F6" />}
        </View>
        <Text style={styles.artistStats}>{formatNumber(artist.followers)} followers</Text>
        <Text style={styles.artistStats}>{artist.tracks} tracks</Text>
      </View>
      <TouchableOpacity style={styles.followButton}>
        <Text style={styles.followButtonText}>Follow</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const GenreCard: React.FC<GenreCardProps> = ({ genre }) => (
    <TouchableOpacity style={[styles.genreCard, { backgroundColor: genre.color }]}>
      <Text style={styles.genreName}>{genre.name}</Text>
      <Text style={styles.genreCount}>{formatNumber(genre.count)} tracks</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search songs, artists, or genres..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {(['trending', 'artists', 'genres'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'trending' && (
          <View>
            <Text style={styles.sectionTitle}>🔥 Trending Now</Text>
            {trendingSongs.map((song, index) => (
              <View key={song.id}>
                <SongCard song={song} />
                {index < trendingSongs.length - 1 && <View style={styles.separator} />}
              </View>
            ))}
          </View>
        )}

        {activeTab === 'artists' && (
          <View>
            <Text style={styles.sectionTitle}>⭐ Featured Artists</Text>
            {featuredArtists.map((artist, index) => (
              <View key={artist.id}>
                <ArtistCard artist={artist} />
                {index < featuredArtists.length - 1 && <View style={styles.separator} />}
              </View>
            ))}
          </View>
        )}

        {activeTab === 'genres' && (
          <View>
            <Text style={styles.sectionTitle}>🎵 Browse by Genre</Text>
            <View style={styles.genreGrid}>
              {genres.map((genre) => (
                <GenreCard key={genre.name} genre={genre} />
              ))}
            </View>
          </View>
        )}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
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
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
  },
  searchButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#e9ecef',
  },
  activeTab: {
    backgroundColor: '#8B5CF6',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: 'white',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  songCover: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 16,
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  songArtist: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  songStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  genre: {
    fontSize: 12,
    color: '#8B5CF6',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  stat: {
    fontSize: 12,
    color: '#999',
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  separator: {
    height: 12,
  },
  artistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  artistAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  artistInfo: {
    flex: 1,
  },
  artistNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  artistName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 6,
  },
  artistStats: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  followButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  followButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  genreCard: {
    width: '47%',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  genreName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  genreCount: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  bottomSpacing: {
    height: 40,
  },
});