import { useEffect, useRef, useState, useCallback } from "react";
import { PlayIcon, PauseIcon, SpeakerWaveIcon, SpeakerXMarkIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, Cog6ToothIcon, ArrowUturnRightIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/solid';
import {useVideoAudioBoost} from "@/hooks/useVideoAudioBoost";

interface Quality {
  name: string;
  src: string;
}

interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  muted?: boolean;
  theme?: 'dark' | 'light';
  quality?: Quality[];
}

export default function VideoPlayer({
  src,
  poster,
  autoPlay = false,
  theme = "dark",
  muted = false,
  quality = [],
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>(0);
  const hoverTimeoutRef = useRef<number>(0);

  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(muted);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentQuality, setCurrentQuality] = useState(quality.length > 0 ? quality[0].src : src);
  const [tooltipContent, setTooltipContent] = useState("");
  const [tooltipPosition, setTooltipPosition] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useVideoAudioBoost(videoRef, volume);

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
        const newVolume = Math.min(video.volume + 0.1, 5);
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
    const tooltipWidth = tooltipEl ? tooltipEl.offsetWidth : 160; // Estimate width
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
  }, []);

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
        src={currentQuality}
        poster={poster}
        autoPlay={autoPlay}
        muted={muted}
        className={`w-full h-full object-cover rounded-2xl ${isHovered ? `opacity-70` : `opacity-100`} ${isLoading ? '' : ''}`}
        onClick={handleVideoPlayback}
        onDoubleClick={toggleFullscreen}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      >
      </video>
      <video ref={previewVideoRef} src={currentQuality} className="absolute select-none -top-[9999px] -left-[9999px]" muted preload="auto" crossOrigin="anonymous" />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
        </div>
      )}

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
                  className="select-none absolute bottom-full p-1 bg-black text-white text-xs rounded-xl flex flex-col items-center"
                  style={{
                    left: `${tooltipPosition}px`,
                  }}
                >
                  {previewImage && <img draggable={false} src={previewImage} alt="preview" className="select-none rounded-xl w-52 h-auto mb-1" />}
                  {tooltipContent}
                </div>
              )}

              {/* Track - full width */}
              <div className="absolute top-1/2 -translate-y-1/2 w-full h-1  bg-opacity-30 rounded-full"></div>

              {/* Progress Bar Left (before thumb) */}
              <div
                className="absolute top-1/2 -translate-y-1/2 h-1 bg-white rounded-full z-10"
                style={{
                  width: duration ? `calc(${(currentTime / duration) * 100}% - 9px)` : '0%',
                }}
              ></div>
              {/* Thumb */}
              <div
                className="absolute z-20 flex items-center justify-center"
                style={{
                  left: duration ? `${(currentTime / duration) * 100}%` : '0%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)', // Center the thumb
                  width: '8px',
                  height: '100%',
                  pointerEvents: 'none',
                }}
              >
                <div
                  className="w-2 bg-white rounded-full shadow-lg"
                  style={{
                    height: '27px',
                  }}
                ></div>
              </div>

              {/* Progress Bar Right (after thumb) */}
              <div
                className="absolute top-1/2 -translate-y-1/2 h-1 bg-gray-400 rounded-full z-10"
                style={{
                  left: duration ? `calc(${(currentTime / duration) * 100}% + 9px)` : '0%',
                  right: '0%',
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

            <div className="bg-[#131313] p-4 rounded-lg flex items-center">

              <div className="flex items-center gap-4">
                <button
                  onClick={handleVideoBackword}
                  className={`flex justify-center items-center  rounded-3xl  text-white hover:bg-white hover:text-black`}
                >
                  <div className="h-6 w-6">
                    <ArrowUturnLeftIcon />
                  </div>
                </button>
                <button
                  onClick={handleVideoForward}
                  className={` flex justify-center items-center  rounded-3xl  text-white hover:bg-white hover:text-black`}
                >
                  <div className="h-6 w-6">
                    <ArrowUturnRightIcon />
                  </div>
                </button>
              </div>

              {/* Current Time */}
              <span className="select-none text-white text-sm font-medium ml-2">
                {formatTime(currentTime)} /
              </span>

              {/* Duration */}
              <span className="select-none text-white text-sm font-medium ml-1">
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
              max="5"
              step="0.1"
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
                {quality.length > 0 && <div className="text-white text-sm">Quality</div>}
                {quality.map(q => (
                  <button
                    key={q.name}
                    onClick={() => handleQualityChange(q.src)}
                    className={`w-full text-left text-sm text-white ${currentQuality === q.src ? 'font-bold' : ''}`}>
                    {q.name}
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







