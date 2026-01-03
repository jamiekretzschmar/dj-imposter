import React from 'react';
import { DeckId, DeckState } from '../types';
import Vinyl from './Vinyl';
import Waveform from './Waveform';
import Knob from './Knob';
import { Play, Pause, Music, Disc } from 'lucide-react';
import AudioEngine from '../services/AudioEngine';

interface DeckProps {
  id: DeckId;
  state: DeckState;
  onLoadTrack: () => void;
  dispatch: React.Dispatch<any>;
}

const Deck: React.FC<DeckProps> = ({ id, state, onLoadTrack, dispatch }) => {
  const engine = AudioEngine.getInstance();

  const handlePlayToggle = () => {
    engine.resumeContext();
    if (state.isPlaying) {
      engine.pause(id);
      dispatch({ type: 'PLAY_PAUSE', deckId: id });
    } else {
      engine.play(id);
      dispatch({ type: 'PLAY_PAUSE', deckId: id });
    }
  };

  const handleSpeedChange = (val: number) => {
    engine.setSpeed(id, val);
    dispatch({ type: 'SET_SPEED', deckId: id, value: val });
  };

  const handleStemChange = (stem: 'vocals' | 'drums' | 'harmonic', val: number) => {
    engine.setStem(id, stem, val);
    dispatch({ type: 'SET_STEM', deckId: id, stem, value: val });
  };

  const handleEQChange = (band: 'low' | 'mid' | 'high', val: number) => {
    engine.setEQ(id, band, val);
    dispatch({ type: 'SET_EQ', deckId: id, band, value: val });
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900/80 rounded-xl p-3 md:p-4 border border-zinc-800 shadow-2xl backdrop-blur-md relative overflow-hidden group">
      {/* Top Bar: Metadata & Load */}
      <div className="flex justify-between items-center mb-2 shrink-0">
        <div className="flex-1 min-w-0 pr-2">
          <h2 className="text-base md:text-xl font-bold text-white truncate leading-tight">
            {state.track ? state.track.title : 'No Track Loaded'}
          </h2>
          <p className="text-xs md:text-sm text-zinc-400 truncate">
            {state.track ? `${state.track.artist} • ${state.track.bpm} BPM` : 'Select a track from library'}
          </p>
        </div>
        <button 
          onClick={onLoadTrack}
          className="shrink-0 p-2 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 rounded-lg transition-colors border border-zinc-700"
        >
          <Music size={18} className="text-cyan-400" />
        </button>
      </div>

      {/* Main Visual - Flexible Height */}
      <div className="flex-1 min-h-0 flex flex-col justify-center relative my-1 md:my-4">
        {/* Scale vinyl to fit available space */}
        <div className="relative w-full aspect-square max-h-[220px] md:max-h-[320px] mx-auto">
             <div className="absolute inset-0 flex items-center justify-center">
                <Vinyl 
                isPlaying={state.isPlaying} 
                coverArt={state.track?.coverArt} 
                onScratch={() => {}} 
                speed={state.speed}
                />
            </div>
            {/* Speed Slider Floating */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 h-[80%] w-6 bg-zinc-950/80 rounded-full border border-zinc-800 flex justify-center py-2 z-10 backdrop-blur">
                <input 
                    type="range" 
                    min="0.8" 
                    max="1.2" 
                    step="0.01" 
                    value={state.speed}
                    onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                    className="h-full w-full appearance-none bg-transparent outline-none slider-vertical"
                    style={{ writingMode: 'vertical-lr', direction: 'rtl' } as any} 
                />
            </div>
        </div>
      </div>

      {/* Waveform */}
      <div className="mb-2 shrink-0 h-12 md:h-16">
        <Waveform deckId={id} color={id === DeckId.A ? 'cyan' : 'red'} />
      </div>

      {/* Neural Mix & EQ Grid - Compact Mobile */}
      <div className="shrink-0 grid grid-cols-6 gap-1 md:gap-2 mb-2 p-2 bg-zinc-950/50 rounded-lg border border-zinc-800/50">
        {/* EQ Section */}
        <div className="col-span-3 flex justify-between px-1 md:px-2 border-r border-zinc-800">
          <Knob label="Hi" value={state.eq.high} onChange={(v) => handleEQChange('high', v)} />
          <Knob label="Mid" value={state.eq.mid} onChange={(v) => handleEQChange('mid', v)} />
          <Knob label="Low" value={state.eq.low} onChange={(v) => handleEQChange('low', v)} />
        </div>
        {/* Neural Mix Section */}
        <div className="col-span-3 flex justify-between px-1 md:px-2">
          <Knob label="Voc" color="red" value={state.stems.vocals} onChange={(v) => handleStemChange('vocals', v)} />
          <Knob label="Hrm" color="green" value={state.stems.harmonic} onChange={(v) => handleStemChange('harmonic', v)} />
          <Knob label="Drm" color="cyan" value={state.stems.drums} onChange={(v) => handleStemChange('drums', v)} />
        </div>
      </div>

      {/* Transport Controls */}
      <div className="flex justify-between items-center mt-auto shrink-0 h-14">
        <div className="flex gap-4 items-center">
          <button 
            className={`w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${state.isPlaying ? 'bg-cyan-500 shadow-cyan-500/40' : 'bg-zinc-700 hover:bg-zinc-600'}`}
            onClick={handlePlayToggle}
          >
            {state.isPlaying ? <Pause fill="white" className="w-5 h-5 md:w-6 md:h-6" /> : <Play fill="white" className="ml-1 w-5 h-5 md:w-6 md:h-6" />}
          </button>
          
          <button className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center hover:bg-zinc-700 active:scale-95 transition-transform text-zinc-400 font-bold text-[10px] md:text-xs">
             CUE
          </button>
        </div>

        <div className="text-right flex flex-col justify-center">
             <div className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">Status</div>
             <div className="font-mono text-lg md:text-2xl text-cyan-400 tabular-nums leading-none">
                {state.isPlaying ? "PLAY" : "STOP"}
             </div>
        </div>
      </div>
    </div>
  );
};

export default Deck;
