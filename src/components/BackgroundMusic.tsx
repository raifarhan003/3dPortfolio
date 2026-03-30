import { useEffect, useRef, useState } from "react";
import { MdVolumeOff, MdVolumeUp } from "react-icons/md";

const BackgroundMusic = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0;
    const targetVolume = 0.02; // Super soft (2% volume)
    
    let playInitiated = false;

    const attemptPlay = () => {
      if (playInitiated || isMuted || !audio.paused) return;
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          playInitiated = true;
          setIsPlaying(true);
          // Fade in gently
          let vol = 0;
          const fadeInterval = setInterval(() => {
            if (vol < targetVolume) {
              vol += 0.005;
              audio.volume = Math.min(vol, targetVolume);
            } else {
              clearInterval(fadeInterval);
            }
          }, 200);

          // Clean up listeners
          document.removeEventListener("click", attemptPlay);
          document.removeEventListener("keydown", attemptPlay);
          document.removeEventListener("scroll", attemptPlay);
          document.removeEventListener("touchstart", attemptPlay);
        }).catch(() => {
          console.log("Autoplay prevented. Waiting for user interaction...");
        });
      }
    };

    // Attach listeners immediately so any early interaction triggers it
    document.addEventListener("click", attemptPlay);
    document.addEventListener("keydown", attemptPlay);
    document.addEventListener("scroll", attemptPlay, { passive: true });
    document.addEventListener("touchstart", attemptPlay, { passive: true });

    // Also attempt an automatic delayed play in case the browser allows autoplay
    const delayPlay = setTimeout(() => {
      attemptPlay();
    }, 2500);

    return () => {
      clearTimeout(delayPlay);
      document.removeEventListener("click", attemptPlay);
      document.removeEventListener("keydown", attemptPlay);
      document.removeEventListener("scroll", attemptPlay);
      document.removeEventListener("touchstart", attemptPlay);
    };
  }, [isMuted]);

  // Scroll volume logic
  useEffect(() => {
    const handleScroll = () => {
      if (!audioRef.current || isMuted || !isPlaying) return;
      
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      const scrollFraction = maxScroll > 0 ? scrollY / maxScroll : 0;
      
      // Volume scales from 0.02 at the top to 0.04 at the bottom
      const newVolume = 0.02 + (scrollFraction * 0.02);
      audioRef.current.volume = Math.min(Math.max(newVolume, 0), 1);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMuted, isPlaying]);

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
      if (!isPlaying && !audioRef.current.muted) {
         audioRef.current.play().catch(() => {});
         setIsPlaying(true);
         audioRef.current.volume = 0.02;
      }
    }
  };

  return (
    <>
      <audio ref={audioRef} loop src="/audio/time.mp3" preload="auto" />
      <span onClick={toggleMute} style={{ cursor: "pointer", zIndex: 9999 }}>
        <a style={{ pointerEvents: "none" }}>
          {isMuted ? <MdVolumeOff /> : <MdVolumeUp />}
        </a>
      </span>
    </>
  );
};

export default BackgroundMusic;
