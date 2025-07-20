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
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { fileStorageService } from './services/FileStorageService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WebhookReaderService from './services/WebhookReaderService';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [monitoringInterval, setMonitoringInterval] = useState(null);
  
  // Use expo-av Sound 
  const soundRef = useRef(null);

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
      // Cleanup sound and monitoring
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
      if (monitoringInterval) {
        clearInterval(monitoringInterval);
      }
    };
  }, []);

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

  // Manual Result Input Function (for testing with webhook.site)
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

  // Auto-monitoring generation function
  const generateWithAutoMonitoring = async () => {
    if (!isConnected) {
      Alert.alert('Error', 'Not connected to API');
      return;
    }

    try {
      setIsLoading(true);
      
      // Validate inputs
      if (customMode) {
        if (instrumental) {
          if (!style.trim() || !title.trim()) {
            Alert.alert('Invalid Input', 'For instrumental custom mode, style and title are required');
            return;
          }
        } else {
          if (!style.trim() || !prompt.trim() || !title.trim()) {
            Alert.alert('Invalid Input', 'For lyrical custom mode, style, prompt, and title are required');
            return;
          }
        }
      } else {
        if (!prompt.trim()) {
          Alert.alert('Invalid Input', 'Please enter a music prompt');
          return;
        }
        if (prompt.length > 400) {
          Alert.alert('Prompt Too Long', 'In non-custom mode, prompt must be under 400 characters');
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
        status: 'starting auto-monitored generation'
      });

      if (kieApiKey) {
        // Use the auto-monitoring service
        const result = await WebhookReaderService.generateWithAutoMonitoring(
          {
            model,
            customMode,
            instrumental,
            prompt: prompt.trim(),
            style: style.trim(),
            title: title.trim()
          },
          kieApiKey,
          async (result) => {
            setIsLoading(false);
            
            if (result.success && result.webhookData) {
              console.log('🎵 Auto-monitoring found result!');
              
              // Automatically process and save the song
              const saveResult = await WebhookReaderService.processWebhookResult(
                result.webhookData,
                result.taskId,
                fileStorageService
              );
              
              if (saveResult.success) {
                setGeneratedMusic(prev => ({
                  ...prev,
                  status: 'completed - automatically saved',
                  audioUrl: saveResult.song.audioUrl,
                  title: saveResult.song.title,
                  duration: saveResult.song.duration,
                  endTime: new Date()
                }));
                
                Alert.alert(
                  '🎵 Music Ready!', 
                  `"${saveResult.song.title}" has been automatically added to your library!`,
                  [
                    { text: 'OK' },
                    { 
                      text: 'Play Now', 
                      onPress: () => {
                        if (saveResult.song.audioUrl) {
                          playGeneratedMusic({
                            audio_url: saveResult.song.audioUrl,
                            title: saveResult.song.title,
                            duration: saveResult.song.duration,
                            tags: saveResult.song.tags
                          }, [saveResult.song]);
                        }
                      }
                    }
                  ]
                );
              } else {
                Alert.alert('Save Error', saveResult.error);
              }
            } else {
              setGeneratedMusic(prev => ({
                ...prev,
                status: 'monitoring completed - check webhook manually',
                endTime: new Date()
              }));
              
              Alert.alert(
                'Monitoring Complete',
                result.error || 'Auto-monitoring finished. Check your webhook URL manually or try the manual entry form.'
              );
            }
            
            // Clear monitoring interval
            if (monitoringInterval) {
              clearInterval(monitoringInterval);
              setMonitoringInterval(null);
            }
          }
        );
        
        if (result.success) {
          setTaskId(result.taskId);
          setMonitoringInterval(result.monitoringInterval);
          
          setGeneratedMusic(prev => ({
            ...prev,
            status: 'generating with auto-monitoring active',
            taskId: result.taskId,
            webhookUrl: result.webhookUrl
          }));
          
          Alert.alert(
            '🤖 Auto-Monitoring Started!',
            `Task ID: ${result.taskId}\n\nYour music is being generated and will be automatically added to your library when ready!\n\nThe app will check for results every 30 seconds.`,
            [{ text: 'Great!' }]
          );
        } else {
          throw new Error(result.error);
        }
      } else {
        await generateDemoMusic();
      }
      
    } catch (error) {
      console.error('Auto-monitoring generation error:', error);
      Alert.alert('Generation Error', `Failed to start auto-monitored generation: ${error.message}`);
      setIsLoading(false);
    }
  };

  // Keep original function as fallback
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
            setIsLoading(false);
            return;
          }
        } else {
          if (!style.trim() || !prompt.trim() || !title.trim()) {
            Alert.alert('Invalid Input', 'For lyrical custom mode, style, prompt, and title are required');
            setIsLoading(false);
            return;
          }
        }
      } else {
        if (!prompt.trim()) {
          Alert.alert('Invalid Input', 'Please enter a music prompt');
          setIsLoading(false);
          return;
        }
        if (prompt.length > 400) {
          Alert.alert('Prompt Too Long', 'In non-custom mode, prompt must be under 400 characters');
          setIsLoading(false);
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
      
      // Get webhook URL from environment variable
      const SHARED_WEBHOOK_URL = process.env.EXPO_PUBLIC_WEBHOOK_URL || "https://webhook.site/45baf50a-52ab-4c93-b699-8c358d53b116";

      // Add user identification to webhook URL
      const currentUserId = 'user-' + Date.now();
      const webhookWithParams = `${SHARED_WEBHOOK_URL}?userId=${currentUserId}&ref=${Date.now()}`;

      // Prepare request body based on mode
      const requestBody = {
        model: model,
        customMode: customMode,
        instrumental: instrumental,
        callBackUrl: webhookWithParams
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
              callbackUrl: SHARED_WEBHOOK_URL,
              userId: currentUserId
            }));

            // Save task info
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
              webhookUrl: webhookWithParams
            }));

            Alert.alert(
              '🎵 Generation Started!',
              `Task ID: ${receivedTaskId}\n\nYour music is being generated!\n\n🔗 Results will be sent to:\n${SHARED_WEBHOOK_URL}\n\n⏱️ Results typically arrive in 2-5 minutes.\n\n💡 Monitor the webhook URL for your results, then use "Add Manual Result" to import the audio into the app.`,
              [
                {
                  text: 'Open Webhook.site',
                  onPress: () => {
                    Linking.openURL(SHARED_WEBHOOK_URL);
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

  // Function to handle callback results
  const handleCallbackResults = async (callbackData) => {
    try {
      if (callbackData.callbackType === 'complete' && callbackData.data && callbackData.data.length > 0) {
        const firstTrack = callbackData.data[0];
        if (firstTrack.audio_url) {
          console.log('Music generation complete via callback:', firstTrack);
          await playGeneratedMusic(firstTrack, callbackData.data);
        }
      }
    } catch (error) {
      console.error('Callback handling error:', error);
    }
  };

  const playGeneratedMusic = async (track, allTracks) => {
    try {
      const audioUrl = track.audio_url || track.audioUrl;
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
      endTime: new Date()
    }));

    Alert.alert('📝 Demo Description Generated', 'Add KIE.ai API key to generate real Suno AI music!');
  };

  // Cleanup monitoring on disconnect/stop
  const stopMusic = async () => {
    try {
      // Stop webhook monitoring
      if (monitoringInterval) {
        clearInterval(monitoringInterval);
        setMonitoringInterval(null);
        console.log('🛑 Stopped webhook monitoring');
      }

      if (soundRef.current) {
        await soundRef.current.pauseAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      setIsPlaying(false);

      if (generatedMusic) {
        setGeneratedMusic({
          ...generatedMusic,
          status: 'stopped',
          endTime: new Date()
        });
      }

      Alert.alert('Stopped', 'Music playback and monitoring stopped');
    } catch (error) {
      console.error('Stop error:', error);
    }
  };

  const disconnect = async () => {
    if (isPlaying) {
      await stopMusic();
    }

    if (monitoringInterval) {
      clearInterval(monitoringInterval);
      setMonitoringInterval(null);
    }

    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }

    setIsConnected(false);
    setConnectionStatus('disconnected');
    setGeneratedMusic(null);
    setTaskId(null);
    Alert.alert('Disconnected', 'Disconnected from KIE.ai Suno API');
  };

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

  const checkTaskStatus = async (taskIdToCheck) => {
    const currentTaskId = taskIdToCheck || taskId;
    if (!currentTaskId) {
      Alert.alert('No Task ID', 'No task ID available to check. Generate music first.');
      return;
    }

    try {
      setIsCheckingStatus(true);

      // Get webhook URL from environment
      const SHARED_WEBHOOK_URL = process.env.EXPO_PUBLIC_WEBHOOK_URL || "https://webhook.site/45baf50a-52ab-4c93-b699-8c358d53b116";

      // Retrieve stored task info
      const storedTaskInfo = await AsyncStorage.getItem(`task_${currentTaskId}`);
      const taskMetadata = storedTaskInfo ? JSON.parse(storedTaskInfo) : {};
      const actualWebhookUrl = taskMetadata.webhookUrl || SHARED_WEBHOOK_URL;

      Alert.alert(
        'Important: Callback System',
        `KIE.ai uses callbacks, not polling.\n\nTask ID: ${currentTaskId}\n\nResults are sent to the callback URL when generation completes. You need to check the webhook URL yourself.\n\nOpen this URL in your browser:\n${actualWebhookUrl}`,
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
    if (!startTime || !endTime) return '0:00';
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
            onPress={() => router.back()}
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
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#f5f5f5' }}>
        <View style={styles.backButtonContainer}>
          <TouchableOpacity
            style={styles.backButtonStyle}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#6366f1" />
            <Text style={styles.backButtonText}>Back to Collaborate</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <View style={styles.header}>
        <Text style={styles.title}>Create Music</Text>
      </View>

      {!kieApiKey && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Get Started</Text>
          <TouchableOpacity style={[styles.button, styles.infoButton]} onPress={openKieGuide}>
            <Ionicons name="information-circle" size={20} color="white" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Get KIE.ai API Key for Real Music</Text>
          </TouchableOpacity>
        </View>
      )}

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
        <View style={styles.inputGroup}>
          <Text style={styles.label}>AI Model</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['V3_5', 'V4', 'V4_5'].map((modelName) => (
              <TouchableOpacity
                key={modelName}
                style={[styles.quickPrompt, model === modelName && styles.activePrompt]}
                onPress={() => setModel(modelName)}
                disabled={isLoading}
              >
                <Text style={[styles.quickPromptText, model === modelName && styles.activePromptText]}>
                  {modelName}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {!customMode ? (
          // Simple mode - only prompt
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Music Prompt (max 400 chars)</Text>
            <TextInput
              style={styles.textInput}
              value={prompt}
              onChangeText={setPrompt}
              placeholder="Describe the music you want to create"
              multiline={true}
              numberOfLines={3}
              maxLength={400}
              editable={!isLoading}
            />
            <Text style={styles.charCount}>{prompt.length}/400</Text>
          </View>
        ) : (
          // Custom mode - style, title, and optionally prompt
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Style ({model === 'V4_5' ? 'max 1000' : 'max 200'} chars)</Text>
              <TextInput
                style={styles.textInput}
                value={style}
                onChangeText={setStyle}
                placeholder="electronic, energetic, upbeat"
                maxLength={model === 'V4_5' ? 1000 : 200}
                editable={!isLoading}
              />
              <Text style={styles.charCount}>{style.length}/{model === 'V4_5' ? 1000 : 200}</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title (max 80 chars)</Text>
              <TextInput
                style={styles.numberInput}
                value={title}
                onChangeText={setTitle}
                placeholder="My Awesome Track"
                maxLength={80}
                editable={!isLoading}
              />
              <Text style={styles.charCount}>{title.length}/80</Text>
            </View>

            {!instrumental && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Lyrics Prompt ({model === 'V4_5' ? 'max 5000' : 'max 3000'} chars)</Text>
                <TextInput
                  style={styles.textInput}
                  value={prompt}
                  onChangeText={setPrompt}
                  placeholder="Lyrics or vocal description"
                  multiline={true}
                  numberOfLines={4}
                  maxLength={model === 'V4_5' ? 5000 : 3000}
                  editable={!isLoading}
                />
                <Text style={styles.charCount}>{prompt.length}/{model === 'V4_5' ? 5000 : 3000}</Text>
              </View>
            )}
          </>
        )}

        <TouchableOpacity
          style={[styles.button, isPlaying ? styles.stopButton : styles.playButton]}
          onPress={isPlaying ? stopMusic : generateWithAutoMonitoring}
          disabled={!isConnected || isLoading}
        >
          {isLoading ? (
            <>
              <ActivityIndicator color="white" size="small" style={{ marginRight: 8 }} />
              <Text style={styles.buttonText}>
                {kieApiKey ? 'Auto-Generating...' : 'Generating Description...'}
              </Text>
            </>
          ) : (
            <>
              <Ionicons 
                name={isPlaying ? "stop" : (kieApiKey ? "musical-notes" : "document-text")} 
                size={20} 
                color="white" 
                style={styles.buttonIcon}
              />
              <Text style={styles.buttonText}>
                {isPlaying ? 'Stop Music' : 
                kieApiKey ? '🤖 Auto-Generate Music' : '📝 Generate Description'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Generation Status */}
      {generatedMusic && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Generated Music</Text>
          <View style={styles.generationInfo}>
            <Text style={styles.infoLabel}>Mode:</Text>
            <Text style={styles.infoValue}>
              {generatedMusic.customMode ? 'Custom' : 'Simple'} - {generatedMusic.instrumental ? 'Instrumental' : 'With Lyrics'}
            </Text>

            <Text style={styles.infoLabel}>Model:</Text>
            <Text style={styles.infoValue}>{generatedMusic.model}</Text>

            {generatedMusic.customMode && (
              <>
                <Text style={styles.infoLabel}>Style:</Text>
                <Text style={styles.infoValue}>{generatedMusic.style}</Text>
                
                <Text style={styles.infoLabel}>Title:</Text>
                <Text style={styles.infoValue}>{generatedMusic.title}</Text>
              </>
            )}

            {(!generatedMusic.customMode || !generatedMusic.instrumental) && (
              <>
                <Text style={styles.infoLabel}>Prompt:</Text>
                <Text style={styles.infoValue}>{generatedMusic.prompt}</Text>
              </>
            )}
            
            <Text style={styles.infoLabel}>Status:</Text>
            <Text style={[styles.infoValue, { 
              color: generatedMusic.status.includes('real Suno AI music') ? '#8b5cf6' : 
                    generatedMusic.status.includes('demo') ? '#FF9800' : 
                    generatedMusic.status.includes('generating') || generatedMusic.status.includes('callback') ? '#f59e0b' : '#4CAF50' 
            }]}>
              {generatedMusic.status}
            </Text>
            
            {generatedMusic.taskId && (
              <>
                <Text style={styles.infoLabel}>Task ID:</Text>
                <Text style={styles.infoValue}>{generatedMusic.taskId}</Text>
                
                {generatedMusic.webhookUrl && (
                  <>
                    <Text style={styles.infoLabel}>Webhook URL:</Text>
                    <Text style={[styles.infoValue, { color: '#3b82f6', fontSize: 12 }]}>
                      {generatedMusic.webhookUrl}
                    </Text>
                    <Text style={[styles.infoValue, { fontStyle: 'italic', fontSize: 12 }]}>
                      ↗ Check this URL for results when generation completes
                    </Text>
                  </>
                )}
                
                <TouchableOpacity 
                  style={[styles.button, styles.checkButton]} 
                  onPress={() => checkTaskStatus(generatedMusic.taskId)}
                  disabled={isCheckingStatus}
                >
                  {isCheckingStatus ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <Ionicons name="information-circle" size={16} color="white" style={styles.buttonIcon} />
                      <Text style={[styles.buttonText, { fontSize: 14 }]}>About Callback System</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
            
            {generatedMusic.title && generatedMusic.audioUrl && (
              <>
                <Text style={styles.infoLabel}>Track Title:</Text>
                <Text style={styles.infoValue}>{generatedMusic.title}</Text>
              </>
            )}

            {generatedMusic.tags && (
              <>
                <Text style={styles.infoLabel}>Tags:</Text>
                <Text style={styles.infoValue}>{generatedMusic.tags}</Text>
              </>
            )}

            {generatedMusic.duration && (
              <>
                <Text style={styles.infoLabel}>Duration:</Text>
                <Text style={styles.infoValue}>{Math.round(generatedMusic.duration)}s</Text>
              </>
            )}

            {generatedMusic.totalTracks && (
              <>
                <Text style={styles.infoLabel}>Generated Tracks:</Text>
                <Text style={styles.infoValue}>
                  {generatedMusic.totalTracks} variations (playing track {generatedMusic.currentTrack})
                </Text>
              </>
            )}
            
            {generatedMusic.audioUrl && (
              <>
                <Text style={styles.infoLabel}>Suno AI Audio:</Text>
                <Text style={[styles.infoValue, { color: '#4CAF50' }]}>✅ Professional Quality Generated</Text>
              </>
            )}
            
            {generatedMusic.description && (
              <>
                <Text style={styles.infoLabel}>AI Description:</Text>
                <ScrollView style={styles.descriptionContainer} nestedScrollEnabled>
                  <Text style={styles.infoValueDescription}>{generatedMusic.description}</Text>
                </ScrollView>
              </>
            )}
            
            {generatedMusic.endTime && (
              <>
                <Text style={styles.infoLabel}>Generation Time:</Text>
                <Text style={styles.infoValue}>
                  {formatDuration(generatedMusic.startTime, generatedMusic.endTime)}
                </Text>
              </>
            )}
          </View>
        </View>
      )}

      {/* Quick Prompts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Prompts</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            'upbeat electronic dance music', 
            'calm ambient soundscape', 
            'energetic rock anthem', 
            'smooth jazz with piano', 
            'epic orchestral cinematic',
            'lo-fi hip hop beats',
            'acoustic folk melody',
            'synthwave retro vibes'
          ].map((quickPrompt) => (
            <TouchableOpacity
              key={quickPrompt}
              style={[styles.quickPrompt, prompt === quickPrompt && styles.activePrompt]}
              onPress={() => setPrompt(quickPrompt)}
              disabled={isLoading}
            >
              <Text style={[styles.quickPromptText, prompt === quickPrompt && styles.activePromptText]}>
                {quickPrompt}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Quick Styles (for custom mode) */}
      {customMode && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Styles</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              'electronic, energetic, upbeat',
              'acoustic, calm, peaceful',
              'rock, powerful, driving',
              'jazz, smooth, sophisticated', 
              'classical, elegant, dramatic',
              'ambient, atmospheric, ethereal',
              'hip-hop, rhythmic, modern',
              'folk, organic, heartfelt'
            ].map((quickStyle) => (
              <TouchableOpacity
                key={quickStyle}
                style={[styles.quickPrompt, style === quickStyle && styles.activePrompt]}
                onPress={() => setStyle(quickStyle)}
                disabled={isLoading}
              >
                <Text style={[styles.quickPromptText, style === quickStyle && styles.activePromptText]}>
                  {quickStyle}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </ScrollView>
  </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  backButtonContainer: {
    paddingHorizontal: 20,
    paddingTop: 10, // Reduced since SafeAreaView handles the top spacing
    paddingBottom: 5,
    backgroundColor: '#f5f5f5',
  },
  backButtonStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  backButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  header: {
    backgroundColor: '#6366f1',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  section: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  apiStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  apiStatusText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    marginTop: 8,
  },
  connectButton: {
    backgroundColor: '#10b981',
  },
  disconnectButton: {
    backgroundColor: '#ef4444',
  },
  playButton: {
    backgroundColor: '#8b5cf6',
  },
  stopButton: {
    backgroundColor: '#f59e0b',
  },
  infoButton: {
    backgroundColor: '#3b82f6',
  },
  creditsButton: {
    backgroundColor: '#6b7280',
    padding: 10,
  },
  checkButton: {
    backgroundColor: '#10b981',
    padding: 10,
    marginTop: 8,
  },
  manualButton: {
    backgroundColor: '#6b7280',
    padding: 10,
    marginTop: 8,
  },
  clearButton: {
    backgroundColor: '#ef4444',
    padding: 10,
    marginTop: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  instrumentalContainer: {
    flexDirection: 'row',
    marginTop: 12,
  },
  modeButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f3f4f6',
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeModeButton: {
    backgroundColor: '#6366f1',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeModeButtonText: {
    color: 'white',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  numberInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  charCount: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
    marginTop: 4,
  },
  quickPrompt: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    minWidth: 100,
  },
  activePrompt: {
    backgroundColor: '#6366f1',
  },
  quickPromptText: {
    color: '#6b7280',
    fontSize: 12,
    textAlign: 'center',
  },
  activePromptText: {
    color: 'white',
  },
  generationInfo: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 8,
  },
  infoValue: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  descriptionContainer: {
    maxHeight: 200,
    marginBottom: 8,
  },
  infoValueDescription: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
  },
  callbackInfo: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  callbackInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 4,
    marginTop: 8,
  },
  callbackInfoText: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 16,
    marginBottom: 8,
  },
  infoText: {
    color: '#6b7280',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 8,
  },
  infoTextSmall: {
    color: '#9ca3af',
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 4,
  },
});