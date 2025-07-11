import { useEffect, useRef, type RefObject,  } from "react";

export function useVideoAudioBoost(
  videoRef: RefObject<HTMLVideoElement | null>,
  boostLevel: number
) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const connectedRef = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }

    const audioCtx = audioCtxRef.current;

    if (!gainNodeRef.current) {
      gainNodeRef.current = audioCtx.createGain();
    }

    if (!connectedRef.current) {
      const source = audioCtx.createMediaElementSource(video);
      source.connect(gainNodeRef.current).connect(audioCtx.destination);
      connectedRef.current = true;

      const resumeAudio = () => audioCtx.resume();
      video.addEventListener("play", resumeAudio, { once: true });
    }

    gainNodeRef.current.gain.value = Math.min(boostLevel, 3);
  }, [videoRef.current, boostLevel]);
}
