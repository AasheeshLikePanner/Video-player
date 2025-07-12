import React, { useRef } from 'react';
import { SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/solid';

interface VolumeSliderProps {
  isMuted: boolean;
  volume: number;
  toggleMute: () => void;
  handleVolumeChange: (newVolume: number) => void;
  isVolumeHovered: boolean;
  setIsVolumeHovered: (hovered: boolean) => void;
  isVolumeDragging: boolean;
  setIsVolumeDragging: (dragging: boolean) => void;
  handleVolumeDrag: (e: React.MouseEvent<HTMLDivElement>) => void;
}

const VolumeSlider: React.FC<VolumeSliderProps> = ({
  isMuted,
  volume,
  toggleMute,
  handleVolumeChange,
  handleVolumeDrag,
  isVolumeHovered,
  setIsVolumeHovered,
  isVolumeDragging,
  setIsVolumeDragging,
}) => {
  console.log('VolumeSlider component rendering');
  const enterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  return (
    <div 
      className="relative flex items-center z-[10000]" // Added z-[10000]
      onMouseEnter={() => {
        console.log('Outer div onMouseEnter');
        console.log('onMouseEnter: Initiating timeout to set isVolumeHovered to true');
        if (leaveTimeoutRef.current) {
          clearTimeout(leaveTimeoutRef.current);
          leaveTimeoutRef.current = null;
          console.log('onMouseEnter: Cleared existing leave timeout');
        }
        enterTimeoutRef.current = setTimeout(() => {
          console.log('onMouseEnter setTimeout callback: Setting isVolumeHovered to true');
          setIsVolumeHovered(true);
        }, 200); // 200ms delay for appearance
      }}
      onMouseLeave={() => {
        console.log('Outer div onMouseLeave');
        console.log('onMouseLeave: Initiating timeout to set isVolumeHovered to false');
        if (enterTimeoutRef.current) {
          clearTimeout(enterTimeoutRef.current);
          enterTimeoutRef.current = null;
          console.log('onMouseLeave: Cleared existing enter timeout');
        }
        leaveTimeoutRef.current = setTimeout(() => {
          console.log('onMouseLeave setTimeout callback: Setting isVolumeHovered to false');
          setIsVolumeHovered(false);
        }, 300); // 300ms delay for disappearance
      }}
    >
      <button 
        onClick={toggleMute} 
        className="text-primary-foreground p-2 rounded-lg hover:bg-primary/20 transition-colors"
        onMouseEnter={() => console.log('Button onMouseEnter')}
        onMouseLeave={() => console.log('Button onMouseLeave')}
      >
        <div className="h-6 w-6 text-primary-foreground">
          {isMuted || volume === 0 ? <SpeakerXMarkIcon fill="white" /> : <SpeakerWaveIcon fill="white" />}
        </div>
      </button>
      
      {/* Volume slider with corrected z-index */}
      <div 
        className={`absolute z-[10001] bg-card/20 backdrop-blur-xl bottom-full left-1/2 -translate-x-1/2 mb-4 transition-all duration-500 ${isVolumeHovered || isVolumeDragging ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        onMouseDown={(e) => {
          console.log('onMouseDown: Setting isVolumeDragging to true');
          setIsVolumeDragging(true);
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const newVolume = (clickX / rect.width) * 2;
          handleVolumeChange(newVolume);
        }}
        onMouseMove={handleVolumeDrag}
        onMouseUp={() => {
          console.log('onMouseUp: Setting isVolumeDragging to false');
          setIsVolumeDragging(false);
        }}
        onMouseLeave={() => {
          console.log('Volume slider onMouseLeave: Setting isVolumeDragging to false');
          setIsVolumeDragging(false);
        }}
        style={{ width: '100px', height: '20px' }} // Added inline style for dimensions
      >
        {/* Rest of your volume slider content remains the same */}
        <div 
          className="h-full bg-primary rounded-lg" 
          style={{ width: `${(volume / 2) * 100}%` }} // Assuming max volume is 2
        ></div>
      </div>
    </div>
  );
};

export default VolumeSlider;
