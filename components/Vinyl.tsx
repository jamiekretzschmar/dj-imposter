import React, { useEffect, useRef } from 'react';

interface VinylProps {
  isPlaying: boolean;
  coverArt?: string;
  onScratch: (active: boolean) => void;
  speed: number; // Playback rate
}

const Vinyl: React.FC<VinylProps> = ({ isPlaying, coverArt, onScratch, speed }) => {
  const rotation = useRef(0);
  const requestRef = useRef<number>();
  const vinylRef = useRef<HTMLDivElement>(null);
  
  // Physics state
  const isDragging = useRef(false);
  const lastAngle = useRef(0);

  const getAngle = (x: number, y: number, rect: DOMRect) => {
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return Math.atan2(y - cy, x - cx);
  };

  const animate = () => {
    if (isPlaying && !isDragging.current) {
      rotation.current = (rotation.current + (2 * speed)) % 360;
      if (vinylRef.current) {
        vinylRef.current.style.transform = `rotate(${rotation.current}deg)`;
      }
    }
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, speed]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!vinylRef.current) return;
    isDragging.current = true;
    onScratch(true);
    
    // Pixel 9 Haptic Feedback
    if (navigator.vibrate) navigator.vibrate(15);

    const rect = vinylRef.current.getBoundingClientRect();
    lastAngle.current = getAngle(e.clientX, e.clientY, rect);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !vinylRef.current) return;
    
    const rect = vinylRef.current.getBoundingClientRect();
    const currentAngle = getAngle(e.clientX, e.clientY, rect);
    let delta = (currentAngle - lastAngle.current) * (180 / Math.PI);
    
    // Normalize jumps around -PI/PI
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;

    // Micro-haptics for fast scratches
    if (Math.abs(delta) > 10 && navigator.vibrate) {
       // Throttled vibration could go here, but simple implementation:
       // navigator.vibrate(5); 
    }

    rotation.current += delta;
    vinylRef.current.style.transform = `rotate(${rotation.current}deg)`;
    lastAngle.current = currentAngle;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    onScratch(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  return (
    <div className="relative w-full h-full max-w-[300px] max-h-[300px] aspect-square mx-auto select-none touch-none">
      {/* Platter Base */}
      <div className="absolute inset-0 rounded-full bg-zinc-800 shadow-xl border-4 border-zinc-900" />
      
      {/* Rotating Vinyl */}
      <div
        ref={vinylRef}
        className="absolute inset-1 md:inset-2 rounded-full bg-black shadow-lg cursor-grab active:cursor-grabbing vinyl-groove flex items-center justify-center overflow-hidden"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Label / Cover Art */}
        <div className="w-1/3 h-1/3 rounded-full overflow-hidden border-4 border-zinc-800 relative z-10">
          {coverArt ? (
            <img src={coverArt} alt="Cover" className="w-full h-full object-cover pointer-events-none" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-cyan-600 to-purple-600" />
          )}
        </div>
      </div>
    </div>
  );
};

export default Vinyl;