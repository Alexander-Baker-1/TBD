// app/services/FileStorageService.js
import * as FileSystem from 'expo-file-system';

class FileStorageService {
  constructor() {
    this.filePath = `${FileSystem.documentDirectory}music_library.json`;
    this.initStorage();
  }

  async initStorage() {
    try {
      // Check if the file exists, if not create it with empty array
      const fileInfo = await FileSystem.getInfoAsync(this.filePath);
      if (!fileInfo.exists) {
        await this.saveToFile([]);
        console.log('Music library file created');
      } else {
        console.log('Music library file exists');
      }
    } catch (error) {
      console.error('Error initializing storage:', error);
    }
  }

  async saveToFile(songs) {
    try {
      const jsonString = JSON.stringify(songs, null, 2);
      await FileSystem.writeAsStringAsync(this.filePath, jsonString);
      return true;
    } catch (error) {
      console.error('Error saving to file:', error);
      throw error;
    }
  }

  async loadFromFile() {
    try {
      const fileInfo = await FileSystem.getInfoAsync(this.filePath);
      if (!fileInfo.exists) {
        return [];
      }
      
      const jsonString = await FileSystem.readAsStringAsync(this.filePath);
      const songs = JSON.parse(jsonString);
      return Array.isArray(songs) ? songs : [];
    } catch (error) {
      console.error('Error loading from file:', error);
      return [];
    }
  }

  async addSong(song) {
    try {
      const existingSongs = await this.loadFromFile();
      const newSongs = [song, ...existingSongs];
      await this.saveToFile(newSongs);
      console.log('Song added successfully:', song.title);
      return true;
    } catch (error) {
      console.error('Error adding song:', error);
      throw error;
    }
  }

  async getAllSongs() {
    try {
      const songs = await this.loadFromFile();
      // Sort by creation date (newest first)
      return songs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      console.error('Error getting all songs:', error);
      return [];
    }
  }

  async deleteSong(songId) {
    try {
      const existingSongs = await this.loadFromFile();
      const filteredSongs = existingSongs.filter(song => song.id !== songId);
      await this.saveToFile(filteredSongs);
      console.log('Song deleted successfully:', songId);
      return true;
    } catch (error) {
      console.error('Error deleting song:', error);
      throw error;
    }
  }

  async clearAllSongs() {
    try {
      await this.saveToFile([]);
      console.log('All songs cleared successfully');
      return true;
    } catch (error) {
      console.error('Error clearing all songs:', error);
      throw error;
    }
  }

  async getSongById(songId) {
    try {
      const songs = await this.loadFromFile();
      return songs.find(song => song.id === songId) || null;
    } catch (error) {
      console.error('Error getting song by ID:', error);
      return null;
    }
  }

  async updateSong(songId, updates) {
    try {
      const existingSongs = await this.loadFromFile();
      const songIndex = existingSongs.findIndex(song => song.id === songId);
      
      if (songIndex === -1) {
        throw new Error('Song not found');
      }
      
      existingSongs[songIndex] = { ...existingSongs[songIndex], ...updates };
      await this.saveToFile(existingSongs);
      console.log('Song updated successfully:', songId);
      return true;
    } catch (error) {
      console.error('Error updating song:', error);
      throw error;
    }
  }

  async getStorageStats() {
    try {
      const fileInfo = await FileSystem.getInfoAsync(this.filePath);
      const songs = await this.loadFromFile();
      
      return {
        songCount: songs.length,
        fileSize: fileInfo.exists ? fileInfo.size : 0,
        filePath: this.filePath,
        lastModified: fileInfo.exists ? new Date(fileInfo.modificationTime) : null
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return {
        songCount: 0,
        fileSize: 0,
        filePath: this.filePath,
        lastModified: null
      };
    }
  }
}

// Create and export a singleton instance
export const fileStorageService = new FileStorageService();