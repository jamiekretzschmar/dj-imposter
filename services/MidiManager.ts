export class MidiManager {
  private static instance: MidiManager;
  private access: MIDIAccess | null = null;
  private listeners: ((data: { type: string, note: number, velocity: number, channel: number }) => void)[] = [];

  private constructor() {}

  public static getInstance(): MidiManager {
    if (!MidiManager.instance) {
      MidiManager.instance = new MidiManager();
    }
    return MidiManager.instance;
  }

  public async init() {
    if (this.access) return; // Prevent re-initialization

    if (navigator.requestMIDIAccess) {
      try {
        this.access = await navigator.requestMIDIAccess();
        
        this.access.inputs.forEach((input) => {
          input.onmidimessage = this.handleMessage.bind(this);
        });

        this.access.onstatechange = (e: any) => {
           if (e.port.type === "input" && e.port.state === "connected") {
             e.port.onmidimessage = this.handleMessage.bind(this);
           }
        };
        console.log("MIDI Initialized");
      } catch (err) {
        console.warn("MIDI access denied or not available", err);
      }
    }
  }

  private handleMessage(message: MIDIMessageEvent) {
    const [status, note, velocity] = message.data || [];
    const command = status & 0xf0;
    const channel = status & 0x0f;
    
    // Normalize Type
    let type = 'unknown';
    if (command === 144) type = 'noteOn';
    if (command === 128) type = 'noteOff';
    if (command === 176) type = 'cc'; // Control Change

    this.listeners.forEach(fn => fn({ type, note, velocity, channel }));
  }

  public addListener(fn: (data: any) => void) {
    this.listeners.push(fn);
  }

  public removeListener(fn: (data: any) => void) {
    this.listeners = this.listeners.filter(l => l !== fn);
  }
}