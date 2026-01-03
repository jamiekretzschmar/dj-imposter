
import React, { useReducer, useEffect, useState, useRef } from 'react';
import { AppState, DeckId, DeckState, TrackMetadata, AudioAction } from './types';
import Deck from './components/Deck';
import Mixer from './components/Mixer';
import Library from './components/Library';
import AudioEngine from './services/AudioEngine';
import { MidiManager } from './services/MidiManager';
import { Maximize2, Settings, Volume2 } from 'lucide-react';

const initialDeckState: DeckState = {
  track: null,
  isPlaying: false,
  volume: 1,
  speed: 1,
  pitch: 0,
  eq: { low: 0.5, mid: 0.5, high: 0.5 },
  stems: { vocals: 1, drums: 1, harmonic: 1 },
  currentTime: 0,
  duration: 0,
};

const initialState: AppState = {
  decks: {
    [DeckId.A]: { ...initialDeckState },
    [DeckId.B]: { ...initialDeckState },
  },
  crossfader: 0,
  masterVolume: 1,
  activeView: 'classic',
  automixEnabled: false,
};

function reducer(state: AppState, action: AudioAction): AppState {
  switch (action.type) {
    case 'LOAD_TRACK':
      return {
        ...state,
        decks: {
          ...state.decks,
          [action.deckId]: { ...state.decks[action.deckId], track: action.track, isPlaying: false },
        },
      };
    case 'PLAY_PAUSE':
      return {
        ...state,
        decks: {
          ...state.decks,
          [action.deckId]: { ...state.decks[action.deckId], isPlaying: !state.decks[action.deckId].isPlaying },
        },
      };
    case 'SET_SPEED':
      return {
        ...state,
        decks: {
            ...state.decks,
            [action.deckId]: { ...state.decks[action.deckId], speed: action.value }
        }
      };
    case 'SET_EQ':
      return {
          ...state,
          decks: {
              ...state.decks,
              [action.deckId]: {
                  ...state.decks[action.deckId],
                  eq: { ...state.decks[action.deckId].eq, [action.band]: action.value }
              }
          }
      };
    case 'SET_STEM':
      return {
          ...state,
          decks: {
              ...state.decks,
              [action.deckId]: {
                  ...state.decks[action.deckId],
                  stems: { ...state.decks[action.deckId].stems, [action.stem]: action.value }
              }
          }
      };
    case 'SET_CROSSFADER':
      return { ...state, crossfader: action.value };
    case 'TOGGLE_AUTOMIX':
      return { ...state, automixEnabled: !state.automixEnabled };
    default:
      return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [activeDeckLoad, setActiveDeckLoad] = useState<DeckId | null>(null);
  const [isReady, setIsReady] = useState(false);
  const automixTriggeredRef = useRef<boolean>(false);

  useEffect(() => {
    const init = async () => {
        const engine = AudioEngine.getInstance();
        await engine.init();
        
        engine.setAutomixCallback((val) => {
            dispatch({ type: 'SET_CROSSFADER', value: val });
        });

        // Initialize MIDI non-blocking
        const midi = MidiManager.getInstance();
        midi.init().then(() => {
            midi.addListener((msg) => {
                if (msg.type === 'cc' && msg.note === 1) {
                    const val = (msg.velocity / 63.5) - 1; 
                    dispatch({ type: 'SET_CROSSFADER', value: val });
                    const volA = Math.cos((val + 1) * 0.25 * Math.PI);
                    const volB = Math.cos((val - 1) * 0.25 * Math.PI);
                    engine.setVolume(DeckId.A, volA);
                    engine.setVolume(DeckId.B, volB);
                }
            });
        }).catch(e => {
            console.warn("MIDI System failed to initialize (optional)", e);
        });

        setIsReady(true);
    };
    init();
  }, []);

  useEffect(() => {
      if(!state.automixEnabled) return;
      const interval = setInterval(() => {
          const engine = AudioEngine.getInstance();
          const activeDeckId = state.crossfader < 0 ? DeckId.A : DeckId.B;
          const nextDeckId = activeDeckId === DeckId.A ? DeckId.B : DeckId.A;
          const activeTime = engine.getCurrentTime(activeDeckId);
          const activeDeck = state.decks[activeDeckId];
          
          if (activeDeck.track && activeDeck.isPlaying && activeDeck.track.duration > 0) {
              const timeLeft = activeDeck.track.duration - activeTime;
              if (timeLeft < 15 && !automixTriggeredRef.current) {
                  automixTriggeredRef.current = true;
                  if(state.decks[nextDeckId].track) {
                      engine.startAutomix(activeDeckId, nextDeckId);
                      dispatch({ type: 'PLAY_PAUSE', deckId: nextDeckId }); 
                  }
              } else if (timeLeft > 20) {
                  automixTriggeredRef.current = false;
              }
          }
      }, 1000);
      return () => clearInterval(interval);
  }, [state.automixEnabled, state.crossfader, state.decks]);

  const openLibrary = (deckId: DeckId) => {
    setActiveDeckLoad(deckId);
    setLibraryOpen(true);
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const handleTrackSelect = async (track: TrackMetadata) => {
    if (activeDeckLoad) {
      // Set initial loading state
      dispatch({ type: 'LOAD_TRACK', deckId: activeDeckLoad, track });
      try {
         const updatedMetadata = await AudioEngine.getInstance().loadTrack(activeDeckLoad, track.url, track.id);
         dispatch({ type: 'LOAD_TRACK', deckId: activeDeckLoad, track: { ...track, ...updatedMetadata } });
      } catch (e: any) {
          console.error("Failed to load track", e);
          // Alert user and clear track from deck
          alert(e.message || "Failed to load audio");
          dispatch({ type: 'LOAD_TRACK', deckId: activeDeckLoad, track: null });
      }
      setLibraryOpen(false);
    }
  };

  if (!isReady) {
      return (
          <div className="h-[100dvh] w-screen flex items-center justify-center bg-zinc-950 text-cyan-500 animate-pulse font-mono">
              INITIALIZING AUDIO ENGINE...
          </div>
      )
  }

  return (
    <div className="h-[100dvh] w-screen bg-black flex flex-col text-white overflow-hidden safe-top safe-bottom p-2 gap-2">
      
      {/* --- TOP BUN: Header & Status --- */}
      <header className="h-14 bg-zinc-900 rounded-3xl flex items-center justify-between px-6 shrink-0 shadow-lg border border-zinc-800">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center font-black italic text-black text-xs shadow-glow">
                AX
            </div>
            <div className="flex flex-col justify-center">
                <h1 className="font-bold tracking-wider text-sm leading-none">AUDIO-X</h1>
                <span className="text-[10px] text-zinc-500 font-mono">PRO SYSTEM</span>
            </div>
        </div>
        
        {/* Status Indicators */}
        <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 bg-zinc-950/50 px-3 py-1.5 rounded-full border border-zinc-800">
                <Volume2 size={14} className="text-zinc-400" />
                <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 w-[80%]"></div>
                </div>
             </div>
             <button className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 transition-colors">
                <Settings size={18} />
             </button>
        </div>
      </header>

      {/* --- THE PATTY: Main Performance Area --- */}
      <main className="flex-1 min-h-0 flex flex-col md:flex-row gap-2">
        {/* Deck A */}
        <div className="flex-1 min-h-0 rounded-2xl overflow-hidden border border-zinc-800/50">
            <Deck 
                id={DeckId.A} 
                state={state.decks[DeckId.A]} 
                dispatch={dispatch} 
                onLoadTrack={() => openLibrary(DeckId.A)}
            />
        </div>

        {/* Deck B */}
        <div className="flex-1 min-h-0 rounded-2xl overflow-hidden border border-zinc-800/50">
            <Deck 
                id={DeckId.B} 
                state={state.decks[DeckId.B]} 
                dispatch={dispatch} 
                onLoadTrack={() => openLibrary(DeckId.B)}
            />
        </div>
      </main>

      {/* --- BOTTOM BUN: Mixer & Transport --- */}
      <footer className="h-auto min-h-[5rem] bg-zinc-900 rounded-3xl shadow-2xl border-t border-zinc-800 shrink-0 relative z-30 flex flex-col justify-center">
         <Mixer 
            crossfader={state.crossfader} 
            dispatch={dispatch} 
            automixEnabled={state.automixEnabled}
        />
      </footer>

      <Library 
        isOpen={libraryOpen} 
        onClose={() => setLibraryOpen(false)} 
        onSelect={handleTrackSelect} 
      />
    </div>
  );
}
