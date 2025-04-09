import React, { useState, useEffect, useRef } from 'react';
import './YouTubePodcast.css';

const YouTubePodcast = () => {
  // State for UI and basic playback
  const [currentTechnoTrack, setCurrentTechnoTrack] = useState(0);
  const [isTechnoPlaying, setIsTechnoPlaying] = useState(false);
  const [technoVolume, setTechnoVolume] = useState(0.5);
  const [technoSpeed, setTechnoSpeed] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Add state for audio playback time tracking
  const [audioTime, setAudioTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  
  // YouTube player state
  const [playerInstance, setPlayerInstance] = useState(null);
  const [videoTime, setVideoTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const playerInitialized = useRef(false);
  const progressIntervalRef = useRef(null);
  
  // Create audio reference
  const audioRef = useRef(new Audio());
  
  // Replace the hardcoded videoId with state variable
  const [videoId, setVideoId] = useState('CH-6jEGG89Y'); // Default as fallback
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [videoTitle, setVideoTitle] = useState('');
  
  // Updated track data with actual song files from the audio folder
  const tracks = [
    { name: "Live at Boxpac", artist: "Disco Lines", file: "/audio/Disco Lines | Live at Boxpac.mp3" },
    { name: "Boiler Room Berlin", artist: "Estella Boersma", file: "/audio/Estella Boersma | Boiler Room Festival Berlin.mp3" },
    { name: "Berlin Deep House Mix", artist: "Chris Luno", file: "/audio/Chris Luno | Berlin Deep House Mix.mp3" },
    { name: "PARTYGIRL Ibiza", artist: "Charli XCX", file: "/audio/Charli XCX | PARTYGIRL Ibiza.mp3" },
    { name: "Home Depot Beat", artist: "Anonymous", file: "/audio/Home Depot Beat.mp3" }
  ];
  
  // Add this state variable near the top with your other state variables
  const [videoSpeed, setVideoSpeed] = useState(1);
  
  // Add this state near the top with other state declarations
  const [trackDurations, setTrackDurations] = useState({});
  
  // Add this useEffect to load durations of all tracks
  useEffect(() => {
    // Function to get duration of an audio file
    const getAudioDuration = (url) => {
      return new Promise((resolve) => {
        const audio = new Audio(url);
        
        const handleLoaded = () => {
          const duration = audio.duration;
          audio.remove(); // Cleanup
          resolve(duration);
        };
        
        const handleError = () => {
          console.error(`Error loading duration for: ${url}`);
          audio.remove(); // Cleanup
          resolve(0);
        };
        
        audio.addEventListener('loadedmetadata', handleLoaded);
        audio.addEventListener('error', handleError);
        
        // Set a timeout in case loading takes too long
        setTimeout(() => {
          audio.remove();
          resolve(0);
        }, 5000);
      });
    };

    // Load durations for all tracks
    const loadDurations = async () => {
      try {
        const durationPromises = tracks.map((track, index) => 
          getAudioDuration(track.file)
            .then(duration => [index, duration])
        );
        
        const durations = {};
        const results = await Promise.all(durationPromises);
        
        results.forEach(([index, duration]) => {
          durations[index] = duration;
        });
        
        setTrackDurations(durations);
      } catch (error) {
        console.error('Error loading track durations:', error);
      }
    };

    loadDurations();
  }, []); // Run once when component mounts
  
  // Add this useEffect to fetch Bloomberg videos
  useEffect(() => {
    const fetchBloombergVideo = async () => {
      try {
        console.log('Fetching Bloomberg Tech videos...');
        setIsVideoLoading(true);
        
        // First, get the most recent videos from the channel
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/search?` +
          `key=${process.env.REACT_APP_YOUTUBE_API_KEY}` +
          `&channelId=UCrM7B7SL_g1edFOnmj-SDKg` +
          `&part=snippet` +
          `&order=date` +
          `&type=video` +
          `&maxResults=10`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch videos');
        }
        
        const data = await response.json();
        console.log('Fetched videos:', data);
        
        if (!data.items || data.items.length === 0) {
          throw new Error('No videos found');
        }
        
        // Get the video IDs to check their duration
        const videoIds = data.items.map(item => item.id.videoId).join(',');
        
        // Get video details including duration
        const detailsResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?` +
          `key=${process.env.REACT_APP_YOUTUBE_API_KEY}` +
          `&id=${videoIds}` +
          `&part=contentDetails,snippet`
        );
        
        if (!detailsResponse.ok) {
          throw new Error('Failed to fetch video details');
        }
        
        const detailsData = await detailsResponse.json();
        console.log('Video details:', detailsData);
        
        // Find the first video longer than 30 minutes
        let foundLongVideo = false;
        
        for (const video of data.items) {
          const videoDetails = detailsData.items.find(item => item.id === video.id.videoId);
          
          if (videoDetails) {
            // Parse ISO 8601 duration (PT1H20M30S format)
            const duration = videoDetails.contentDetails.duration;
            const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
            
            if (match) {
              const hours = parseInt(match[1] || 0);
              const minutes = parseInt(match[2] || 0);
              const seconds = parseInt(match[3] || 0);
              
              // Calculate total minutes
              const totalMinutes = hours * 60 + minutes + seconds / 60;
              
              console.log(`Video ${video.id.videoId}: ${totalMinutes} minutes`);
              
              // Check if video is at least 30 minutes
              if (totalMinutes >= 30) {
                console.log(`Found video longer than 30 minutes: ${video.snippet.title}`);
                setVideoId(video.id.videoId);
                setVideoTitle(video.snippet.title);
                foundLongVideo = true;
                break;
              }
            }
          }
        }
        
        // If no video is longer than 30 minutes, use the most recent one
        if (!foundLongVideo && data.items.length > 0) {
          console.log('No videos longer than 30 minutes, using most recent');
          setVideoId(data.items[0].id.videoId);
          setVideoTitle(data.items[0].snippet.title);
        }
        
        setIsVideoLoading(false);
      } catch (error) {
        console.error('Error fetching Bloomberg videos:', error);
        // Keep using default video
        setIsVideoLoading(false);
      }
    };
    
    fetchBloombergVideo();
  }, []); // Run once on component mount
  
  // Initialize YouTube API
  useEffect(() => {
    if (!videoId || isVideoLoading) return;
    
    // Clear any existing player
    if (playerInstance) {
      playerInstance.destroy();
      setPlayerInstance(null);
    }
    
    // Reset flags
    playerInitialized.current = false;
    
    // Create script tag if it doesn't exist
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
    
    // Define the initialization function
    const initPlayer = () => {
      // Make sure the element exists before initializing
      if (!document.getElementById('youtube-embed')) {
        console.log('YouTube embed element not found, trying again in 100ms');
        setTimeout(initPlayer, 100);
        return;
      }
      
      console.log('Initializing YouTube player for video:', videoId);
      try {
        const newPlayer = new window.YT.Player('youtube-embed', {
          videoId: videoId,
          playerVars: {
            'autoplay': 0,
            'controls': 0,
            'modestbranding': 1,
            'rel': 0,
            'showinfo': 0,
            'fs': 0,
            'playsinline': 1,
            'color': 'white',
            'enablejsapi': 1,
            'origin': window.location.origin,
            'iv_load_policy': 3,
          },
          events: {
            'onReady': (event) => {
              console.log('Player ready');
              setPlayerInstance(event.target);
              setVideoDuration(event.target.getDuration());
              setVideoTime(event.target.getCurrentTime());
              playerInitialized.current = true;
            },
            'onStateChange': (event) => {
              console.log('Player state changed:', event.data);
              
              if (event.data === window.YT.PlayerState.PLAYING) {
                console.log('YouTube is now playing, syncing audio');
                setIsPlaying(true);
                
                // Ensure audio plays when video plays
                const audio = audioRef.current;
                if (!audio.playing && audio.paused) {
                  audio.play()
                    .then(() => {
                      setIsTechnoPlaying(true);
                    })
                    .catch(err => console.error("Couldn't play audio:", err));
                }
              } 
              else if (event.data === window.YT.PlayerState.PAUSED) {
                console.log('YouTube is now paused, pausing audio');
                setIsPlaying(false);
                
                // Ensure audio pauses when video pauses
                const audio = audioRef.current;
                audio.pause();
                setIsTechnoPlaying(false);
              }
              else if (event.data === window.YT.PlayerState.ENDED) {
                console.log('YouTube ended, pausing audio');
                setIsPlaying(false);
                
                // Ensure audio pauses when video ends
                const audio = audioRef.current;
                audio.pause();
                setIsTechnoPlaying(false);
              }
            },
            'onError': (event) => {
              console.error('Player error:', event.data);
            }
          }
        });
      } catch (error) {
        console.error("Error initializing YouTube player:", error);
        // Try again after a delay
        setTimeout(initPlayer, 1000);
      }
    };
    
    // Check if YT API is already loaded
    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      // Set up global callback for when API loads
      window.onYouTubeIframeAPIReady = initPlayer;
    }
    
    // Clean up
    return () => {
      if (playerInstance) {
        playerInstance.destroy();
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [videoId, isVideoLoading]);
  
  // Initialize audio
  useEffect(() => {
    const audio = audioRef.current;
    
    // Set initial track
    audio.src = tracks[currentTechnoTrack].file;
    audio.volume = technoVolume;
    
    // Add event listeners for audio
    const handleTimeUpdate = () => {
      setAudioTime(audio.currentTime);
    };
    
    const handleDurationChange = () => {
      setAudioDuration(audio.duration);
    };
    
    const handleEnded = () => {
      setIsTechnoPlaying(false);
    };
    
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    
    // Cleanup
    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);
  
  // Update progress every second when playing
  useEffect(() => {
    if (isPlaying && playerInstance) {
      // Clear any existing interval first
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      
      // Set up a new interval
      progressIntervalRef.current = setInterval(() => {
        try {
          if (playerInstance && playerInstance.getCurrentTime) {
            const currentTime = playerInstance.getCurrentTime();
            setVideoTime(currentTime);
          }
        } catch (error) {
          console.error("Error getting current time:", error);
        }
      }, 500); // More frequent updates for smoother progress
    } else if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isPlaying, playerInstance]);
  
  // Handle track changes
  useEffect(() => {
    const audio = audioRef.current;
    const wasPlaying = isTechnoPlaying;
    
    // Update audio source when track changes
    audio.src = tracks[currentTechnoTrack].file;
    audio.load();
    
    if (wasPlaying) {
      audio.play().catch(err => console.error("Couldn't play audio:", err));
    }
  }, [currentTechnoTrack]);
  
  // Handle playback speed changes
  useEffect(() => {
    audioRef.current.playbackRate = technoSpeed;
  }, [technoSpeed]);
  
  // Handle volume changes
  useEffect(() => {
    audioRef.current.volume = technoVolume;
  }, [technoVolume]);
  
  // Video player state change handler
  const onPlayerStateChange = (event) => {
    if (event.data === window.YT.PlayerState.PLAYING) {
      setIsPlaying(true);
    } 
    else if (event.data === window.YT.PlayerState.PAUSED) {
      setIsPlaying(false);
    }
    else if (event.data === window.YT.PlayerState.ENDED) {
      setIsPlaying(false);
    }
  };
  
  // Improved togglePlayPause function
  const togglePlayPause = () => {
    if (!playerInstance) {
      console.error("Player instance not available");
      return;
    }
    
    try {
      // Toggle YouTube video state
      if (isPlaying) {
        playerInstance.pauseVideo();
      } else {
        playerInstance.playVideo();
      }
      
      // Also toggle the techno audio
      const audio = audioRef.current;
      if (isPlaying) {
        audio.pause();
        setIsTechnoPlaying(false);
      } else {
        audio.play()
          .then(() => {
            setIsTechnoPlaying(true);
          })
          .catch(err => console.error("Couldn't play audio:", err));
      }
    } catch (error) {
      console.error("Error toggling play state:", error);
    }
  };
  
  const handleVideoSeek = (e) => {
    if (!playerInstance) {
      console.error("Player instance not available");
      return;
    }
    
    try {
      const seekTime = parseFloat(e.target.value);
      if (isNaN(seekTime)) return;
      
      console.log(`Seeking to ${seekTime}`);
      // Update UI first for responsiveness
      setVideoTime(seekTime);
      // Then seek in the player
      playerInstance.seekTo(seekTime, true);
    } catch (error) {
      console.error("Error seeking:", error);
    }
  };
  
  const handleVideoSpeedChange = (e) => {
    if (!playerInstance) {
      console.error("Player instance not available");
      return;
    }
    
    try {
      const speed = parseFloat(e.target.value);
      if (isNaN(speed)) return;
      
      console.log(`Setting video speed to ${speed}`);
      // Update UI first
      setVideoSpeed(speed);
      // Then update player
      playerInstance.setPlaybackRate(speed);
    } catch (error) {
      console.error("Error changing speed:", error);
    }
  };
  
  const handleVideoSkipForward = () => {
    if (!playerInstance) {
      console.error("Player instance not available");
      return;
    }
    
    try {
      const currentTime = playerInstance.getCurrentTime();
      const duration = playerInstance.getDuration();
      const newTime = Math.min(duration, currentTime + 15);
      console.log(`Skipping forward from ${currentTime} to ${newTime}`);
      playerInstance.seekTo(newTime, true);
      setVideoTime(newTime); // Update UI immediately
    } catch (error) {
      console.error("Error skipping forward:", error);
    }
  };
  
  const handleVideoSkipBackward = () => {
    if (!playerInstance) {
      console.error("Player instance not available");
      return;
    }
    
    try {
      const currentTime = playerInstance.getCurrentTime();
      const newTime = Math.max(0, currentTime - 15);
      console.log(`Skipping backward from ${currentTime} to ${newTime}`);
      playerInstance.seekTo(newTime, true);
      setVideoTime(newTime); // Update UI immediately
    } catch (error) {
      console.error("Error skipping backward:", error);
    }
  };
  
  // Techno audio functions
  const toggleTechnoPlayPause = () => {
    const audio = audioRef.current;
    
    if (isTechnoPlaying) {
      audio.pause();
    } else {
      audio.play().catch(err => console.error("Couldn't play audio:", err));
    }
    
    setIsTechnoPlaying(!isTechnoPlaying);
  };
  
  const changeTrack = (index) => {
    setCurrentTechnoTrack(index);
  };
  
  const handleTechnoVolumeChange = (e) => {
    setTechnoVolume(parseFloat(e.target.value));
  };
  
  const handleTechnoSpeedChange = (speed) => {
    setTechnoSpeed(speed);
  };
  
  const handleSeek = (e) => {
    const seekTime = parseFloat(e.target.value);
    audioRef.current.currentTime = seekTime;
    setAudioTime(seekTime);
  };
  
  const skipForward = () => {
    const newTime = Math.min(audioRef.current.currentTime + 15, audioDuration);
    audioRef.current.currentTime = newTime;
  };
  
  const skipBackward = () => {
    const newTime = Math.max(audioRef.current.currentTime - 15, 0);
    audioRef.current.currentTime = newTime;
  };
  
  // Format time for display
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Add this function to enable clicking on the video frame itself
  useEffect(() => {
    const videoFrameElement = document.querySelector('.video-frame');
    if (videoFrameElement) {
      const handleFrameClick = () => {
        togglePlayPause();
      };
      
      videoFrameElement.addEventListener('click', handleFrameClick);
      return () => {
        videoFrameElement.removeEventListener('click', handleFrameClick);
      };
    }
  }, [playerInstance, isPlaying]); // Add dependencies to re-attach when these change
  
  // Always monitor player progress more actively
  useEffect(() => {
    if (!playerInstance) return;
    
    // Clear any existing interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    
    // Set up a new interval regardless of play state
    progressIntervalRef.current = setInterval(() => {
      try {
        if (playerInstance && playerInstance.getCurrentTime) {
          const currentTime = playerInstance.getCurrentTime();
          if (!isNaN(currentTime)) {
            setVideoTime(currentTime);
          }
          
          // Also check duration in case it changed
          const duration = playerInstance.getDuration();
          if (!isNaN(duration) && duration > 0) {
            setVideoDuration(duration);
          }
        }
      } catch (error) {
        console.error("Error getting current time:", error);
      }
    }, 500);
    
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [playerInstance]);
  
  return (
    <div className="youtube-layout">
      <div className="cyber-player">
        <div className="cyber-frame">
          <div className="frame-header">
            <div className="frame-title">
              {isVideoLoading ? 'LOADING_VIDEO::' : 'BLOOMBERG_TECH::'}
            </div>
            <div className="blocky-status header-status">
              {isPlaying ? 
                <span className="status-playing">STREAMING</span> : 
                <span className="status-paused">PAUSED</span>
              }
            </div>
          </div>
          
          <div className="video-frame">
            {isVideoLoading ? (
              <div className="video-loading">CONNECTING_TO_STREAM...</div>
            ) : (
              <div id="youtube-player-container">
                <div id="youtube-embed"></div>
              </div>
            )}
            <div className="scan-line"></div>
            <div className="video-overlay"></div>
          </div>
          
          <div className="cyber-progress">
            <input 
              type="range" 
              min="0" 
              max={videoDuration || 100} 
              value={videoTime || 0} 
              onChange={handleVideoSeek}
              className="progress-bar"
            />
          </div>
          
          <div className="cyber-youtube-controls">
            {/* Left section - timestamp */}
            <div className="timestamp-section">
              <div className="time-code-display">
                {formatTime(videoTime)} / {formatTime(videoDuration)}
              </div>
            </div>
            
            {/* Center section - playback controls */}
            <div className="center-controls">
              <button 
                onClick={handleVideoSkipBackward} 
                className="cyber-button small-button"
              >
                <span className="button-text">-15s</span>
              </button>
              
              <button 
                onClick={togglePlayPause} 
                className="cyber-button small-button"
              >
                {isPlaying ? 
                  <span className="button-symbol">❚❚</span> : 
                  <span className="button-symbol">▶</span>
                }
              </button>
              
              <button 
                onClick={handleVideoSkipForward} 
                className="cyber-button small-button"
              >
                <span className="button-text">+15s</span>
              </button>
            </div>
            
            {/* Right section - speed control */}
            <div className="blocky-right-controls">
              <div className="youtube-speed-control">
                <span className="speed-slider-label">SPEED</span>
                <input 
                  type="range"
                  min="1"
                  max="2"
                  step="0.25"
                  value={videoSpeed}
                  onChange={handleVideoSpeedChange}
                  className="speed-slider youtube-speed-slider"
                />
                <span className="speed-value">{videoSpeed.toFixed(2)}x</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Audio playlist column - This remains unchanged */}
      <div className="techno-playlist-column">
        <div className="playlist-header">AUDIO_STREAM::</div>
        
        {/* Playlist items */}
        <div className="playlist-items">
          {tracks.map((track, index) => (
            <div 
              key={index} 
              className={`playlist-item ${currentTechnoTrack === index ? 'active' : ''}`}
              onClick={() => changeTrack(index)}
            >
              <div className="playlist-item-content">
                <div className="playlist-item-number">{(index + 1).toString().padStart(2, '0')}</div>
                <div className="playlist-item-info">
                  <div className="playlist-item-title">{track.name}</div>
                  <div className="playlist-item-metadata">
                    <span className="playlist-item-artist">{track.artist}</span>
                    <span className="playlist-item-duration">
                      {formatTime(trackDurations[index] || 0)}
                    </span>
                  </div>
                </div>
                {currentTechnoTrack === index && (
                  <div className="playlist-item-playing">
                    <span className="playlist-item-status">
                      {isTechnoPlaying ? "LIVE" : "STANDBY"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Audio controls section - This remains unchanged */}
        <div className="playlist-controls">
          {/* Track info styled like a playlist item */}
          <div className="control-track-info">
            <div className="playlist-item-content">
              <div className="playlist-item-number">▶</div>
              <div className="playlist-item-info">
                <div className="playlist-item-title">{tracks[currentTechnoTrack].name}</div>
                <div className="playlist-item-metadata">
                  <span className="playlist-item-artist">{tracks[currentTechnoTrack].artist}</span>
                  <span className="song-time-display">
                    {formatTime(audioTime)} / {formatTime(audioDuration)}
                  </span>
                </div>
              </div>
              <div className="techno-status control-status">
                {isTechnoPlaying ? 
                  <span className="techno-active">LIVE</span> : 
                  <span className="techno-inactive">STANDBY</span>
                }
              </div>
            </div>
            
            {/* Working progress bar for audio */}
            <div className="playlist-progress-wrapper">
              <input 
                type="range"
                min="0"
                max={audioDuration || 100}
                value={audioTime || 0}
                onChange={handleSeek}
                className="playlist-progress-bar"
              />
            </div>
          </div>
          
          {/* Audio controls - Unchanged */}
          <div className="unified-controls">
            {/* Playback controls */}
            <div className="playback-row">
              <div className="control-group">
                <button onClick={skipBackward} className="cyber-button compact-button">
                  <span className="button-text">-15s</span>
                </button>
                
                <button 
                  onClick={toggleTechnoPlayPause} 
                  className="cyber-button compact-button"
                >
                  {isTechnoPlaying ? 
                    <span className="button-symbol">❚❚</span> : 
                    <span className="button-symbol">▶</span>
                  }
                </button>
                
                <button onClick={skipForward} className="cyber-button compact-button">
                  <span className="button-text">+15s</span>
                </button>
              </div>
            </div>

            {/* Volume and speed controls */}
            <div className="sliders-row">
              {/* Volume control - with actual functionality */}
              <div className="control-group">
                <span className="compact-label">VOL</span>
                <input 
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={technoVolume}
                  onChange={handleTechnoVolumeChange}
                  className="compact-slider"
                />
                <span className="compact-value">{Math.round(technoVolume * 100)}%</span>
              </div>

              {/* Speed control - with actual functionality */}
              <div className="control-group">
                <span className="compact-label">SPD</span>
                <input 
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={technoSpeed}
                  onChange={(e) => handleTechnoSpeedChange(parseFloat(e.target.value))}
                  className="compact-slider"
                />
                <span className="compact-value">{technoSpeed.toFixed(1)}x</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YouTubePodcast; 