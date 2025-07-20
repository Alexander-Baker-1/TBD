// app/services/FileStorageService.js
import * as FileSystem from 'expo-file-system';

class FileStorageService {
  constructor() {
    this.musicFilePath = `${FileSystem.documentDirectory}music_library.json`;
    this.profileFilePath = `${FileSystem.documentDirectory}user_profile.json`;
    this.initStorage();
  }

  async initStorage() {
    try {
      // Initialize music library
      const musicFileInfo = await FileSystem.getInfoAsync(this.musicFilePath);
      if (!musicFileInfo.exists) {
        await this.saveToFile([], 'music');
        console.log('Music library file created');
      } else {
        console.log('Music library file exists');
      }

      // Initialize profile data
      const profileFileInfo = await FileSystem.getInfoAsync(this.profileFilePath);
      if (!profileFileInfo.exists) {
        await this.saveToFile({
          bio: "Passionate music producer and AI enthusiast. Love creating ambient soundscapes and electronic beats. Always looking to collaborate with fellow artists!",
          skills: ["Electronic Music", "Ambient", "AI Music", "Mixing", "Sound Design"],
          socialLinks: {},
          preferences: {}
        }, 'profile');
        console.log('Profile file created');
      } else {
        console.log('Profile file exists');
      }
    } catch (error) {
      console.error('Error initializing storage:', error);
    }
  }

  async saveToFile(data, type = 'music') {
    try {
      const filePath = type === 'music' ? this.musicFilePath : this.profileFilePath;
      const jsonString = JSON.stringify(data, null, 2);
      await FileSystem.writeAsStringAsync(filePath, jsonString);
      return true;
    } catch (error) {
      console.error(`Error saving ${type} to file:`, error);
      throw error;
    }
  }

  async loadFromFile(type = 'music') {
    try {
      const filePath = type === 'music' ? this.musicFilePath : this.profileFilePath;
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (!fileInfo.exists) {
        return type === 'music' ? [] : {};
      }
      
      const jsonString = await FileSystem.readAsStringAsync(filePath);
      const data = JSON.parse(jsonString);
      return type === 'music' ? (Array.isArray(data) ? data : []) : data;
    } catch (error) {
      console.error(`Error loading ${type} from file:`, error);
      return type === 'music' ? [] : {};
    }
  }

  // Music-related methods
  async addSong(song) {
    try {
      const existingSongs = await this.loadFromFile('music');
      const newSongs = [song, ...existingSongs];
      await this.saveToFile(newSongs, 'music');
      console.log('Song added successfully:', song.title);
      return true;
    } catch (error) {
      console.error('Error adding song:', error);
      throw error;
    }
  }

  async getAllSongs() {
    try {
      const songs = await this.loadFromFile('music');
      // Sort by creation date (newest first)
      return songs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      console.error('Error getting all songs:', error);
      return [];
    }
  }

  async deleteSong(songId) {
    try {
      const existingSongs = await this.loadFromFile('music');
      const filteredSongs = existingSongs.filter(song => song.id !== songId);
      await this.saveToFile(filteredSongs, 'music');
      console.log('Song deleted successfully:', songId);
      return true;
    } catch (error) {
      console.error('Error deleting song:', error);
      throw error;
    }
  }

  async clearAllSongs() {
    try {
      await this.saveToFile([], 'music');
      console.log('All songs cleared successfully');
      return true;
    } catch (error) {
      console.error('Error clearing all songs:', error);
      throw error;
    }
  }

  async getSongById(songId) {
    try {
      const songs = await this.loadFromFile('music');
      return songs.find(song => song.id === songId) || null;
    } catch (error) {
      console.error('Error getting song by ID:', error);
      return null;
    }
  }

  async updateSong(songId, updates) {
    try {
      const existingSongs = await this.loadFromFile('music');
      const songIndex = existingSongs.findIndex(song => song.id === songId);
      
      if (songIndex === -1) {
        throw new Error('Song not found');
      }
      
      existingSongs[songIndex] = { ...existingSongs[songIndex], ...updates };
      await this.saveToFile(existingSongs, 'music');
      console.log('Song updated successfully:', songId);
      return true;
    } catch (error) {
      console.error('Error updating song:', error);
      throw error;
    }
  }

  // Profile-related methods
  async getProfile() {
    try {
      return await this.loadFromFile('profile');
    } catch (error) {
      console.error('Error getting profile:', error);
      return {
        bio: "",
        skills: [],
        socialLinks: {},
        preferences: {}
      };
    }
  }

  async updateProfile(updates) {
    try {
      const currentProfile = await this.loadFromFile('profile');
      const updatedProfile = { ...currentProfile, ...updates };
      await this.saveToFile(updatedProfile, 'profile');
      console.log('Profile updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  async updateBio(bio) {
    try {
      const profile = await this.getProfile();
      profile.bio = bio;
      await this.saveToFile(profile, 'profile');
      return true;
    } catch (error) {
      console.error('Error updating bio:', error);
      throw error;
    }
  }

  async updateSkills(skills) {
    try {
      const profile = await this.getProfile();
      profile.skills = skills;
      await this.saveToFile(profile, 'profile');
      return true;
    } catch (error) {
      console.error('Error updating skills:', error);
      throw error;
    }
  }

  // Utility methods
  async getStorageStats() {
    try {
      const musicFileInfo = await FileSystem.getInfoAsync(this.musicFilePath);
      const profileFileInfo = await FileSystem.getInfoAsync(this.profileFilePath);
      const songs = await this.loadFromFile('music');
      
      return {
        songCount: songs.length,
        musicFileSize: musicFileInfo.exists ? musicFileInfo.size : 0,
        profileFileSize: profileFileInfo.exists ? profileFileInfo.size : 0,
        musicFilePath: this.musicFilePath,
        profileFilePath: this.profileFilePath,
        lastModified: musicFileInfo.exists ? new Date(musicFileInfo.modificationTime) : null
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return {
        songCount: 0,
        musicFileSize: 0,
        profileFileSize: 0,
        musicFilePath: this.musicFilePath,
        profileFilePath: this.profileFilePath,
        lastModified: null
      };
    }
  }

  // Get songs by type for profile page
  async getTopTracks() {
    try {
      const songs = await this.getAllSongs();
      return songs.filter(song => !song.artist || !song.artist.includes(' x '));
    } catch (error) {
      console.error('Error getting top tracks:', error);
      return [];
    }
  }

  async getCollaborations() {
    try {
      const songs = await this.getAllSongs();
      return songs.filter(song => song.artist && song.artist.includes(' x '));
    } catch (error) {
      console.error('Error getting collaborations:', error);
      return [];
    }
  }
}

// Create and export a singleton instance
export const fileStorageService = new FileStorageService();