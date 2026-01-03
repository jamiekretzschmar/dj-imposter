
import React from 'react';
import AudioEngine from '../services/AudioEngine';
import { DeckId } from '../types';
import { Shuffle, Disc } from 'lucide-react';

interface MixerProps {
  crossfader: number; // -1 to 1
  dispatch: React.Dispatch<any>;
  automixEnabled?: boolean;
}

const Mixer: React.FC<MixerProps> = ({ crossfader, dispatch, automixEnabled }) => {
  const engine = AudioEngine.getInstance();

  const handleCrossfaderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    dispatch({ type: 'SET_CROSSFADER', value: val });
    
    // Linear crossfade power curve
    const volA = Math.cos((val + 1) * 0.25 * Math.PI);
    const volB = Math.cos((val - 1) * 0.25 * Math.PI);
    
    engine.setVolume(DeckId.A, volA);
    engine.setVolume(DeckId.B, volB);
  };

  const toggleAutomix = () => {
      dispatch({ type: 'TOGGLE_AUTOMIX' });
      if (navigator.vibrate) navigator.vibrate(20);
  };

  return (
    <div className="w-full h-full flex flex-col justify-center px-6 py-3">
      {/* Control Strip */}
      <div className="flex justify-between items-center mb-3">
         <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs tracking-widest">
            <Disc size={14} className={crossfader < 0 ? 'animate-spin' : ''} />
            DECK A
         </div>
         
         <button 
            onClick={toggleAutomix}
            className={`flex items-center gap-2 px-6 py-2 rounded-full text-xs font-bold transition-all border shadow-lg ${automixEnabled ? 'bg-purple-600 border-purple-400 text-white shadow-purple-500/30' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
         >
            <Shuffle size={14} /> 
            {automixEnabled ? 'AUTOMIX ENGAGED' : 'START AUTOMIX'}
         </button>
         
         <div className="flex items-center gap-2 text-red-400 font-bold text-xs tracking-widest">
            DECK B
            <Disc size={14} className={crossfader > 0 ? 'animate-spin' : ''} />
         </div>
      </div>
      
      {/* Crossfader Track */}
      <div className="relative w-full h-10 flex items-center group">
        {/* Background Track */}
        <div className="absolute w-full h-3 bg-zinc-950 rounded-full shadow-inner border border-zinc-800/50 overflow-hidden">
             <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-zinc-800 -translate-x-1/2"></div>
             {/* Dynamic Fill indication */}
             <div 
                className="absolute top-0 bottom-0 bg-gradient-to-r from-cyan-900/30 to-red-900/30 w-full opacity-50"
             ></div>
        </div>
        
        <input
          type="range"
          min="-1"
          max="1"
          step="0.01"
          value={crossfader}
          onChange={handleCrossfaderChange}
          className="w-full h-14 opacity-0 cursor-pointer absolute z-20"
        />
        
        {/* Physical Fader Cap */}
        <div 
          className="absolute h-8 w-14 bg-gradient-to-b from-zinc-700 to-zinc-800 rounded-lg shadow-[0_4px_10px_rgba(0,0,0,0.5)] border border-zinc-600 top-1 -ml-7 pointer-events-none transition-transform duration-75 flex flex-col items-center justify-center gap-1"
          style={{ 
            left: `${((crossfader + 1) / 2) * 100}%` 
          }}
        >
          <div className="w-0.5 h-4 bg-black/50 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default Mixer;
