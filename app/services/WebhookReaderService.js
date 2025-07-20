// Service to automatically read webhook.site results
import AsyncStorage from '@react-native-async-storage/async-storage';

class WebhookReaderService {
  static WEBHOOK_TOKEN_KEY = 'webhook_token';
  static CHECK_INTERVAL = 30000; // Check every 30 seconds

  static extractWebhookToken(webhookUrl) {
    const match = webhookUrl.match(/webhook\.site\/([a-f0-9-]+)/);
    return match ? match[1] : null;
  }

  static async startMonitoring(webhookUrl, taskId, onResultFound) {
    const token = this.extractWebhookToken(webhookUrl);
    if (!token) {
      console.error('Invalid webhook URL:', webhookUrl);
      return null;
    }

    console.log('🔍 Starting webhook monitoring for token:', token);
    console.log('🔍 Looking for task ID:', taskId);

    const maxChecks = 20;
    let checkCount = 0;
    let completeCallbackSeen = false;

    const checkInterval = setInterval(async () => {
      checkCount++;

      try {
        console.log(`📡 Checking webhook (${checkCount}/${maxChecks}) for task:`, taskId);

        const response = await fetch(`https://webhook.site/token/${token}/requests?limit=100`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        });

        if (!response.ok) {
          console.log('❌ Failed to fetch webhook data:', response.status);
          return;
        }

        const data = await response.json();
        console.log(`📋 Found ${data.data?.length || 0} webhook requests`);

        for (let index = 0; index < (data.data?.length || 0); index++) {
          const request = data.data[index];
          try {
            let raw = request.content ?? request.body ?? request.text_content ?? '';
            if (typeof raw !== 'string') raw = JSON.stringify(raw);

            let parsed;
            try {
              parsed = JSON.parse(raw);
            } catch (err) {
              console.log(`❌ JSON parse failed on request ${index}:`, err.message);
              continue;
            }

            const callbackType = parsed?.data?.callbackType;
            const taskIdFromData = parsed?.data?.task_id;
            const taskIdFromRoot = parsed?.task_id;

            const matched = [taskIdFromData, taskIdFromRoot].includes(taskId);
            console.log(`  📥 Req ${index}: callback="${callbackType}" task_id="${taskIdFromData}" matched=${matched}`);

            if (!matched) continue;

            if (callbackType === 'text') {
              console.log('📝 Text callback received - continuing to monitor...');
              continue;
            }

            if (callbackType === 'first') {
              console.log('👀 First callback received - still waiting for complete...');
              continue;
            }

            if (callbackType === 'complete') {
              if (!completeCallbackSeen) {
                completeCallbackSeen = true;
                console.log('🎯 Complete callback received - finishing up');
                onResultFound(parsed, taskId);
                clearInterval(checkInterval);
              }
              return;
            }

            console.log(`⚠️ Unknown callbackType "${callbackType}" - ignoring`);
          } catch (err) {
            console.log(`❌ Error parsing request ${index}:`, err.message);
          }
        }

        console.log('❌ No matching request found for task:', taskId);
      } catch (err) {
        console.log('🔍 Webhook check error:', err.message);
      }

      if (checkCount >= maxChecks) {
        console.log('⏰ Webhook monitoring timeout for task:', taskId);
        clearInterval(checkInterval);
        onResultFound(null, taskId, 'Monitoring timeout - check webhook manually');
      }
    }, this.CHECK_INTERVAL);

