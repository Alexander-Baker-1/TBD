import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
  Linking,
  // Removed unused imports: Vibration, Notifications
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { fileStorageService } from './services/FileStorageService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define your shared webhook URL here for clarity
// In a real app, this would be your backend server's public URL
const SHARED_WEBHOOK_URL = "https://webhook.site/45baf50a-52ab-4c93-b699-8c358d53b116";

export default function AIMusicGenerator() {
  const router = useRouter();
  const [savedSongs, setSavedSongs] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [prompt, setPrompt] = useState('upbeat electronic dance music');
  const [style, setStyle] = useState('electronic, energetic, upbeat');
  const [title, setTitle] = useState('Dance Floor Energy');
  const [customMode, setCustomMode] = useState(false);
  const [instrumental, setInstrumental] = useState(true);
  const [model, setModel] = useState('V3_5');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [generatedMusic, setGeneratedMusic] = useState(null);
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [kieApiKey, setKieApiKey] = useState('');
  const [taskId, setTaskId] = useState(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false); // Still useful for manual check UI

  // Use expo-av Sound
  const soundRef = useRef(null);
  // Removed pollingRef - no longer polling Suno directly

  useEffect(() => {
    // Get API keys from environment
    const geminiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    const kieKey = process.env.EXPO_PUBLIC_KIE_API_KEY;

    setGeminiApiKey(geminiKey || '');
    setKieApiKey(kieKey || '');

    console.log('API Keys loaded:', {
      gemini: !!geminiKey,
      kie: !!kieKey
    });

    // --- REMOVED: setInterval for pollPendingSunoTasks ---
    // The KIE.ai API works with callbacks, not polling for task status.
    // Your React Native app cannot receive direct callbacks.
    // You need a backend server to receive webhooks and then notify the app.
    // For local testing, you'll manually check webhook.site.
    // ---

    // Initialize audio session
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    // Load saved songs from database
    loadSavedSongs();

    return () => {
      // Cleanup sound
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
      // No pollingRef cleanup needed if polling is removed
    };
  }, []); // Empty dependency array means this runs once on component mount

  // Removed unused function: submitMusicGeneration

  const loadSavedSongs = async () => {
    try {
      const songs = await fileStorageService.getAllSongs();
      setSavedSongs(songs);
    } catch (error) {
      console.error('Error loading saved songs:', error);
    }
  };

  const saveSongToLibrary = async (songData) => {
    const newSong = {
      id: Date.now().toString(),
      title: songData.title || 'Untitled Track',
      prompt: songData.prompt || generatedMusic?.prompt || 'No prompt',
      style: songData.style || generatedMusic?.style || '',
      genre: songData.genre || generatedMusic?.genre || '',
      mood: songData.mood || generatedMusic?.mood || '',
      model: songData.model || generatedMusic?.model || 'V3_5',
      audioUrl: songData.audio_url || songData.audioUrl,
      duration: songData.duration || 0,
      tags: songData.tags || '',
      createdAt: new Date().toISOString(),
      taskId: songData.taskId || generatedMusic?.taskId,
      customMode: generatedMusic?.customMode || false,
      instrumental: generatedMusic?.instrumental || true,
    };

    try {
      await fileStorageService.addSong(newSong);
      await loadSavedSongs(); // Reload the songs list

      Alert.alert(
        'Song Saved! 💾',
        `"${newSong.title}" has been permanently saved to your library.\n\nYou can access it from the collaborate page anytime, even after restarting the app!`
      );
    } catch (error) {
      console.error('Error saving song to storage:', error);
      Alert.alert('Error', 'Failed to save song to storage');
    }
  };

  // NEW: Manual Result Input Function (for testing with webhook.site)
  const handleManualResultInput = () => {
    let inputTaskId = '';
    let inputAudioUrl = '';
    Alert.prompt(
      'Add Manual Result',
      'Enter Task ID and Audio URL from Webhook.site:\n\nTask ID:',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Next (Audio URL)',
          onPress: (taskIdValue) => {
            inputTaskId = taskIdValue;
            Alert.prompt(
              'Add Manual Result (2/2)',
              'Enter Audio URL:\n\nAudio URL:',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
                {
                  text: 'Add Song',
                  onPress: async (audioUrlValue) => {
                    inputAudioUrl = audioUrlValue;
                    if (inputTaskId && inputAudioUrl) {
                      try {
                        // Retrieve the stored metadata for this task
                        const storedTask = await AsyncStorage.getItem(`task_${inputTaskId}`);
                        let metadata = {};
                        if (storedTask) {
                          metadata = JSON.parse(storedTask);
                          await AsyncStorage.removeItem(`task_${inputTaskId}`); // Clean up pending task
                        }

                        const newSong = {
                          id: Date.now().toString(),
                          taskId: inputTaskId,
                          title: metadata.title || 'Manually Added Track',
                          prompt: metadata.prompt || 'Manual input',
                          style: metadata.style || '',
                          genre: 'AI Generated', // Default
                          mood: 'various', // Default
                          model: metadata.model || 'V3_5',
                          audioUrl: inputAudioUrl,
                          duration: 0, // Duration might need to be retrieved from webhook data
                          tags: 'manually-added', // Default
                          createdAt: new Date().toISOString(),
                          customMode: metadata.customMode ?? false,
                          instrumental: metadata.instrumental ?? true,
                        };
                        await saveSongToLibrary(newSong);
                        Alert.alert('Success', 'Song added manually!');
                        // Optionally play the music after saving
                        await playGeneratedMusic(newSong, [newSong]); 
                      } catch (error) {
                        console.error('Error adding manual result:', error);
                        Alert.alert('Error', `Failed to add manual result: ${error.message}`);
                      }
                    } else {
                      Alert.alert('Error', 'Task ID and Audio URL are required.');
                    }
                  },
                },
              ],
              'plain-text',
              inputAudioUrl,
              'url' // Input type for URL
            );
          },
        },
      ],
      'plain-text',
      inputTaskId
    );
  };


  // Removed setupCallbackHandler as it's not directly used in this client-side app
  // The backend would set up the actual webhook.

  // FIXED: Proper task status checking (conceptual for KIE.ai's callback model)
  const checkTaskStatus = async (taskIdToCheck) => {
    // This function is illustrative. In a real scenario, your app would
    // be notified by your backend server, not poll for results.
    const currentTaskId = taskIdToCheck || taskId;
    if (!currentTaskId) {
      Alert.alert('No Task ID', 'No task ID available to check. Generate music first.');
      return;
    }

    try {
      setIsCheckingStatus(true);

      // KIE.ai uses callbacks. The user must check their webhook.site URL.
      // We retrieve the webhook URL that was originally used for this task.
      const storedTaskInfo = await AsyncStorage.getItem(`task_${currentTaskId}`);
      const taskMetadata = storedTaskInfo ? JSON.parse(storedTaskInfo) : {};
      const actualWebhookUrl = taskMetadata.webhookUrl || SHARED_WEBHOOK_URL; // Fallback to shared if not found

      Alert.alert(
        'Important: Callback System',
        `KIE.ai uses callbacks, not polling.\n\nTask ID: ${currentTaskId}\n\nResults are sent to the callback URL when generation completes. You need to check the webhook URL yourself.\n\nThis app cannot directly receive webhooks.\n\nOpen this URL in your browser:\n${actualWebhookUrl}`,
        [
          { text: 'OK' },
          {
            text: 'Open Webhook URL',
            onPress: () => {
              Linking.openURL(actualWebhookUrl);
            }
          },
          { text: 'Add Manual Result', onPress: handleManualResultInput }
        ]
      );

    } catch (error) {
      console.error('Manual check error:', error);
      Alert.alert('Check Error', `Failed to retrieve task info: ${error.message}`);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // --- CRITICAL CHANGE: Removed pollPendingSunoTasks ---
  // This function was attempting to poll Suno's direct API, which is blocked by Cloudflare
  // and is not how KIE.ai's callback system works.
  // The app relies on a backend receiving the webhook, or manual input for demo purposes.

  const connectToAPI = async () => {
    try {
      setIsLoading(true);
      setConnectionStatus('connecting');

      if (kieApiKey) {
        // Test KIE.ai API connection by checking credits
        console.log('Testing KIE.ai Suno API connection...');

        const response = await fetch('https://api.kie.ai/api/v1/chat/credit', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${kieApiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Credits response:', data);
          setIsConnected(true);
          setConnectionStatus('connected - real music ready');
          Alert.alert('🎵 Real Music Ready!', `Connected to KIE.ai Suno API!\nCredits: ${data.data || data.credit || 'Available'}\nYou can now generate professional music tracks!`);
        } else if (response.status === 401) {
          throw new Error('Invalid API key. Please check your KIE.ai API key.');
        } else {
          throw new Error(`KIE.ai API test failed: ${response.status}`);
        }
      } else {
        // Demo mode
        setIsConnected(true);
        setConnectionStatus('demo mode');
        Alert.alert('Demo Mode', 'Add EXPO_PUBLIC_KIE_API_KEY to .env for real music generation');
      }

    } catch (error) {
      console.error('Connection error:', error);
      setConnectionStatus('demo mode');
      setIsConnected(true);
      Alert.alert('Demo Mode', 'Using demo mode. Add KIE.ai API key for real music generation.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateRealMusic = async () => {
    if (!isConnected) {
      Alert.alert('Error', 'Not connected to API. Please connect first.');
      return;
    }

    try {
      setIsLoading(true);

      // Validate inputs based on mode
      if (customMode) {
        if (instrumental) {
          if (!style.trim() || !title.trim()) {
            Alert.alert('Invalid Input', 'For instrumental custom mode, style and title are required');
            setIsLoading(false); // Stop loading here
            return;
          }
        } else {
          if (!style.trim() || !prompt.trim() || !title.trim()) {
            Alert.alert('Invalid Input', 'For lyrical custom mode, style, prompt, and title are required');
            setIsLoading(false); // Stop loading here
            return;
          }
        }
      } else {
        if (!prompt.trim()) {
          Alert.alert('Invalid Input', 'Please enter a music prompt');
          setIsLoading(false); // Stop loading here
          return;
        }
        if (prompt.length > 400) {
          Alert.alert('Prompt Too Long', 'In non-custom mode, prompt must be under 400 characters');
          setIsLoading(false); // Stop loading here
          return;
        }
      }

      setGeneratedMusic({
        prompt: prompt.trim(),
        style: style.trim(),
        title: title.trim(),
        customMode,
        instrumental,
        model,
        startTime: new Date(),
        status: 'requesting generation'
      });

      if (kieApiKey) {
        await generateWithKieSuno();
      } else {
        await generateDemoMusic();
      }

    } catch (error) {
      console.error('Generation error:', error);
      Alert.alert('Generation Error', `Failed to generate music: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // UPDATED: Shared webhook approach for testing
  const generateWithKieSuno = async () => {
    try {
      console.log('Starting KIE.ai Suno music generation with shared webhook...');

      // Add user identification to webhook URL
      const currentUserId = 'user-' + Date.now(); // In real app, get from auth system
      const webhookWithParams = `${SHARED_WEBHOOK_URL}?userId=${currentUserId}&ref=${Date.now()}`;

      // Prepare request body based on mode
      const requestBody = {
        model: model,
        customMode: customMode,
        instrumental: instrumental,
        callBackUrl: webhookWithParams // Use shared webhook with user params
      };

      if (customMode) {
        requestBody.style = style.trim();
        requestBody.title = title.trim();
        if (!instrumental) {
          requestBody.prompt = prompt.trim();
        }
      } else {
        requestBody.prompt = prompt.trim();
      }

      console.log('Sending request to KIE.ai Suno API:', requestBody);

      // Call KIE.ai Suno API
      const response = await fetch('https://api.kie.ai/api/v1/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${kieApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('KIE.ai Suno API response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('KIE.ai Suno API response data:', data);

        // Extract task ID from response
        if (data.code === 200 && data.data) {
          const receivedTaskId = data.data.taskId || data.data.task_id || data.data.id || data.data;

          if (receivedTaskId) {
            setTaskId(receivedTaskId);
            setGeneratedMusic(prev => ({
              ...prev,
              status: 'generation started - check shared webhook',
              taskId: receivedTaskId,
              callbackUrl: SHARED_WEBHOOK_URL, // Store the base webhook URL for display
              userId: currentUserId
            }));

            // FIXED: Combine AsyncStorage.setItem calls
            await AsyncStorage.setItem(`task_${receivedTaskId}`, JSON.stringify({
              userId: currentUserId,
              taskId: receivedTaskId,
              prompt: prompt.trim(),
              style: style.trim(),
              title: title.trim(),
              model,
              customMode,
              instrumental,
              startTime: Date.now(),
              webhookUrl: webhookWithParams // Store the full webhook URL with params
            }));

            Alert.alert(
              '🎵 Generation Started!',
              `Task ID: ${receivedTaskId}\n\nYour music is being generated!\n\n🔗 Results will be sent to:\n${SHARED_WEBHOOK_URL}\n\n⏱️ Results typically arrive in 2-5 minutes.\n\n💡 Monitor the webhook URL (e.g., in a browser tab) for your results, then use "Add Manual Result" to import the audio into the app.`,
              [
                {
                  text: 'Open Webhook.site',
                  onPress: () => {
                    Linking.openURL(SHARED_WEBHOOK_URL); // Open the base URL
                  }
                },
                { text: 'OK' }
              ]
            );

          } else {
            console.log('Response structure:', JSON.stringify(data, null, 2));
            throw new Error(`No task ID found in response. Data: ${JSON.stringify(data.data)}`);
          }
        } else {
          throw new Error(data.msg || `Unexpected response: ${JSON.stringify(data)}`);
        }
      } else {
        const errorText = await response.text();
        console.error('KIE.ai Suno API error:', errorText);

        if (response.status === 401) {
          throw new Error('Invalid API key. Please check your KIE.ai API key.');
        } else if (response.status === 402) {
          throw new Error('Insufficient credits. Please check your KIE.ai account.');
        } else {
          throw new Error(`KIE.ai Suno API failed: ${response.status} - ${errorText}`);
        }
      }

    } catch (error) {
      console.error('KIE.ai Suno generation error:', error);
      Alert.alert('KIE.ai Suno Error', `Real music generation failed: ${error.message}\n\nFalling back to demo mode.`);
      await generateDemoMusic();
    }
  };

  // REMOVED: pollForResults function (not needed with callback system)

  // NEW: Function to handle callback results (this function would be called by your backend)
  // For client-side app, this is conceptual or used for manual input.
  const handleCallbackResults = async (callbackData) => {
    try {
      if (callbackData.callbackType === 'complete' && callbackData.data && callbackData.data.length > 0) {
        const firstTrack = callbackData.data[0];
        if (firstTrack.audio_url) {
          console.log('Music generation complete via callback:', firstTrack);
          // Here, you would ideally:
          // 1. Match the callbackData.taskId with a pending task in AsyncStorage
          // 2. Retrieve the original prompt, style, title etc.
          // 3. Save the song to library
          // 4. Potentially trigger a local notification to the user if the app is foregrounded
          // This requires a backend to receive the webhook and then notify the client app.
          Alert.alert("Callback Received (Backend Only)", "A callback was received for a generated track. You'd process this on a backend server.");
          // For immediate testing:
          // await playGeneratedMusic(firstTrack, callbackData.data);
          // await saveSongToLibrary(firstTrack); // Save if direct play/save is desired for testing
        }
      }
    } catch (error) {
      console.error('Callback handling error:', error);
    }
  };

  const playGeneratedMusic = async (track, allTracks) => {
    try {
      const audioUrl = track.audio_url;
      const title = track.title || 'Generated Track';
      const tags = track.tags || '';
      const duration = track.duration || 0;

      console.log('Playing real generated music:', audioUrl);

      // Stop any existing sound
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      // Play the real generated music using expo-audio!
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true, isLooping: false }
      );

      soundRef.current = sound;

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
          setGeneratedMusic(prev => ({
            ...prev,
            status: 'completed',
            endTime: new Date()
          }));
        }
      });

      setGeneratedMusic(prev => ({
        ...prev,
        status: 'playing real Suno AI music',
        audioUrl: audioUrl,
        title: title,
        tags: tags,
        duration: duration,
        totalTracks: allTracks.length,
        currentTrack: 1,
        endTime: new Date()
      }));

      setIsPlaying(true);

      const trackInfo = `"${title}"${tags ? `\nTags: ${tags}` : ''}${duration ? `\nDuration: ${Math.round(duration)}s` : ''}`;

      Alert.alert(
        '🎵 Real Suno AI Music Generated!',
        `Professional music created:\n${trackInfo}\n\n${allTracks.length} track(s) generated!\nNow playing track 1...`
      );

      // Automatically save the song to library
      // Only save if it's not a demo track and has a proper audio URL
      if (audioUrl && audioUrl.startsWith('http')) {
        saveSongToLibrary(track);
      }

    } catch (error) {
      console.error('Playback error:', error);
      Alert.alert('Playback Error', 'Could not play generated music');
    }
  };

  const generateDemoMusic = async () => {
    console.log('Generating demo music description...');

    // Simulate generation time
    await new Promise(resolve => setTimeout(resolve, 2000));

    let description = '';

    if (geminiApiKey) {
      // Generate enhanced description with Gemini
      try {
        const detailedPrompt = customMode
          ? `Create a detailed description of ${instrumental ? 'instrumental' : 'vocal'} music with style: "${style}", title: "${title}"${!instrumental ? `, prompt: "${prompt}"` : ''}. Include specific instruments, rhythm patterns, mood, and production details.`
          : `Create a detailed description of music based on this prompt: "${prompt}". Include specific instruments, rhythm patterns, mood, and production details.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: detailedPrompt }] }]
          })
        });

        if (response.ok) {
          const data = await response.json();
          description = data.candidates[0]?.content?.parts[0]?.text || 'AI description generated!';
        }
      } catch (error) {
        console.error('Gemini API error:', error);
      }
    }

    if (!description) {
      // Fallback demo description
      const modeDesc = customMode
        ? `**Custom Mode:** ${instrumental ? 'Instrumental' : 'With Lyrics'}\n**Style:** ${style}\n**Title:** ${title}${!instrumental ? `\n**Lyrics Prompt:** ${prompt}` : ''}`
        : `**Simple Mode**\n**Prompt:** ${prompt}`;

      description = `**Generated with KIE.ai Suno API**
**Model:** ${model}
${modeDesc}

**Description:**
This track would be generated using Suno AI's professional music generation technology, featuring high-quality production with realistic instruments and vocals. The composition would include carefully crafted elements that create an engaging musical experience.

**Technical Features:**
• Professional-grade audio quality
• Realistic instrument synthesis
• Advanced AI composition
• Commercial-ready output
• Multiple track variations

**Suno AI Capabilities:**
• Text-to-music generation
• Custom lyrics integration
• Multiple music models (V3.5, V4, V4.5)
• Professional music production
• Genre-specific optimization

*Note: This is a demo description. Add KIE.ai API key for real Suno AI music generation!*`;
    }

    setGeneratedMusic(prev => ({
      ...prev,
      status: 'demo description generated',
      description: description,
      // No audioUrl for demo, so it won't try to play
      endTime: new Date()
    }));

    Alert.alert('📝 Demo Description Generated', 'Add KIE.ai API key to generate real Suno AI music!');
  };

  const stopMusic = async () => {
    try {
      // No pollingRef cleanup needed if polling is removed
      
      if (soundRef.current) {
        await soundRef.current.pauseAsync();
        // Option: unload the sound completely to free resources
        await soundRef.current.unloadAsync(); 
        soundRef.current = null;
      }

      setIsPlaying(false);
      // setTaskId(null); // Keep taskId if user wants to manually check its status

      if (generatedMusic) {
        setGeneratedMusic({
          ...generatedMusic,
          status: 'stopped',
          endTime: new Date()
        });
      }

      Alert.alert('Stopped', 'Music playback stopped');
    } catch (error) {
      console.error('Stop error:', error);
    }
  };

  const disconnect = async () => {
    if (isPlaying) {
      await stopMusic();
    }

    // No pollingRef cleanup needed if polling is removed

    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }

    setIsConnected(false);
    setConnectionStatus('disconnected');
    setGeneratedMusic(null);
    setTaskId(null); // Clear taskId on disconnect
    Alert.alert('Disconnected', 'Disconnected from KIE.ai Suno API');
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected - real music ready': return '#4CAF50';
      case 'demo mode': return '#FF9800';
      case 'connecting': return '#FF9800';
      case 'error': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const formatDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return '0:00'; // Handle cases where times are not set
    const duration = Math.floor((new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };


  const openKieGuide = () => {
    Alert.alert(
      'Get KIE.ai API Key 🎵',
      'To generate real Suno AI music:\n\n1. Visit kie.ai\n2. Sign up and get your API key\n3. Add to .env file as EXPO_PUBLIC_KIE_API_KEY\n\nThis uses the official Suno AI technology for professional music generation.\n\nWould you like to open the website?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open KIE.ai', onPress: () => Linking.openURL('https://kie.ai') }
      ]
    );
  };

  const checkCredits = async () => {
    if (!kieApiKey) {
      Alert.alert('No API Key', 'Add KIE.ai API key to check credits');
      return;
    }

    try {
      const response = await fetch('https://api.kie.ai/api/v1/chat/credit', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${kieApiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        Alert.alert('Credits Status', `Available Credits: ${data.data || data.credit || 'Unknown'}`);
      } else {
        Alert.alert('Error', `Could not fetch credits: ${response.status}`);
      }
    } catch (error) {
      Alert.alert('Error', `Failed to check credits: ${error.message}`);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'AI Music Generator',
          headerStyle: { backgroundColor: '#6366f1' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/')}
              style={{ marginLeft: -8, padding: 8 }}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
          ),
        }}
      />
      <StatusBar barStyle="light-content" backgroundColor="#6366f1" />

      <ScrollView style={styles.container}>
        {/* Back Button */}
        <View style={styles.backButtonContainer}>
          <TouchableOpacity
            style={styles.backButtonStyle}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#6366f1" />
            <Text style={styles.backButtonText}>Back to Collaborate</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>KIE.ai Suno Music</Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
            <Text style={styles.statusText}>{connectionStatus}</Text>
          </View>
        </View>

        {/* API Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>API Status</Text>
          <View style={styles.apiStatus}>
            <Ionicons
              name={kieApiKey ? "checkmark-circle" : "alert-circle"}
              size={20}
              color={kieApiKey ? "#4CAF50" : "#FF9800"}
            />
            <Text style={[styles.apiStatusText, {
              color: kieApiKey ? "#4CAF50" : "#FF9800"
            }]}>
              {kieApiKey ? 'KIE.ai Suno Ready - Professional Music Generation!' : 'Demo Mode - Add API Key for Real Suno AI'}
            </Text>
          </View>

          {geminiApiKey && (
            <View style={[styles.apiStatus, { marginTop: 8 }]}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={[styles.apiStatusText, { color: "#4CAF50" }]}>
                Gemini AI Enhanced Descriptions
              </Text>
            </View>
          )}

          {kieApiKey && (
            <TouchableOpacity style={[styles.button, styles.creditsButton]} onPress={checkCredits}>
              <Ionicons name="card" size={16} color="white" style={styles.buttonIcon} />
              <Text style={[styles.buttonText, { fontSize: 14 }]}>Check Credits</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Connection Controls */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connection</Text>
          <TouchableOpacity
            style={[styles.button, isConnected ? styles.disconnectButton : styles.connectButton]}
            onPress={isConnected ? disconnect : connectToAPI}
            disabled={isLoading && !isPlaying}
          >
            {isLoading && !isPlaying ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons
                  name={isConnected ? "close-circle" : "wifi"}
                  size={20}
                  color="white"
                  style={styles.buttonIcon}
                />
                <Text style={styles.buttonText}>
                  {isConnected ? 'Disconnect' : 'Connect to KIE.ai Suno'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {!kieApiKey && (
            <TouchableOpacity style={[styles.button, styles.infoButton]} onPress={openKieGuide}>
              <Ionicons name="information-circle" size={20} color="white" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Get KIE.ai API Key</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Mode Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Generation Mode</Text>

          <View style={styles.modeContainer}>
            <TouchableOpacity
              style={[styles.modeButton, !customMode && styles.activeModeButton]}
              onPress={() => setCustomMode(false)}
              disabled={isLoading}
            >
              <Text style={[styles.modeButtonText, !customMode && styles.activeModeButtonText]}>
                Simple Mode
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeButton, customMode && styles.activeModeButton]}
              onPress={() => setCustomMode(true)}
              disabled={isLoading}
            >
              <Text style={[styles.modeButtonText, customMode && styles.activeModeButtonText]}>
                Custom Mode
              </Text>
            </TouchableOpacity>
          </View>

          {customMode && (
            <View style={styles.instrumentalContainer}>
              <TouchableOpacity
                style={[styles.modeButton, instrumental && styles.activeModeButton]}
                onPress={() => setInstrumental(true)}
                disabled={isLoading}
              >
                <Text style={[styles.modeButtonText, instrumental && styles.activeModeButtonText]}>
                  Instrumental
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeButton, !instrumental && styles.activeModeButton]}
                onPress={() => setInstrumental(false)}
                disabled={isLoading}
              >
                <Text style={[styles.modeButtonText, !instrumental && styles.activeModeButtonText]}>
                  With Lyrics
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Music Controls */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Music Generation</Text>

          {/* Model Selection */}
          <View>
            <Text style={styles.label}>AI Model:</Text>
            <View style={styles.modelSelection}>
              {['V3', 'V3_5', 'V4', 'V4_5'].map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.modelButton, model === m && styles.activeModelButton]}
                  onPress={() => setModel(m)}
                  disabled={isLoading}
                >
                  <Text style={[styles.modelButtonText, model === m && styles.activeModelButtonText]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>


          {customMode && (
            <>
              <Text style={styles.label}>Title (e.g., "My Epic Ballad"):</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter a title for your song"
                editable={!isLoading}
              />
              <Text style={styles.label}>Style of Music (e.g., "EDM, energetic, cyberpunk"):</Text>
              <TextInput
                style={styles.input}
                value={style}
                onChangeText={setStyle}
                placeholder="e.g., 'lo-fi hip-hop, chill, jazzy'"
                editable={!isLoading}
              />
            </>
          )}

          {!instrumental || !customMode ? (
            <>
              <Text style={styles.label}>
                {customMode && !instrumental ? 'Lyrics / Song Description:' : 'Music Prompt:'}
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={prompt}
                onChangeText={setPrompt}
                placeholder={
                  customMode && !instrumental
                    ? "Enter your lyrics or detailed song description here."
                    : "e.g., 'A soaring orchestral piece for a movie soundtrack'"
                }
                multiline
                numberOfLines={customMode && !instrumental ? 6 : 3}
                editable={!isLoading}
              />
              {customMode && !instrumental && (
                <Text style={styles.hint}>
                  💡 For best results, ensure your lyrics are clearly formatted.
                </Text>
              )}
              {!customMode && (
                <Text style={styles.hint}>
                  Max 400 characters in Simple Mode.
                </Text>
              )}
            </>
          ) : null}

          <TouchableOpacity
            style={[styles.button, styles.generateButton, (isLoading || !isConnected) && styles.disabledButton]}
            onPress={generateRealMusic}
            disabled={isLoading || !isConnected}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="sparkles" size={20} color="white" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Generate Music</Text>
              </>
            )}
          </TouchableOpacity>

          {taskId && (
            <TouchableOpacity
              style={[styles.button, styles.checkStatusButton, isCheckingStatus && styles.disabledButton]}
              onPress={() => checkTaskStatus(taskId)}
              disabled={isCheckingStatus}
            >
              {isCheckingStatus ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="search" size={20} color="white" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Check Task Status</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.button, styles.manualInputButton]}
            onPress={handleManualResultInput}
          >
            <Ionicons name="add-circle" size={20} color="white" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Add Manual Result</Text>
          </TouchableOpacity>

          {generatedMusic && (generatedMusic.audioUrl || generatedMusic.description) && (
            <View style={styles.generatedMusicContainer}>
              <Text style={styles.sectionTitle}>Generated Music</Text>
              {generatedMusic.title && <Text style={styles.generatedTitle}>Title: {generatedMusic.title}</Text>}
              {generatedMusic.prompt && <Text style={styles.generatedText}>Prompt: {generatedMusic.prompt}</Text>}
              {generatedMusic.style && <Text style={styles.generatedText}>Style: {generatedMusic.style}</Text>}
              {generatedMusic.model && <Text style={styles.generatedText}>Model: {generatedMusic.model}</Text>}
              {generatedMusic.status && <Text style={styles.generatedText}>Status: {generatedMusic.status}</Text>}
              {generatedMusic.startTime && generatedMusic.endTime && (
                <Text style={styles.generatedText}>
                  Generation Time: {formatDuration(generatedMusic.startTime, generatedMusic.endTime)}
                </Text>
              )}
              {generatedMusic.audioUrl ? (
                <View style={styles.audioPlayer}>
                  <Text style={styles.label}>Audio Player:</Text>
                  <View style={styles.playerControls}>
                    <TouchableOpacity onPress={() => Linking.openURL(generatedMusic.audioUrl)}>
                      <Ionicons name="download" size={24} color="#6366f1" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => playGeneratedMusic(generatedMusic, [generatedMusic])} disabled={isPlaying}>
                      <Ionicons name={isPlaying ? "pause-circle" : "play-circle"} size={48} color="#6366f1" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={stopMusic} disabled={!isPlaying}>
                      <Ionicons name="stop-circle" size={24} color="#6366f1" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <Text style={styles.generatedText}>No audio URL available (demo or pending callback).</Text>
              )}
              {generatedMusic.description && (
                <View style={styles.descriptionBox}>
                  <Text style={styles.descriptionTitle}>AI Generated Description:</Text>
                  <Text style={styles.descriptionText}>{generatedMusic.description}</Text>
                </View>
              )}
              {generatedMusic.audioUrl && (
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={() => saveSongToLibrary(generatedMusic)}
                >
                  <Ionicons name="save" size={20} color="white" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Save to Library</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <View style={{ height: 50 }} /> {/* Spacer */}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
    padding: 20,
  },
  backButtonContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  backButtonStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#e0e7ff',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    marginLeft: 5,
    color: '#6366f1',
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e7ff',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  statusText: {
    fontSize: 14,
    color: '#444',
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  apiStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  apiStatusText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '600',
  },
  label: {
    fontSize: 16,
    color: '#555',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: '#fdfdff',
    color: '#333',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: '#888',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  buttonIcon: {
    marginRight: 5,
  },
  connectButton: {
    backgroundColor: '#4CAF50',
  },
  disconnectButton: {
    backgroundColor: '#F44336',
  },
  generateButton: {
    backgroundColor: '#6366f1',
  },
  checkStatusButton: {
    backgroundColor: '#007bff',
  },
  creditsButton: {
    backgroundColor: '#8BC34A',
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginTop: 10,
  },
  saveButton: {
    backgroundColor: '#28a745',
  },
  infoButton: {
    backgroundColor: '#17a2b8',
  },
  disabledButton: {
    opacity: 0.6,
  },
  modeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    backgroundColor: '#e0e7ff',
    borderRadius: 10,
    padding: 5,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeModeButton: {
    backgroundColor: '#6366f1',
  },
  modeButtonText: {
    color: '#6366f1',
    fontWeight: 'bold',
  },
  activeModeButtonText: {
    color: 'white',
  },
  instrumentalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    backgroundColor: '#e0e7ff',
    borderRadius: 10,
    padding: 5,
    marginTop: 10,
  },
  modelSelection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
    backgroundColor: '#e0e7ff',
    borderRadius: 10,
    padding: 5,
  },
  modelButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  activeModelButton: {
    backgroundColor: '#6366f1',
  },
  modelButtonText: {
    color: '#6366f1',
    fontWeight: 'bold',
    fontSize: 13,
  },
  activeModelButtonText: {
    color: 'white',
  },
  generatedMusicContainer: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#e6f2ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#b3d9ff',
  },
  generatedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  generatedText: {
    fontSize: 15,
    color: '#555',
    marginBottom: 5,
  },
  audioPlayer: {
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#b3d9ff',
  },
  playerControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 10,
  },
  descriptionBox: {
    backgroundColor: '#f0f8ff',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#444',
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});