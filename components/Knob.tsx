import React, { useState, useRef, useEffect } from 'react';

interface KnobProps {
  value: number; // 0 to 1
  min?: number;
  max?: number;
  onChange: (val: number) => void;
  label?: string;
  color?: string;
}

const Knob: React.FC<KnobProps> = ({ value, min = 0, max = 1, onChange, label, color = 'cyan' }) => {
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef<number>(0);
  const startVal = useRef<number>(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startY.current = e.clientY;
    startVal.current = value;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaY = startY.current - e.clientY;
      const range = max - min;
      const deltaVal = (deltaY / 100) * range; // Sensitivity
      let newVal = startVal.current + deltaVal;
      newVal = Math.max(min, Math.min(max, newVal));
      onChange(newVal);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, max, min, onChange]);

  // Calculate rotation: 0 = -135deg, 1 = 135deg
  const percentage = (value - min) / (max - min);
  const rotation = -135 + (percentage * 270);

  return (
    <div className="flex flex-col items-center gap-1">
      <div 
        className="relative w-12 h-12 cursor-ns-resize group"
        onMouseDown={handleMouseDown}
      >
        {/* Track */}
        <div className="absolute inset-0 rounded-full border-2 border-gray-700 bg-gray-900" />
        {/* Indicator */}
        <div 
          className="absolute top-0 left-1/2 w-1 h-1/2 origin-bottom pointer-events-none transition-transform duration-75 ease-out"
          style={{ 
            transform: `translateX(-50%) rotate(${rotation}deg)`,
          }}
        >
          <div className={`w-full h-2 rounded-full mt-1 ${color === 'cyan' ? 'bg-cyan-400' : color === 'red' ? 'bg-red-500' : 'bg-green-400'}`} />
        </div>
      </div>
      {label && <span className="text-[10px] uppercase font-bold text-gray-400 select-none">{label}</span>}
    </div>
  );
};

export default Knob;