    return checkInterval;
  }

  
  // Enhanced generation function with auto-monitoring
  static async generateWithAutoMonitoring(generationParams, kieApiKey, onComplete, fileStorageService = null) {
    try {
      // Get webhook URL from environment
      const webhookUrl = process.env.EXPO_PUBLIC_WEBHOOK_URL || "https://webhook.site/45baf50a-52ab-4c93-b699-8c358d53b116";
      
      if (!webhookUrl) {
        throw new Error('No webhook URL configured');
      }
      
      // Add user/task identification
      const currentUserId = 'user-' + Date.now();
      const webhookWithParams = `${webhookUrl}?userId=${currentUserId}&ref=${Date.now()}`;
      
      // Prepare generation request
      const requestBody = {
        model: generationParams.model,
        customMode: generationParams.customMode,
        instrumental: generationParams.instrumental,
        callBackUrl: webhookWithParams
      };
      
      if (generationParams.customMode) {
        requestBody.style = generationParams.style;
        requestBody.title = generationParams.title;
        if (!generationParams.instrumental) {
          requestBody.prompt = generationParams.prompt;
        }
      } else {
        requestBody.prompt = generationParams.prompt;
      }
      
      console.log('🚀 Starting generation with auto-monitoring...');
      console.log('🔗 Webhook URL:', webhookWithParams);
      
      // Call KIE.ai API
      const response = await fetch('https://api.kie.ai/api/v1/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${kieApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error(`Generation failed: ${response.status}`);
      }
      
      const data = await response.json();
      const taskId = data.data?.taskId || data.data?.task_id || data.data?.id;
      
      if (!taskId) {
        throw new Error('No task ID received from API');
      }
      
      console.log('✅ Generation started, task ID:', taskId);
      
      // Save task info
      await AsyncStorage.setItem(`task_${taskId}`, JSON.stringify({
        userId: currentUserId,
        taskId: taskId,
        prompt: generationParams.prompt,
        style: generationParams.style,
        title: generationParams.title,
        model: generationParams.model,
        customMode: generationParams.customMode,
        instrumental: generationParams.instrumental,
        startTime: Date.now(),
        webhookUrl: webhookWithParams
      }));
      
      // Start automatic monitoring
      const monitoringInterval = await this.startMonitoring(
        webhookUrl,
        taskId,
        async (webhookData, taskId, error) => {
          if (error) {
            onComplete({ success: false, error, taskId, webhookUrl });
          } else if (webhookData) {
            // Check if this is just a text callback (track started)
            const callbackType = webhookData.data?.callbackType;
            
            if (callbackType === 'text') {
              console.log('📝 Text callback received - track generation started, continuing to monitor...');
              // Don't complete yet, keep monitoring for 'first' or 'complete'
              return;
            }
            
            // For 'first' or 'complete' callbacks, process and potentially complete
            if (fileStorageService) {
              try {
                const result = await this.processWebhookResult(webhookData, taskId, fileStorageService);
                if (result.success && result.song) {
                  onComplete({ 
                    success: true, 
                    taskId, 
                    webhookUrl, 
                    webhookData,
                    song: result.song,
                    message: 'Music generation completed automatically!'
                  });
                } else {
                  onComplete({ success: false, error: result.error || 'Processing failed', taskId, webhookUrl });
                }
              } catch (err) {
                onComplete({ success: false, error: err.message, taskId, webhookUrl });
              }
            } else {
              // No fileStorageService provided, just return the webhook data
              onComplete({ 
                success: true, 
                taskId, 
                webhookUrl, 
                webhookData,
                message: 'Music generation completed - webhook data received!'
              });
            }
          }
        }
      );
      
      // Return initial success with monitoring info
      return {
        success: true,
        taskId,
        webhookUrl,
        monitoringInterval,
        message: 'Generation started with automatic monitoring...'
      };
      
    } catch (error) {
      console.error('Auto-monitoring generation error:', error);
      return { success: false, error: error.message };
    }
  }
  
  // FIXED: Process webhook result and save to library with KIE.ai's exact format
  static async processWebhookResult(webhookData, taskId, fileStorageService) {
    try {
      console.log('🎵 [NEW VERSION] Processing webhook result for task:', taskId);
      console.log('🔍 Webhook data TYPE:', typeof webhookData);
      console.log('📦 Full webhook data structure:', JSON.stringify(webhookData, null, 2));
      
      if (!webhookData) {
        console.log('❌ Webhook data is null or undefined');
        throw new Error('Webhook data is null or undefined');
      }
      
      console.log('🔍 Webhook top-level keys:', Object.keys(webhookData));
      console.log('🔍 Webhook.code:', webhookData.code);
      console.log('🔍 Webhook.data type:', typeof webhookData.data);
      
      if (webhookData.data) {
        console.log('🔍 Webhook.data keys:', Object.keys(webhookData.data));
        console.log('🔍 Webhook.data.callbackType:', webhookData.data.callbackType);
        console.log('🔍 Webhook.data.data type:', typeof webhookData.data.data);
        console.log('🔍 Webhook.data.data isArray:', Array.isArray(webhookData.data.data));
        if (Array.isArray(webhookData.data.data)) {
          console.log('🔍 Webhook.data.data length:', webhookData.data.data.length);
        }
      }
      
      // Handle KIE.ai's specific format - UPDATED to handle all callback types
      let trackData = null;
      let allTracks = [];
      
      // KIE.ai Format: {code: 200, data: {callbackType: "text|first|complete", data: [...], task_id: "..."}, msg: "..."}
      if (webhookData.code === 200 && webhookData.data && webhookData.data.callbackType) {
        
        const callbackType = webhookData.data.callbackType;
        console.log(`✅ Matched KIE.ai ${callbackType} format structure`);
        
        if (Array.isArray(webhookData.data.data)) {
          // For "text" callback, there might be no audio_url yet
          if (callbackType === 'text') {
            console.log('📝 Text callback received - track started generating');
            // Still try to find tracks, but don't require audio_url
            const tracks = webhookData.data.data;
            if (tracks.length > 0) {
              trackData = tracks[0];
              allTracks = tracks;
              console.log(`✅ Found KIE.ai text format with ${tracks.length} tracks (audio may not be ready yet)`);
            }
          } else {
            // For "first" and "complete" callbacks, filter for tracks with audio_url
            const completeTracks = webhookData.data.data.filter(track => {
              const hasAudio = track.audio_url && track.audio_url !== "";
              console.log(`🔍 Track ${track.id}: audio_url = ${hasAudio ? 'present' : 'missing'}`);
              return hasAudio;
            });
            
            console.log(`🔍 Found ${completeTracks.length} complete tracks out of ${webhookData.data.data.length} total`);
            
            if (completeTracks.length > 0) {
              trackData = completeTracks[0]; // Use first complete track
              allTracks = completeTracks;
              console.log(`✅ Found KIE.ai ${callbackType} format with ${completeTracks.length} complete tracks`);
            } else if (callbackType === 'first') {
              console.log('⚠️ First callback found but no tracks with audio_url yet - will wait for complete callback');
              throw new Error('First callback received but no complete tracks available yet');
            } else {
              console.log('❌ No tracks with audio_url found in complete callback');
              throw new Error('No tracks with audio_url found in complete callback');
            }
          }
        }
      }
      // Fallback: try the old formats in case structure changes
      else if (webhookData.callbackType === 'complete' && Array.isArray(webhookData.data)) {
        console.log('✅ Matched direct callback format');
        const completeTracks = webhookData.data.filter(track => track.audio_url && track.audio_url !== "");
        if (completeTracks.length > 0) {
          trackData = completeTracks[0];
          allTracks = completeTracks;
          console.log('✅ Found direct callback format');
        }
      }
      else {
        console.error('❌ Unrecognized webhook format');
        console.log('🔍 Expected: {code: 200, data: {callbackType: "complete", data: [...], task_id: "..."}}');
        console.log('🔍 Received structure:');
        console.log('  - code:', webhookData.code);
        console.log('  - data:', !!webhookData.data);
        console.log('  - data.callbackType:', webhookData.data?.callbackType);
        console.log('  - data.data type:', Array.isArray(webhookData.data?.data) ? `array[${webhookData.data.data.length}]` : typeof webhookData.data?.data);
        
        throw new Error(`NEW VERSION: Unrecognized webhook format. Expected KIE.ai callback structure but got different format.`);
      }
      
      if (!trackData) {
        console.log('❌ No valid track data found after parsing');
        throw new Error('No valid track data found after parsing');
      }
      
      // For text callbacks, we might not have audio_url yet
      const callbackType = webhookData.data?.callbackType;
      if (callbackType === 'text' && !trackData.audio_url) {
        console.log('📝 Text callback processed - track started, will wait for audio to be ready');
        return { 
          success: true, 
          isTextCallback: true, 
          message: 'Track generation started - waiting for audio...',
          trackData,
          callbackType 
        };
      }
      
      if (!trackData.audio_url) {
        console.error('❌ Track data found but no audio_url property');
        console.log('🔍 Track data keys:', Object.keys(trackData));
        throw new Error(`Track data found but missing audio_url. Available keys: ${Object.keys(trackData).join(', ')}`);
      }
      
      console.log('🎵 Track data found:', {
        title: trackData.title || 'No title',
        audio_url: `✅ ${trackData.audio_url.substring(0, 60)}...`,
        duration: trackData.duration || 'No duration',
        tags: trackData.tags || 'No tags',
        id: trackData.id,
        model: trackData.model_name
      });
      
      // Get stored task info
      const taskInfo = await AsyncStorage.getItem(`task_${taskId}`);
      if (!taskInfo) {
        console.warn('⚠️ Task info not found in storage, using defaults');
      }
      
      const parsedTaskInfo = taskInfo ? JSON.parse(taskInfo) : {};
      
      // Create song object with KIE.ai track data
      const song = {
        id: Date.now().toString(),
        taskId: taskId,
        title: trackData.title || parsedTaskInfo.title || 'Auto-Generated Track',
        audioUrl: trackData.audio_url,
        duration: trackData.duration || 180,
        prompt: parsedTaskInfo.prompt || trackData.prompt || 'Auto-imported',
        style: parsedTaskInfo.style || '',
        genre: 'AI Generated',
        mood: 'various',
        model: trackData.model_name || parsedTaskInfo.model || 'V4',
        tags: trackData.tags || 'ai-generated, auto-imported',
        createdAt: new Date().toISOString(),
        customMode: parsedTaskInfo.customMode || false,
        instrumental: parsedTaskInfo.instrumental || true,
      };
      
      console.log('💾 Saving song to library:', song.title);
      
      // Save to library
      await fileStorageService.addSong(song);
      
      // Clean up task storage
      if (taskInfo) {
        await AsyncStorage.removeItem(`task_${taskId}`);
        console.log('🧹 Cleaned up task storage');
      }
      
      console.log('🎵 Song automatically saved to library:', song.title);
      return { success: true, song, allTracks };
      
    } catch (error) {
      console.error('❌ [NEW VERSION] Error processing webhook result:', error);
      console.error('❌ Error details:', error.message);
      console.error('❌ Error stack:', error.stack);
      return { success: false, error: error.message };
    }
  }
}

export default WebhookReaderService;