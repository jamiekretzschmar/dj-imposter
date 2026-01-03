import { DeckId, TrackMetadata } from '../types';
import { WORKLET_CODE } from '../constants';
import Database from './Database';
import Analyzer from './Analyzer';

class DeckAudio {
  public source: AudioBufferSourceNode | null = null;
  public gainNode: GainNode;
  public eqLow: BiquadFilterNode;
  public eqMid: BiquadFilterNode;
  public eqHigh: BiquadFilterNode;
  public panner: StereoPannerNode;
  public analyzer: AnalyserNode;
  
  // Stem Simulation Nodes
  public stemVocalsGain: GainNode;
  public stemDrumsGain: GainNode;
  public stemHarmonicGain: GainNode;
  public stemVocalsFilter: BiquadFilterNode;
  public stemDrumsFilter: BiquadFilterNode;
  public stemHarmonicFilter: BiquadFilterNode;

  public buffer: AudioBuffer | null = null;
  public startTime: number = 0;
  public pauseTime: number = 0;
  public isPlaying: boolean = false;
  public playbackRate: number = 1;

  constructor(context: AudioContext, destination: AudioNode) {
    // 1. Create Nodes
    this.gainNode = context.createGain();
    this.panner = context.createStereoPanner();
    this.analyzer = context.createAnalyser();
    this.analyzer.fftSize = 1024;
    
    this.eqLow = context.createBiquadFilter();
    this.eqLow.type = 'lowshelf';
    this.eqLow.frequency.value = 320;

    this.eqMid = context.createBiquadFilter();
    this.eqMid.type = 'peaking';
    this.eqMid.frequency.value = 1000;
    this.eqMid.Q.value = 1;

    this.eqHigh = context.createBiquadFilter();
    this.eqHigh.type = 'highshelf';
    this.eqHigh.frequency.value = 3200;

    // Stem Emulation Setup
    this.stemDrumsFilter = context.createBiquadFilter();
    this.stemDrumsFilter.type = 'lowpass';
    this.stemDrumsFilter.frequency.value = 250;
    this.stemDrumsGain = context.createGain();

    this.stemVocalsFilter = context.createBiquadFilter();
    this.stemVocalsFilter.type = 'bandpass';
    this.stemVocalsFilter.frequency.value = 2000; 
    this.stemVocalsFilter.Q.value = 0.5;
    this.stemVocalsGain = context.createGain();

    this.stemHarmonicFilter = context.createBiquadFilter();
    this.stemHarmonicFilter.type = 'highpass';
    this.stemHarmonicFilter.frequency.value = 250; 
    this.stemHarmonicGain = context.createGain();

    // 2. Connect Graph
    this.stemDrumsFilter.connect(this.stemDrumsGain);
    this.stemVocalsFilter.connect(this.stemVocalsGain);
    this.stemHarmonicFilter.connect(this.stemHarmonicGain);

    this.stemDrumsGain.connect(this.eqLow);
    this.stemVocalsGain.connect(this.eqLow);
    this.stemHarmonicGain.connect(this.eqLow);

    this.eqLow.connect(this.eqMid);
    this.eqMid.connect(this.eqHigh);
    this.eqHigh.connect(this.gainNode);
    this.gainNode.connect(this.panner);
    this.panner.connect(this.analyzer);
    this.analyzer.connect(destination);
  }
}

class AudioEngine {
  private static instance: AudioEngine;
  public context: AudioContext | null = null;
  public decks: Record<DeckId, DeckAudio> | null = null;
  public masterGain: GainNode | null = null;
  private isInitialized = false;
  
  // Automix state
  private automixInterval: any = null;
  private onCrossfaderUpdate: ((val: number) => void) | null = null;

