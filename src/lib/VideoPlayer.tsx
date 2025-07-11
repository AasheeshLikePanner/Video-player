import { useEffect, useRef, useState, useCallback } from "react";
import { PlayIcon, PauseIcon, SpeakerWaveIcon, SpeakerXMarkIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, Cog6ToothIcon } from '@heroicons/react/24/solid';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  muted?: boolean;
  theme?: 'dark' | 'light';
}

export default function VideoPlayer({
  src,
  poster,
  autoPlay = false,
  theme = "dark",
  muted = false,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>(0);
  const hoverTimeoutRef = useRef<number>(0);

  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(muted);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  const handleProgress = useCallback(() => {
    const video = videoRef.current;
    if (video && video.buffered.length > 0) {
      setBuffered(video.buffered.end(video.buffered.length - 1));
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      video.volume = volume;
      video.muted = isMuted;
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

    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('progress', handleProgress);
    document.addEventListener('fullscreenchange', handleFullScreenChange);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('progress', handleProgress);
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
    };
  }, [volume, isMuted, isDragging, handleProgress]);

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
  }, []);

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

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
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

  const handleMouseUp = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsDragging(false);
  }, []);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  }, []);

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
        const newVolume = Math.min(video.volume + 0.1, 1);
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

  const handleMouseEnter = useCallback(() => {
    clearTimeout(hoverTimeoutRef.current);
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    hoverTimeoutRef.current = window.setTimeout(() => {
      setIsHovered(false);
    }, 2000);
  }, []);

  return (
    <div
      ref={playerContainerRef}
      tabIndex={0}
      className={`relative w-full h-full overflow-hidden rounded-2xl shadow-lg ${theme === 'dark' ? 'bg-black' : 'bg-gray-100'} focus:outline-none`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        muted={muted}
        className={`w-full h-full object-cover rounded-2xl`}
        onClick={handleVideoPlayback}
        onDoubleClick={toggleFullscreen}
      >
      </video>
      {/* Overlay for controls */}

      <div
        className={`absolute inset-0 flex flex-col justify-between p-4 transition-opacity duration-300 ${isHovered || !playing || isDragging ? 'opacity-100' : 'opacity-0'}`}
      >
        {/* Top gradient/overlay if needed */}
        <div className="flex-grow"></div>

        {/* Control Bar at the bottom */}
        <div className="w-full bg-opacity-40 backdrop-blur-md rounded-xl p-3 flex flex-col items-center space-x-3">
            <div className="w-full">
            {/* Progress Bar */}
            <div
              ref={progressBarRef}
              className="relative flex items-center w-full cursor-pointer h-6"
              onClick={handleProgressClick}
              onMouseDown={handleMouseDown}
            >
              {/* Buffered Bar */}
              <div
                className="bg-white bg-opacity-30 h-1 rounded-full absolute"
                style={{
                  width: duration ? `${(buffered / duration) * 100}%` : '0%',
                  transition: 'width 0.2s linear',
                }}
              ></div>
              {/* Progress Bar Left (before thumb) */}
              <div
              className="bg-white bg-opacity-60 h-1 rounded-full"
              style={{
                width: duration ? `calc(${(currentTime / duration) * 100}% - 8px)` : '0%',
                minWidth: 0,
                marginRight: '4px',
                transition: isDragging ? 'none' : 'width 0.1s linear',
              }}
              ></div>
              {/* Small gap before thumb */}
              <div style={{ width: '4px' }}></div>
              {/* Thumb as vertical line */}
              <div
              className="z-10 flex items-center justify-center"
              style={{
                width: '8px',
                height: '100%', // Make thumb take full height of parent
                pointerEvents: 'none',
              }}
              >
              {/* Change the height here */}
              <div
                className="w-1 bg-white rounded-full shadow-lg"
                style={{
                height: '27px', // Set your desired thumb height here
                }}
              ></div>
              </div>
              {/* Small gap after thumb */}
              <div style={{ width: '4px' }}></div>
              {/* Progress Bar Right (after thumb) */}
              <div
              className="bg-white bg-opacity-30 h-1 rounded-full flex-1"
              style={{
                width: duration ? `calc(100% - ${(currentTime / duration) * 100}% - 8px)` : '100%',
                minWidth: 0,
                marginLeft: '4px',
                transition: isDragging ? 'none' : 'width 0.1s linear',
              }}
              ></div>
            </div>
            </div>


          <div className="flex w-full p-3 items-center gap-10">

            {/* Play/Pause Button (small, in control bar) */}
            <button
              onClick={handleVideoPlayback}
              className={`p-5 w-30 flex justify-center items-center  rounded-3xl  ${playing ? 'bg-[#131313] text-white' : 'bg-white text-black'}`}
            >
              <div className="h-6 w-6">
                {playing ? <PauseIcon /> : <PlayIcon />}
              </div>
            </button>

            <div className="bg-[#131313] pl-2 pr-2 rounded-lg">
              {/* Current Time */}
              <span className="select-none text-white text-sm font-medium">
                {formatTime(currentTime)} /
              </span>


              {/* Duration */}
              <span className="select-none text-white text-sm font-medium">
                {formatTime(duration)}
              </span>
            </div>

            {/* Volume Control */}
            <button onClick={toggleMute} className="text-white">
              <div className="h-6 w-6">
                {isMuted || volume === 0 ? <SpeakerXMarkIcon /> : <SpeakerWaveIcon />}
              </div>
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 h-1.5 appearance-none rounded-full bg-white bg-opacity-30 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-lg cursor-pointer"
            />

            <div className="relative ml-auto">
              <button onClick={() => setShowSettings(s => !s)} className="text-white">
                <div className="h-6 w-6">
                  <Cog6ToothIcon />
                </div>
              </button>
              <div className={`absolute bottom-full right-0 bg-black bg-opacity-70 backdrop-blur-md rounded-lg p-2 space-y-2 transition-opacity duration-300 ${showSettings ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                  <div className="text-white text-sm">Playback Speed</div>
                  {[0.5, 1, 1.5, 2].map(rate => (
                    <button
                      key={rate}
                      onClick={() => setPlaybackRate(rate)}
                      className={`w-full text-left text-sm text-white ${playbackRate === rate ? 'font-bold' : ''}`}>
                      {rate}x
                    </button>
                  ))}
                </div>
            </div>

            {/* Fullscreen Button */}
            <button onClick={toggleFullscreen} className="text-white">
              <div className="h-6 w-6">
                {isFullScreen ? <ArrowsPointingInIcon /> : <ArrowsPointingOutIcon />}
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


