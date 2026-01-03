
export enum DeckId {
  A = 'A',
  B = 'B'
}

export interface TrackAnalysis {
  bpm: number;
  key: string;
  beatgrid: number[]; // Array of timestamps for beats
  peaks: number[]; // For waveform visualization
  analyzedAt: number;
}

export interface TrackMetadata {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  duration: number;
  url: string;
  coverArt?: string;
  key?: string;
  analysis?: TrackAnalysis;
}

export interface DeckState {
  track: TrackMetadata | null;
  isPlaying: boolean;
  volume: number;
  speed: number;
  pitch: number;
  eq: {
    low: number;
    mid: number;
    high: number;
  };
  stems: {
    vocals: number;
    drums: number;
    harmonic: number;
  };
  currentTime: number;
  duration: number;
}

export interface AppState {
  decks: {
    [DeckId.A]: DeckState;
    [DeckId.B]: DeckState;
  };
  crossfader: number; // -1 (Left) to 1 (Right)
  masterVolume: number;
  activeView: 'classic' | 'pro';
  automixEnabled: boolean;
}

export type AudioAction =
  | { type: 'LOAD_TRACK'; deckId: DeckId; track: TrackMetadata | null }
  | { type: 'PLAY_PAUSE'; deckId: DeckId }
  | { type: 'SET_VOLUME'; deckId: DeckId; value: number }
  | { type: 'SET_SPEED'; deckId: DeckId; value: number }
  | { type: 'SET_EQ'; deckId: DeckId; band: 'low' | 'mid' | 'high'; value: number }
  | { type: 'SET_STEM'; deckId: DeckId; stem: 'vocals' | 'drums' | 'harmonic'; value: number }
  | { type: 'SET_CROSSFADER'; value: number }
  | { type: 'SET_MASTER_VOLUME'; value: number }
  | { type: 'SET_VIEW'; view: 'classic' | 'pro' }
  | { type: 'TOGGLE_AUTOMIX' };
