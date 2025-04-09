import React, { useState, useRef, useEffect } from 'react';

const PodcastPlayer = React.forwardRef(({ onPlaybackRateChange, onPlayStateChange, onVolumeChange }, ref) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [volume, setVolume] = useState(0.8);
  
  const audioRef = useRef(null);
  
  // Expose the audio element to parent components via ref
  React.useImperativeHandle(ref, () => ({
    audioElement: audioRef.current,
    play: () => {
      if (audioRef.current) audioRef.current.play();
    },
    pause: () => {
      if (audioRef.current) audioRef.current.pause();
    },
    setPlaybackRate: (rate) => {
      if (audioRef.current) audioRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    },
    getCurrentTime: () => audioRef.current ? audioRef.current.currentTime : 0,
    getDuration: () => audioRef.current ? audioRef.current.duration : 0
  }));
  
  // Handle playback rate change
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
    
    if (onPlaybackRateChange) {
      onPlaybackRateChange(playbackRate);
    }
  }, [playbackRate, onPlaybackRateChange]);
  
  // Handle play state change
  useEffect(() => {
    if (onPlayStateChange) {
      onPlayStateChange(isPlaying);
    }
  }, [isPlaying, onPlayStateChange]);
  
  // Handle volume change
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    
    if (onVolumeChange) {
      onVolumeChange(volume);
    }
  }, [volume, onVolumeChange]);
  
  // Handle time update
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
    }
  };
  
  // Play/Pause toggle
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  // Skip forward 15 seconds
  const skipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime += 15;
    }
  };
  
  // Skip backward 15 seconds
  const skipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime -= 15;
    }
  };
  
  // Format time in MM:SS
  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds)) return "00:00";
    
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Handle seek
  const handleSeek = (e) => {
    const seekTime = parseFloat(e.target.value);
    setCurrentTime(seekTime);
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
    }
  };
  
  return (
    <div className="podcast-player">
      <h2>Boyz N Da Club - Radio Edit</h2>
      <p>Local audio file for testing</p>
      
      <audio 
        ref={audioRef}
        src="/[SPOTDOWNLOADER.COM] Boyz N Da Club - Radio Edit.mp3" 
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
      />
      
      <div className="controls">
        <button onClick={skipBackward}>-15s</button>
        <button onClick={togglePlayPause} className="play-button">
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button onClick={skipForward}>+15s</button>
      </div>
      
      <div className="progress">
        <span>{formatTime(currentTime)}</span>
        <input 
          type="range" 
          min="0" 
          max={duration || 0} 
          value={currentTime} 
          onChange={handleSeek}
          step="0.1"
          className="progress-slider"
        />
        <span>{formatTime(duration)}</span>
      </div>
      
      <div className="playback-rate">
        <span>Speed: {playbackRate.toFixed(1)}x</span>
        <div className="rate-buttons">
          <button onClick={() => setPlaybackRate(0.5)} className={playbackRate === 0.5 ? 'active' : ''}>0.5x</button>
          <button onClick={() => setPlaybackRate(1.0)} className={playbackRate === 1.0 ? 'active' : ''}>1.0x</button>
          <button onClick={() => setPlaybackRate(1.5)} className={playbackRate === 1.5 ? 'active' : ''}>1.5x</button>
          <button onClick={() => setPlaybackRate(2.0)} className={playbackRate === 2.0 ? 'active' : ''}>2.0x</button>
        </div>
        <input 
          type="range" 
          min="0.5" 
          max="3" 
          step="0.1" 
          value={playbackRate}
          onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
          className="rate-slider"
        />
      </div>
      
      <div className="volume-control">
        <span>Volume: {Math.round(volume * 100)}%</span>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.01" 
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="volume-slider"
        />
      </div>
    </div>
  );
});

export default PodcastPlayer;
