import React, { useEffect, useRef } from 'react';
import AudioEngine from '../services/AudioEngine';
import { DeckId } from '../types';

interface WaveformProps {
  deckId: DeckId;
  color?: string;
}

const Waveform: React.FC<WaveformProps> = ({ deckId, color = '#22d3ee' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = AudioEngine.getInstance();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const data = engine.getAnalyzerData(deckId);

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#09090b'; // Background
    ctx.fillRect(0, 0, width, height);

    if (data.length === 0) {
        requestRef.current = requestAnimationFrame(draw);
        return;
    }

    const barWidth = (width / data.length) * 2.5;
    let x = 0;

    for (let i = 0; i < data.length; i++) {
      const v = data[i] / 128.0;
      const h = v * height * 0.8; // Scaling

      // Simple gradient logic based on height
      const r = Math.min(255, data[i] + 50);
      const g = 100;
      const b = 255 - data[i];
      
      // If specific color requested
      if (color === 'red') ctx.fillStyle = `rgb(${r}, 50, 50)`;
      else ctx.fillStyle = `rgb(${50}, ${r}, ${200})`;

      // Center the wave
      const y = (height - h) / 2;
      ctx.fillRect(x, y, barWidth, h);

      x += barWidth + 1;
    }

    // Playhead line
    ctx.fillStyle = '#fff';
    ctx.fillRect(width / 2, 0, 2, height);

    requestRef.current = requestAnimationFrame(draw);
  };

  useEffect(() => {
    // Handle resizing logic ideally, assuming fixed for now
    requestRef.current = requestAnimationFrame(draw);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      width={600} 
      height={100} 
      className="w-full h-24 bg-black rounded border border-gray-800"
    />
  );
};

export default Waveform;
