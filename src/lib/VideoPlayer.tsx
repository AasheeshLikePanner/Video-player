import { useEffect, useRef, useState, useCallback } from "react";
import { PlayIcon, PauseIcon, SpeakerWaveIcon, SpeakerXMarkIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, Cog6ToothIcon, ArrowUturnRightIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/solid';
import { useVideoAudioBoost } from "@/hooks/useVideoAudioBoost";

interface Quality {
  name: string;
  src: string;
}

interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  muted?: boolean;
  quality?: Quality[];
  controls?: boolean; // New prop for controlling custom controls visibility
}

export default function VideoPlayer({
  src,
  poster,
  autoPlay = false,
  muted = false,
  quality = [],
  controls = true, // Default to true
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const volumeButtonRef = useRef<HTMLButtonElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const settingsMenuRef = useRef<HTMLDivElement>(null); // New ref for the settings menu
  const animationFrameRef = useRef<number>(0);
  const hoverTimeoutRef = useRef<number>(0);
  const volumeHoverTimeoutRef = useRef<number>(0); // Added for volume hover delay

  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(muted);
  const [showControlsOverlay, setShowControlsOverlay] = useState(false);
  const [isMouseOverPlayer, setIsMouseOverPlayer] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false); // New state to track if video has played
  
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentQuality, setCurrentQuality] = useState(quality.length > 0 ? quality[0].src : src);
  const [tooltipContent, setTooltipContent] = useState("");
  const [tooltipPosition, setTooltipPosition] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);

  const [isVolumeHovered, setIsVolumeHovered] = useState(false);
  const [isVolumeDragging, setIsVolumeDragging] = useState(false);
  const [volumeSliderPosition, setVolumeSliderPosition] = useState({ x: 0, y: 0 });
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsPosition, setSettingsPosition] = useState({ x: 0, y: 0 });

  useVideoAudioBoost(videoRef, volume);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      video.volume = volume;
      video.muted = isMuted;
      setIsVideoReady(true);
    };

    const handleTimeUpdate = () => {
      if (!isDragging) {
        setCurrentTime(video.currentTime);
      }
    };

    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    const handlePlay = () => setPlaying(true);
    const handlePause = () => setPlaying(false);
    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => setIsLoading(false);

    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    document.addEventListener('fullscreenchange', handleFullScreenChange);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
    };
  }, [volume, isMuted, isDragging]);

  useEffect(() => {
    if (videoRef.current) {
      if (playing) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  }, [playing]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const handleVideoPlayback = useCallback(() => {
    setPlaying(p => !p);
    if (!hasPlayed) {
      setHasPlayed(true);
    }
  }, [hasPlayed]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (progressBarRef.current && videoRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const newTime = (clickX / rect.width) * duration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  }, [duration]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleProgressClick(e);
  }, [handleProgressClick]);

  const handleProgressBarDrag = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging && progressBarRef.current && videoRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      let newTime = (clickX / rect.width) * duration;
      if (newTime < 0) newTime = 0;
      if (newTime > duration) newTime = duration;

      setCurrentTime(newTime);

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.currentTime = newTime;
        }
      });
    }
  }, [isDragging, duration]);

  const handleProgressBarMouseUp = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsDragging(false);
  }, []);

  const handleVolumeChange = useCallback((value: number) => {
    if (videoRef.current) {
      const newVolume = Math.min(Math.max(value, 0), 2);
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
      // videoRef.current.volume = newVolume;
    }
  }, []);

  const handleVolumeDrag = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isVolumeDragging) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      let newVolume = (clickX / rect.width) * 2;
      if (newVolume < 0) newVolume = 0;
      if (newVolume > 2) newVolume = 2;
      handleVolumeChange(newVolume);
    }
  }, [isVolumeDragging, handleVolumeChange]);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      const newMuted = !videoRef.current.muted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    const playerContainer = playerContainerRef.current;
    if (!playerContainer) return;

    if (!document.fullscreenElement) {
      playerContainer.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      document.exitFullscreen();
    }
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const video = videoRef.current;
    if (!video) return;

    switch (e.key) {
      case ' ':
      case 'k':
        e.preventDefault();
        handleVideoPlayback();
        break;
      case 'f':
        e.preventDefault();
        toggleFullscreen();
        break;
      case 'm':
        e.preventDefault();
        toggleMute();
        break;
      case 'ArrowRight':
        e.preventDefault();
        video.currentTime = Math.min(video.currentTime + 5, duration);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        video.currentTime = Math.max(video.currentTime - 5, 0);
        break;
      case 'ArrowUp': {
        e.preventDefault();
        const newVolume = Math.min(video.volume + 0.1, 2);
        video.volume = newVolume;
        setVolume(newVolume);
        break;
      }
      case 'ArrowDown': {
        e.preventDefault();
        const newVolume = Math.max(video.volume - 0.1, 0);
        video.volume = newVolume;
        setVolume(newVolume);
        break;
      }
    }
  }, [duration, handleVideoPlayback, toggleFullscreen, toggleMute]);

  useEffect(() => {
    const container = playerContainerRef.current;
    container?.addEventListener('keydown', handleKeyDown);
    return () => {
      container?.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const handlePlayerMouseMove = useCallback(() => {
    clearTimeout(hoverTimeoutRef.current);
    setShowControlsOverlay(true);
    hoverTimeoutRef.current = window.setTimeout(() => {
      if (!isMouseOverPlayer && !isDragging) {
        setShowControlsOverlay(false);
      }
    }, 3000);
  }, [isMouseOverPlayer, isDragging]);

  const handleMouseLeave = useCallback(() => {
    setIsMouseOverPlayer(false);
    if (playing && !isDragging) {
      hoverTimeoutRef.current = window.setTimeout(() => {
        setShowControlsOverlay(false);
      }, 1000);
    } else if (!playing && !isDragging) {
      hoverTimeoutRef.current = window.setTimeout(() => {
        setShowControlsOverlay(false);
      }, 3000);
    }
  }, [playing, isDragging]);

  const handleMouseEnter = useCallback(() => {
    setIsMouseOverPlayer(true);
    setShowControlsOverlay(true);
    clearTimeout(hoverTimeoutRef.current);
  }, []);

  const handleVideoForward = () => {
    const video = videoRef?.current;
    if (!video) return;
    video.currentTime = Math.min(video.currentTime + 5, duration);
  }

  const handleVideoBackword = () => {
    const video = videoRef?.current;
    if (!video) return;
    video.currentTime = Math.max(video.currentTime - 5, 0);
  }

  const generatePreview = useCallback((hoverTime: number) => {
    const previewVideo = previewVideoRef.current;
    if (!previewVideo) return;

    previewVideo.currentTime = hoverTime;
    previewVideo.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = previewVideo.videoWidth;
      canvas.height = previewVideo.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(previewVideo, 0, 0, canvas.width, canvas.height);
        setPreviewImage(canvas.toDataURL());
      }
    };
  }, []);

  const handleMouseMoveOnProgress = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration || !progressBarRef.current) return;
    const progressRect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - progressRect.left;

    const percentage = Math.min(Math.max(x / progressRect.width, 0), 1);
    const hoverTime = percentage * duration;

    setTooltipContent(formatTime(hoverTime));
    generatePreview(hoverTime);

    const tooltipEl = tooltipRef.current;
    const tooltipWidth = tooltipEl ? tooltipEl.offsetWidth : 160;
    const progressWidth = progressRect.width;

    let newLeft = x - tooltipWidth / 2;

    if (newLeft < 0) {
      newLeft = 0;
    }
    if (newLeft + tooltipWidth > progressWidth) {
      newLeft = progressWidth - tooltipWidth;
    }

    setTooltipPosition(newLeft);
    setShowTooltip(true);
  }, [duration, generatePreview]);

  const handleMouseLeaveOnProgress = useCallback(() => {
    setShowTooltip(false);
    setPreviewImage("");
    // Trigger the main player container's mouse leave logic
    handleMouseLeave();
  }, [handleMouseLeave]);

  const handleQualityChange = (newSrc: string) => {
    if (videoRef.current) {
      const wasPlaying = playing;
      const oldTime = videoRef.current.currentTime;
      setCurrentQuality(newSrc);
      videoRef.current.src = newSrc;
      videoRef.current.load();
      videoRef.current.currentTime = oldTime;
      if (wasPlaying) {
        videoRef.current.play();
      }
      setPlaying(wasPlaying);
    }
  };

  // Fixed volume hover handling with delay
  const handleVolumeHover = useCallback((isHovering: boolean) => {
    if (isHovering) {
      // Clear any existing timeout
      clearTimeout(volumeHoverTimeoutRef.current);
      
      // Calculate position and show immediately
      if (volumeButtonRef.current && playerContainerRef.current) {
        const buttonRect = volumeButtonRef.current.getBoundingClientRect();
        const containerRect = playerContainerRef.current.getBoundingClientRect();
        
        setVolumeSliderPosition({
          x: buttonRect.left - containerRect.left + buttonRect.width / 2,
          y: buttonRect.top - containerRect.top - 20
        });
      }
      setIsVolumeHovered(true);
    } else {
      // Add delay before hiding
      volumeHoverTimeoutRef.current = window.setTimeout(() => {
        setIsVolumeHovered(false);
      }, 300); // 300ms delay
    }
  }, []);

  // Handle volume slider area hover
  const handleVolumeSliderHover = useCallback((isHovering: boolean) => {
    if (isHovering) {
      // Clear hide timeout when hovering over slider
      clearTimeout(volumeHoverTimeoutRef.current);
      setIsVolumeHovered(true);
    } else {
      // Add delay before hiding when leaving slider
      volumeHoverTimeoutRef.current = window.setTimeout(() => {
        setIsVolumeHovered(false);
      }, 300); // 300ms delay
    }
  }, []);

  // Handle settings menu
  const handleSettingsClick = useCallback(() => {
    if (settingsButtonRef.current && playerContainerRef.current) {
      const buttonRect = settingsButtonRef.current.getBoundingClientRect();
      const containerRect = playerContainerRef.current.getBoundingClientRect();
      
      setSettingsPosition({
        x: buttonRect.left - containerRect.left + buttonRect.width / 2,
        y: buttonRect.top - containerRect.top - 20
      });
    }
    setIsSettingsOpen(!isSettingsOpen);
  }, [isSettingsOpen]);

  // Close settings when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isSettingsOpen &&
        settingsButtonRef.current &&
        !settingsButtonRef.current.contains(event.target as Node) &&
        settingsMenuRef.current &&
        !settingsMenuRef.current.contains(event.target as Node)
      ) {
        setIsSettingsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSettingsOpen]);

  return (
    <div
      ref={playerContainerRef}
      tabIndex={0}
      className={`relative w-full h-full overflow-hidden rounded-2xl shadow-lg bg-background focus:outline-none`}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handlePlayerMouseMove}
      onMouseUp={handleProgressBarMouseUp}
    >
      <video
        ref={videoRef}
        src={currentQuality}
        poster={hasPlayed ? "" : poster}
        autoPlay={autoPlay}
        muted={muted}
        className={`w-full h-full object-cover rounded-2xl ${showControlsOverlay ? `opacity-70` : `opacity-100`} ${isLoading ? '' : ''}`}
        onClick={handleVideoPlayback}
        onDoubleClick={toggleFullscreen}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      
      <video ref={previewVideoRef} src={currentQuality} className="absolute select-none -top-[9999px] -left-[9999px]" muted preload="auto" crossOrigin="anonymous" />

      {/* SETTINGS MENU */}
      {isSettingsOpen && (
        <div 
          ref={settingsMenuRef} // Attach the new ref here
          className="absolute z-[9999] bg-card/10 rounded-2xl backdrop-blur-xl left-1/2 -translate-x-1/2 transition-all duration-300 border border-border/50"
          style={{
            left: `${settingsPosition.x}px`,
            top: `${settingsPosition.y}px`,
            transform: 'translate(-50%, calc(-100% - 20px))'
          }}
        >
          <div className="space-y-1">
            {/* Playback Speed */}
            <div className="px-3 py-2 text-xs font-medium text-muted-background">
              Playback Speed
            </div>
            <div className="grid grid-cols-2 gap-1 p-2">
              {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((speed) => (
                <button
                  key={speed}
                  onClick={() => {
                    setPlaybackRate(speed);
                    setIsSettingsOpen(false);
                  }}
                  className={`w-full p-1 text-sm text-left rounded-md transition-colors ${
                    playbackRate === speed 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-muted text-foreground'
                  }`}
                >
                  {`${speed}x`}
                </button>
              ))}
            </div>
            
            {/* Quality Selection */}
            {quality.length > 0 && (
              <>
                <div className="border-t border-border/50 my-2"></div>
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground">
                  Quality
                </div>
                <div className="space-y-1">
                  {quality.map((q) => (
                    <button
                      key={q.src}
                      onClick={() => {
                        handleQualityChange(q.src);
                        setIsSettingsOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-sm text-left rounded-md transition-colors ${
                        currentQuality === q.src 
                          ? 'bg-primary text-primary-foreground' 
                          : 'hover:bg-muted text-foreground'
                      }`}
                    >
                      {q.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* VOLUME SLIDER - NOW WITH PROPER HOVER HANDLING */}
      {(isVolumeHovered || isVolumeDragging) && (
        <div 
          className="absolute z-[9999] bg-card/10 backdrop-blur-xl rounded-lg p-4 transition-all duration-300"
          style={{
            left: `${volumeSliderPosition.x}px`,
            top: `${volumeSliderPosition.y}px`,
            transform: 'translate(-50%, -80%)'
          }}
          onMouseEnter={() => handleVolumeSliderHover(true)}
          onMouseLeave={() => handleVolumeSliderHover(false)}
        >
          <div className="h-3 w-56 flex flex-col items-center justify-center">
            <div
              className="relative w-full cursor-pointer h-6"
              onMouseDown={(e) => {
                setIsVolumeDragging(true);
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const newVolume = (clickX / rect.width) * 2;
                handleVolumeChange(newVolume);
              }}
              onMouseMove={handleVolumeDrag}
              onMouseUp={() => setIsVolumeDragging(false)}
            >
              <div className="absolute top-1/2 -translate-y-1/2 w-full h-1 bg-primary/20 rounded-full">
                <div
                  className={`absolute h-[26px] top-1/2 -translate-y-1/2 left-0 rounded-s-sm ${volume > 1 ? 'bg-destructive' : 'bg-primary'}`}
                  style={{ width: `calc(${(volume / 2) * 100}% - 5px)` }}
                />
              </div>
              <div
                className="absolute z-20 flex items-center justify-center"
                style={{
                  left: `${(volume / 2) * 100}%`,
                  top: '50%',
                  transform: 'translate(-50%, -50%)', 
                  width: '8px',
                  height: '100%',
                  pointerEvents: 'none',
                }}
              >
                <div
                  className="w-1 bg-primary rounded-full shadow-lg"
                  style={{ height: '27px' }}
                />
              </div>
              <div
                className="absolute top-1/2 -translate-y-1/2 h-1 bg-muted rounded-full z-10"
                style={{
                  left: `calc(${(volume / 2) * 100}% + 8px)`,
                  right: '0%',
                }}
              />
              {isVolumeDragging && (
                <div className="absolute bottom-full mb-2 p-1 bg-card text-card-foreground text-xs rounded-md -translate-x-1/2"
                     style={{ left: `${(volume / 2) * 100}%` }}>
                  {Math.round(volume * 100)}%
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-foreground border-t-transparent" />
        </div>
      )}

      {/* Overlay for controls */}
      {controls && (
        <div
          className={`absolute inset-0 flex flex-col justify-between ps-4 pr-4 transition-opacity duration-300 ${showControlsOverlay || !playing || isDragging ? 'opacity-100' : 'opacity-0'}`}
        >
          <div className="flex-grow" />

          {/* Control Bar at the bottom */}
          <div className="w-full rounded-xl p-3 flex flex-col items-center space-x-3 z-50">
            <div className="w-full">
              {/* Progress Bar */}
              <div
                ref={progressBarRef}
                className="relative w-full cursor-pointer h-6"
                onClick={handleProgressClick}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMoveOnProgress}
                onMouseLeave={handleMouseLeaveOnProgress}
              >
                {showTooltip && (
                  <div
                    ref={tooltipRef}
                    draggable={false}
                    className="select-none absolute bottom-full p-1 bg-card text-card-foreground text-xs rounded-xl flex flex-col items-center"
                    style={{ left: `${tooltipPosition}px` }}
                  >
                    {previewImage && <img draggable={false} src={previewImage} alt="preview" className="select-none rounded-xl w-52 h-auto mb-1" />}
                    {tooltipContent}
                  </div>
                )}

                <div className="absolute top-1/2 -translate-y-1/2 w-full h-1 bg-opacity-30 rounded-full" />
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full z-10"
                  style={{
                    width: duration ? `calc(${(currentTime / duration) * 100}% - 9px)` : '0%',
                  }}
                />
                <div
                  className="absolute z-10 flex items-center justify-center"
                  style={{
                    left: duration ? `${(currentTime / duration) * 100}%` : '0%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '4px',
                    height: '100%',
                    pointerEvents: 'none',
                  }}
                >
                  <div
                    className="w-2 bg-primary rounded-full shadow-lg"
                    style={{ height: '27px' }}
                  />
                </div>
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-1 bg-gray-500 rounded-full z-10"
                  style={{
                    left: duration ? `calc(${(currentTime / duration) * 100}% + 9px)` : '0%',
                    right: '0%',
                  }}
                />
              </div>
            </div>

            <div className="flex w-full p-3 items-center gap-10">
              <button
                onClick={handleVideoPlayback}
                className={`p-5 w-30 flex justify-center items-center ${playing ? 'bg-card/20 backdrop-blur-xl rounded-3xl' : 'bg-primary rounded-full'}`}
              >
                <div className="h-6 w-6 text-primary-foreground">
                  {playing ? <PauseIcon fill="white" /> : <PlayIcon fill="black" />}
                </div>
              </button>

              <div className="bg-card/20 backdrop-blur-xl p-4 rounded-lg flex items-center">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleVideoBackword}
                    className="flex justify-center items-center rounded-3xl text-white hover:bg-primary hover:text-black"
                  >
                    <div className="h-6 w-6">
                      <ArrowUturnLeftIcon />
                    </div>
                  </button>
                  <button
                    onClick={handleVideoForward}
                    className="flex justify-center text-white items-center rounded-3xl hover:bg-primary hover:text-black"
                  >
                    <div className="h-6 w-6">
                      <ArrowUturnRightIcon />
                    </div>
                  </button>
                </div>

                <span className="select-none text-white text-sm font-medium ml-2">
                  {formatTime(currentTime)} /
                </span>
                <span className="select-none text-white text-sm font-medium ml-1">
                  {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center bg-card/20 backdrop-blur-xl gap-2 ml-auto p-2 rounded-lg">
                {/* Volume Control - WITH PROPER HOVER HANDLING */}
                <button 
                  ref={volumeButtonRef}
                  onClick={toggleMute} 
                  className="text-primary-foreground p-2 rounded-lg hover:bg-primary/20 transition-colors"
                  onMouseEnter={() => handleVolumeHover(true)}
                  onMouseLeave={() => handleVolumeHover(false)}
                >
                  <div className="h-6 w-6 text-primary-foreground">
                    {isMuted || volume === 0 ? <SpeakerXMarkIcon fill="white" /> : <SpeakerWaveIcon fill="white" />}
                  </div>
                </button>

                {/* Settings and Fullscreen remain the same */}
                <button 
                  ref={settingsButtonRef}
                  onClick={handleSettingsClick}
                  className="text-primary-foreground p-2 rounded-lg hover:bg-primary/20 transition-colors relative"
                >
                  <div className="h-6 w-6 text-primary-foreground">
                    <Cog6ToothIcon fill="white" />
                  </div>
                </button>

                <button onClick={toggleFullscreen} className="text-primary-foreground p-2 rounded-lg hover:bg-primary/20 transition-colors">
                  <div className="h-6 w-6 text-primary-foreground">
                    {isFullScreen ? <ArrowsPointingInIcon fill="white" /> : <ArrowsPointingOutIcon fill="white" />}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}