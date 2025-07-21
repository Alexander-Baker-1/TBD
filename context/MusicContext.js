// contexts/MusicContext.js
import React, { createContext, useContext, useState } from 'react';

const MusicContext = createContext(undefined);

export const MusicProvider = ({ children }) => {
  const [savedSongs, setSavedSongs] = useState([]);

  const addSong = (song) => {
    setSavedSongs(prev => [song, ...prev]);
  };

  const deleteSong = (songId) => {
    setSavedSongs(prev => prev.filter(song => song.id !== songId));
  };

  const clearAllSongs = () => {
    setSavedSongs([]);
  };

  return (
    <MusicContext.Provider value={{
      savedSongs,
      setSavedSongs,
      addSong,
      deleteSong,
      clearAllSongs
    }}>
      {children}
    </MusicContext.Provider>
  );
};

export const useMusicContext = () => {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error('useMusicContext must be used within a MusicProvider');
  }
  return context;
};