  private constructor() {}

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  public async init() {
    if (this.isInitialized) return;

    // Standard AudioContext, assuming modern browser (Chrome/Edge/Firefox/Safari 14.1+)
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.context = new AudioContextClass({ latencyHint: 'interactive' });
    
    // Load Worklet
    if (this.context && this.context.audioWorklet) {
        try {
            const blob = new Blob([WORKLET_CODE], { type: 'application/javascript' });
            const url = URL.createObjectURL(blob);
            await this.context.audioWorklet.addModule(url);
        } catch (e) {
            console.warn("AudioWorklet failed to load", e);
        }
    }

    if (this.context) {
        this.masterGain = this.context.createGain();
        this.masterGain.connect(this.context.destination);

        this.decks = {
        [DeckId.A]: new DeckAudio(this.context, this.masterGain),
        [DeckId.B]: new DeckAudio(this.context, this.masterGain)
        };
    }

    this.isInitialized = true;
  }

  public async loadTrack(deckId: DeckId, url: string, trackId: string): Promise<TrackMetadata> {
    if (!this.context) throw new Error('Audio Context not initialized');
    
    try {
        // 1. Load Audio
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch audio: ${response.status} ${response.statusText}`);
        
        const arrayBuffer = await response.arrayBuffer();
        if (!arrayBuffer || arrayBuffer.byteLength === 0) {
            throw new Error("Fetched audio data is empty.");
        }

        let audioBuffer: AudioBuffer;
        try {
             audioBuffer = await this.context.decodeAudioData(arrayBuffer);
        } catch (decodeErr) {
            console.error("Decode Error:", decodeErr);
            throw new Error("Unable to decode audio data. The format might be unsupported or the file is corrupt.");
        }
        
        const deck = this.decks![deckId];
        deck.buffer = audioBuffer;
        deck.pauseTime = 0;
        deck.startTime = 0;

        // 2. Check IndexedDB for Analysis (Fail-safe)
        let analysis = null;
        try {
             analysis = await Database.getAnalysis(trackId);
        } catch (dbErr) {
            console.warn("Database access failed, proceeding with fresh analysis", dbErr);
        }
        
        // 3. If missing, Analyze Background
        if (!analysis) {
            console.log(`Analyzing track ${trackId} in background...`);
            analysis = await Analyzer.analyzeTrack(audioBuffer);
            try {
                await Database.saveAnalysis(trackId, analysis);
            } catch (saveErr) {
                console.warn("Failed to save analysis to DB", saveErr);
            }
        }

        // Return combined metadata stub (caller merges with existing info)
        return {
            id: trackId,
            title: '', // Filled by caller
            artist: '', // Filled by caller
            url: url,
            duration: audioBuffer.duration,
            bpm: analysis.bpm,
            key: analysis.key,
            analysis: analysis
        };

    } catch (e) {
        console.error("Audio Load Error:", e);
        // Clear the buffer if loading failed halfway
        if (this.decks && this.decks[deckId]) {
            this.decks[deckId].buffer = null;
        }
        throw e;
    }
  }

  public play(deckId: DeckId) {
    const deck = this.decks![deckId];
    if (!this.context || !deck.buffer || deck.isPlaying) return;

    // Ensure context is running (fixes "suspended" state issues)
    if (this.context.state === 'suspended') {
        this.context.resume();
    }

    deck.source = this.context.createBufferSource();
    deck.source.buffer = deck.buffer;
    deck.source.loop = false; // Disable loop for automix to detect end
    deck.source.playbackRate.value = deck.playbackRate;

    deck.source.connect(deck.stemDrumsFilter);
    deck.source.connect(deck.stemVocalsFilter);
    deck.source.connect(deck.stemHarmonicFilter);

    deck.startTime = this.context.currentTime - deck.pauseTime;
    deck.source.start(0, deck.pauseTime);
    deck.isPlaying = true;
  }

  public pause(deckId: DeckId) {
    const deck = this.decks![deckId];
    if (!this.context || !deck.isPlaying || !deck.source) return;

    deck.source.stop();
    deck.pauseTime = (this.context.currentTime - deck.startTime) * deck.playbackRate % deck.buffer!.duration;
    
    // Safety check for negative values if duration is weird
    if(isNaN(deck.pauseTime)) deck.pauseTime = 0;

    deck.source.disconnect();
    deck.source = null;
    deck.isPlaying = false;
  }

  // ... (seek, setSpeed, setEQ, setStem methods remain same)
  public seek(deckId: DeckId, time: number) {
    const deck = this.decks![deckId];
    const wasPlaying = deck.isPlaying;
    if (wasPlaying) this.pause(deckId);
    deck.pauseTime = time;
    if (wasPlaying) this.play(deckId);
  }

  public setVolume(deckId: DeckId, value: number) {
    const deck = this.decks![deckId];
    deck.gainNode.gain.setTargetAtTime(value, this.context!.currentTime, 0.01);
  }

  public setSpeed(deckId: DeckId, value: number) {
    const deck = this.decks![deckId];
    deck.playbackRate = value;
    if (deck.source) {
      deck.source.playbackRate.setTargetAtTime(value, this.context!.currentTime, 0.02);
    }
  }

  public setEQ(deckId: DeckId, band: 'low' | 'mid' | 'high', value: number) {
    const deck = this.decks![deckId];
    const gainValue = (value - 0.5) * 20; 
    const node = band === 'low' ? deck.eqLow : band === 'mid' ? deck.eqMid : deck.eqHigh;
    node.gain.setTargetAtTime(gainValue, this.context!.currentTime, 0.01);
  }

  public setStem(deckId: DeckId, stem: 'vocals' | 'drums' | 'harmonic', value: number) {
    const deck = this.decks![deckId];
    const node = stem === 'vocals' ? deck.stemVocalsGain : stem === 'drums' ? deck.stemDrumsGain : deck.stemHarmonicGain;
    node.gain.setTargetAtTime(value, this.context!.currentTime, 0.01);
  }

  public getAnalyzerData(deckId: DeckId): Uint8Array {
    if (!this.decks) return new Uint8Array(0);
    const deck = this.decks[deckId];
    const bufferLength = deck.analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    deck.analyzer.getByteFrequencyData(dataArray);
    return dataArray;
  }

  public getCurrentTime(deckId: DeckId): number {
    const deck = this.decks![deckId];
    if (!deck.buffer) return 0;
    if (deck.isPlaying && this.context) {
      return (this.context.currentTime - deck.startTime) * deck.playbackRate % deck.buffer.duration;
    }
    return deck.pauseTime;
  }

  public resumeContext() {
    if (this.context?.state === 'suspended') {
      this.context.resume();
    }
  }

  // --- Automix Functionality ---

  public setAutomixCallback(cb: (val: number) => void) {
      this.onCrossfaderUpdate = cb;
  }

  public startAutomix(fromDeckId: DeckId, toDeckId: DeckId, durationSec: number = 4) {
      if(this.automixInterval) clearInterval(this.automixInterval);
      
      const startVal = fromDeckId === DeckId.A ? -1 : 1;
      const endVal = fromDeckId === DeckId.A ? 1 : -1;
      const startTime = Date.now();
      
      // Start target deck
      if(!this.decks![toDeckId].isPlaying) {
          this.play(toDeckId);
      }

      this.automixInterval = setInterval(() => {
          const now = Date.now();
          const progress = Math.min((now - startTime) / (durationSec * 1000), 1);
          
          // Linear interpolation for slider
          const currentVal = startVal + (endVal - startVal) * progress;
          
          // Update Audio volumes
          const volA = Math.cos((currentVal + 1) * 0.25 * Math.PI);
          const volB = Math.cos((currentVal - 1) * 0.25 * Math.PI);
          this.setVolume(DeckId.A, volA);
          this.setVolume(DeckId.B, volB);

          // Update UI
          if(this.onCrossfaderUpdate) this.onCrossfaderUpdate(currentVal);

          if(progress >= 1) {
              clearInterval(this.automixInterval);
              this.automixInterval = null;
              // Stop previous deck
              this.pause(fromDeckId);
          }
      }, 16); // 60fps
  }
}

export default AudioEngine;