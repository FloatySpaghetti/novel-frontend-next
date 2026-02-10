// components/chapter/AudioPlayer.tsx
'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Settings } from 'lucide-react';
import { useAppDispatch } from '../../hooks/redux';
import { updateLocalProgress } from '../../store/slices/progressSlice';
import { Howl, Howler } from 'howler';

interface AudioPlayerProps {
  audioUrl: string;
  initialPosition?: number;
  novelId: string;
  chapterId: string;
  userId?: string;
  autoPlay?: boolean;
  onEnded?: () => void;
}

// At the top of your component, initialize volume state with saved value
const getInitialVolume = (): number => {
  if (typeof window !== 'undefined') {
    const savedVolume = localStorage.getItem('audioVolume');
    if (savedVolume !== null) {
      const vol = parseFloat(savedVolume);
      if (!isNaN(vol) && vol >= 0 && vol <= 1) {
        return vol;
      }
    }
  }
  return 1.0;
};

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  initialPosition = 0,
  novelId,
  chapterId,
  userId,
  autoPlay = false,
  onEnded,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialPosition);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(getInitialVolume);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  
  const soundRef = useRef<Howl | null>(null);
  const progressInterval = useRef<number | null>(null);
  const saveProgressInterval = useRef<number | null>(null);
  const isMounted = useRef(true);
  const lastInitializedUrl = useRef<string>('');
  const isInitializing = useRef(false);
  const autoPlayExecuted = useRef(false);
  
  // Use refs for all props that shouldn't trigger reinitializations
  const currentAutoPlayState = useRef(autoPlay);
  const currentInitialPosition = useRef(initialPosition);
  const currentOnEnded = useRef(onEnded);
  const currentUserId = useRef(userId);
  const currentNovelId = useRef(novelId);
  const currentChapterId = useRef(chapterId);
  
  const dispatch = useAppDispatch();

  // Speed options
  const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

  // Simple cleanup function - ALWAYS stop audio
  const cleanup = useCallback(() => {
    console.log('Cleaning up audio...');
    
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
    
    if (soundRef.current) {
      try {
        soundRef.current.stop(); // ALWAYS stop first
        soundRef.current.unload();
      } catch (e) {
        console.warn('Cleanup error:', e);
      }
      soundRef.current = null;
    }
  }, []);

  // Update refs when props change
  useEffect(() => {
    currentAutoPlayState.current = autoPlay;
  }, [autoPlay]);

  useEffect(() => {
    currentInitialPosition.current = initialPosition;
  }, [initialPosition]);

  useEffect(() => {
    currentOnEnded.current = onEnded;
  }, [onEnded]);

  useEffect(() => {
    currentUserId.current = userId;
  }, [userId]);

  useEffect(() => {
    currentNovelId.current = novelId;
  }, [novelId]);

  useEffect(() => {
    currentChapterId.current = chapterId;
  }, [chapterId]);

  // Load saved playback rate from localStorage
  useEffect(() => {
    const savedRate = localStorage.getItem('audioPlaybackRate');
    if (savedRate) {
      const rate = parseFloat(savedRate);
      if (!isNaN(rate) && speedOptions.includes(rate)) {
        setPlaybackRate(rate);
      }
    }
  }, []);

  // Save playback rate to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('audioPlaybackRate', playbackRate.toString());
    
    // Update playback rate on the sound instance if it exists
    if (soundRef.current) {
      soundRef.current.rate(playbackRate);
    }
  }, [playbackRate, speedOptions]);

  // Simplified volume effects
  useEffect(() => {
    localStorage.setItem('audioVolume', volume.toString());
    Howler.volume(volume);
  }, [volume]);

  // Save progress
  const saveProgress = useCallback(() => {
    if (currentUserId.current && currentTime > 0 && isMounted.current) {
      dispatch(
        updateLocalProgress({
          id: `progress-${Date.now()}`,
          user_id: currentUserId.current,
          novel_id: currentNovelId.current,
          chapter_id: currentChapterId.current,
          progress_timestamp: new Date().toISOString(),
          audio_position: currentTime,
        })
      );
    }
  }, [currentTime, dispatch]);

  // Progress tracking
  const startProgressTracking = useCallback(() => {
    if (progressInterval.current) return;
    
    progressInterval.current = window.setInterval(() => {
      if (soundRef.current && soundRef.current.playing() && isMounted.current) {
        const seekTime = soundRef.current.seek() as number;
        if (isFinite(seekTime) && seekTime >= 0) {
          setCurrentTime(seekTime);
        }
      }
    }, 100);
  }, []);

  const stopProgressTracking = useCallback(() => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  }, []);

  // Auto play function
  const attemptAutoPlay = useCallback(() => {
    if (!soundRef.current || !currentAutoPlayState.current || autoPlayExecuted.current) return;

    try {
      const playResult = soundRef.current.play() as number | Promise<any>;
    
      if (playResult && typeof (playResult as any).then === 'function') {
        (playResult as Promise<any>).then(() => {
          console.log('Autoplay started successfully');
          autoPlayExecuted.current = true;
        }).catch((error) => {
          console.log('Autoplay prevented by browser:', error);
        });
      } else {
        autoPlayExecuted.current = true;
        console.log('Autoplay attempted (no promise returned)');
      }
    } catch (err) {
      console.log('Autoplay attempt failed:', err);
    }
  }, []);

  // Initialize audio
  const initializeAudio = useCallback(() => {
    // Prevent multiple initializations
    if (!audioUrl || 
        isInitializing.current || 
        lastInitializedUrl.current === audioUrl ||
        !isMounted.current) {
      return;
    }

    console.log('Initializing audio for:', audioUrl);
    
    // Mark as initializing to prevent multiple calls
    isInitializing.current = true;
    lastInitializedUrl.current = audioUrl;
    autoPlayExecuted.current = false;
    
    // Reset state
    setIsLoading(true);
    setError(null);
    setIsPlaying(false);
    
    // Cleanup any existing sound
    cleanup();

    try {
      const sound = new Howl({
        src: [audioUrl],
        html5: true,
        preload: true,
        volume: isMuted ? 0 : volume,
        rate: playbackRate,
        
        onload: () => {
          if (!isMounted.current) {
            sound.unload();
            return;
          }
          
          const audioDuration = sound.duration();
          setDuration(audioDuration);
          setIsLoading(false);
          isInitializing.current = false;
          
          // Set initial position
          if (currentInitialPosition.current > 0 && currentInitialPosition.current < audioDuration) {
            sound.seek(currentInitialPosition.current);
            setCurrentTime(currentInitialPosition.current);
          }

          // Attempt autoplay
          if (currentAutoPlayState.current && !autoPlayExecuted.current) {
            setTimeout(() => {
              attemptAutoPlay();
            }, 100);
          }
        },
        
        onplay: () => {
          if (!isMounted.current) return;
          console.log('Audio started playing');
          setIsPlaying(true);
          startProgressTracking();
        },
        
        onpause: () => {
          if (!isMounted.current) return;
          setIsPlaying(false);
          stopProgressTracking();
        },
        
        onstop: () => {
          if (!isMounted.current) return;
          setIsPlaying(false);
          stopProgressTracking();
        },
        
        onend: () => {
          if (!isMounted.current) return;
          setIsPlaying(false);
          stopProgressTracking();
          
          // Save final progress
          if (currentUserId.current && duration > 0) {
            dispatch(
              updateLocalProgress({
                id: `progress-${Date.now()}`,
                user_id: currentUserId.current,
                novel_id: currentNovelId.current,
                chapter_id: currentChapterId.current,
                progress_timestamp: new Date().toISOString(),
                audio_position: duration,
              })
            );
          }
          
          if (currentOnEnded.current) {
            currentOnEnded.current();
          }
        },
        
        onseek: () => {
          if (!isMounted.current) return;
          const seekTime = sound.seek() as number;
          if (isFinite(seekTime)) {
            setCurrentTime(seekTime);
          }
        },
        
        onloaderror: () => {
          if (!isMounted.current) return;
          setError('Failed to load audio');
          setIsLoading(false);
          isInitializing.current = false;
        },
        
        onplayerror: () => {
          if (!isMounted.current) return;
          if (!autoPlayExecuted.current && currentAutoPlayState.current) {
            console.log('Autoplay failed - this is normal browser behavior');
          } else {
            setError('Failed to play audio');
          }
          setIsPlaying(false);
          isInitializing.current = false;
        },
      });

      if (isMounted.current) {
        soundRef.current = sound;
      } else {
        sound.unload();
        isInitializing.current = false;
      }
      
    } catch (err) {
      console.error('Init error:', err);
      setError('Audio initialization failed');
      setIsLoading(false);
      isInitializing.current = false;
    }
  }, [audioUrl, volume, isMuted, cleanup, startProgressTracking, stopProgressTracking, attemptAutoPlay, dispatch, duration, playbackRate]); 

  // Initialize only when audioUrl changes
  useEffect(() => {
    lastInitializedUrl.current = '';
    isInitializing.current = false;
    autoPlayExecuted.current = false;
    
    if (audioUrl) {
      const timer = setTimeout(() => {
        initializeAudio();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [audioUrl]);

  // Progress saving interval
  useEffect(() => {
    if (userId) {
      saveProgressInterval.current = window.setInterval(saveProgress, 5000);
    }

    return () => {
      if (saveProgressInterval.current) {
        clearInterval(saveProgressInterval.current);
        saveProgressInterval.current = null;
      }
    };
  }, [userId, saveProgress]);

  // Mount/unmount
  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      isMounted.current = false;
      isInitializing.current = false;
      cleanup();
      try {
        Howler.unload();
      } catch (e) {
        console.warn('Global cleanup error:', e);
      }
    };
  }, [cleanup]);

  // Control functions
  const togglePlay = () => {
    if (!soundRef.current || isLoading || error) return;
    
    try {
      if (isPlaying) {
        soundRef.current.pause();
      } else {
        soundRef.current.play();
      }
    } catch (err) {
      console.error('Play/pause error:', err);
      setError('Playback control failed');
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!soundRef.current || isLoading || error) return;
    
    const newTime = parseFloat(e.target.value);
    if (newTime >= 0 && newTime <= duration) {
      soundRef.current.seek(newTime);
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!soundRef.current) return;
    
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    soundRef.current.volume(isMuted ? 0 : newVolume);
    
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (!soundRef.current) return;
    
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    soundRef.current.volume(newMuteState ? 0 : volume);
  };

  const skipBackward = () => {
    if (!soundRef.current || isLoading || error) return;
    
    const newTime = Math.max(0, currentTime - 10);
    soundRef.current.seek(newTime);
    setCurrentTime(newTime);
  };

  const skipForward = () => {
    if (!soundRef.current || isLoading || error) return;
    
    const newTime = Math.min(duration, currentTime + 10);
    soundRef.current.seek(newTime);
    setCurrentTime(newTime);
  };

  const setSpeed = (rate: number) => {
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
    
    if (soundRef.current) {
      soundRef.current.rate(rate);
    }
  };

  const formatTime = (time: number) => {
    if (!isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const retry = () => {
    setError(null);
    lastInitializedUrl.current = '';
    isInitializing.current = false;
    autoPlayExecuted.current = false;
    cleanup();
    
    setTimeout(() => {
      initializeAudio();
    }, 500);
  };

  // Don't render if no audio URL
  if (!audioUrl) {
    return (
      <div className="rounded-lg shadow-md p-4">
        <div className="p-3 bg-gray-50 text-gray-700 rounded-md text-sm">
          No audio available for this chapter
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg shadow-md p-4">
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {error}
          <button onClick={retry} className="ml-2 underline">
            Retry
          </button>
        </div>
      )}

      {isLoading && (
        <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-md text-sm flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
          Loading audio...
        </div>
      )}

      <div className="flex flex-col">
        <div className="mb-4">
          <div className="relative w-full h-2 bg-gray-200 rounded-full">
            <div
              className="absolute h-full bg-primary-600 rounded-full"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="absolute w-full h-full opacity-0 cursor-pointer"
              disabled={isLoading || !!error}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={skipBackward}
              disabled={isLoading || !!error}
              className="text-gray-700 hover:text-primary-600 disabled:text-gray-400"
            >
              <SkipBack size={20} />
            </button>

            <button
              onClick={togglePlay}
              disabled={isLoading || !!error}
              className={`${
                isLoading || error
                  ? 'bg-gray-400'
                  : 'bg-primary-600 hover:bg-primary-700'
              } text-white rounded-full p-3 transition-colors`}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : isPlaying ? (
                <Pause size={20} />
              ) : (
                <Play size={20} className="ml-0.5" />
              )}
            </button>

            <button
              onClick={skipForward}
              disabled={isLoading || !!error}
              className="text-gray-700 hover:text-primary-600 disabled:text-gray-400"
            >
              <SkipForward size={20} />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {/* Speed control dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                disabled={isLoading || !!error}
                className="text-gray-700 hover:text-primary-600 disabled:text-gray-400 flex items-center"
              >
                <Settings size={20} />
                <span className="ml-1 text-sm">{playbackRate}x</span>
              </button>
              
              {showSpeedMenu && (
                <div className="absolute top-full right-0 mt-2 w-32 bg-white rounded-md shadow-lg py-1 z-10">
                  {speedOptions.map((rate) => (
                    <button
                      key={rate}
                      onClick={() => setSpeed(rate)}
                      className={`block w-full text-left px-4 py-2 text-sm ${
                        playbackRate === rate
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {rate}x
                      {playbackRate === rate && (
                        <span className="ml-2">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={toggleMute}
              disabled={isLoading || !!error}
              className="text-gray-700 hover:text-primary-600 disabled:text-gray-400"
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="w-20 accent-primary-600"
              disabled={isLoading || !!error}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
