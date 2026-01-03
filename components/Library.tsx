import React, { useState, useEffect, useRef } from 'react';
import { SAMPLE_TRACKS, YOUTUBE_MOCK_RESULTS } from '../constants';
import { TrackMetadata } from '../types';
import { X, Play, Youtube, Search, Download, Terminal, Cloud } from 'lucide-react';

interface LibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (track: TrackMetadata) => void;
}

const Library: React.FC<LibraryProps> = ({ isOpen, onClose, onSelect }) => {
  const [activeTab, setActiveTab] = useState<'local' | 'youtube'>('local');
  const [ytUrl, setYtUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logEndRef.current) {
        logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  if (!isOpen) return null;

  const handleYoutubeDownload = () => {
    if (!ytUrl) return;
    setIsProcessing(true);
    setLogs([]);
    
    // Simulating a server-side yt-dlp process
    const steps = [
        `[system] Connecting to cloud audio processor...`,
        `[system] Instance 'worker-pixel-9-optimized' allocated.`,
        `[yt-dlp] Fetching video info for: ${ytUrl.substring(0, 25)}...`,
        `[yt-dlp] Video detected: "Unknown Title" (ID: dQw4w9WgXcQ)`,
        `[yt-dlp] Format: bestaudio/best`,
        `[download] Destination: /tmp/audio_cache/temp_track`,
        `[download] 0.0% of 12.45MiB at 45.00KiB/s ETA 04:30`,
        `[download] 20.5% of 12.45MiB at 2.10MiB/s ETA 00:04`,
        `[download] 65.0% of 12.45MiB at 5.50MiB/s ETA 00:01`,
        `[download] 100% of 12.45MiB in 00:03`,
        `[ffmpeg] Correcting container in "/tmp/audio_cache/temp_track"`,
        `[ffmpeg] Post-process: Converting to mp3 (192k)`,
        `[analysis] Neural Engine: Detecting Key/BPM...`,
        `[audio-x] Analysis: 128 BPM, Key Fm`,
        `[system] Transferring asset to local deck...`,
        `[audio-x] Track Ready.`
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
        if (stepIndex >= steps.length) {
            clearInterval(interval);
            setIsProcessing(false);
            if (navigator.vibrate) navigator.vibrate([50, 50, 50]); // Success haptic
            
            // Select a random mock result to simulate the download
            const result = YOUTUBE_MOCK_RESULTS[Math.floor(Math.random() * YOUTUBE_MOCK_RESULTS.length)];
            // Override title if user typed something specific (simulated)
            onSelect({ ...result, title: `YouTube Rip ${Math.floor(Math.random() * 1000)}` });
            return;
        }
        
        // Randomize log timing slightly for realism
        setLogs(prev => [...prev, steps[stepIndex]]);
        
        // Haptic tick on log update
        if (navigator.vibrate && stepIndex % 3 === 0) navigator.vibrate(5);
        
        stepIndex++;
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-0 md:p-4 safe-top safe-bottom">
      <div className="bg-zinc-950 w-full h-full md:h-[85vh] md:max-w-4xl md:rounded-2xl border-none md:border border-zinc-800 flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="h-16 border-b border-zinc-800 flex justify-between items-center px-6 bg-zinc-900/50 shrink-0">
          <div className="flex gap-6 h-full">
            <button 
                onClick={() => setActiveTab('local')}
                className={`h-full border-b-2 font-bold transition-colors px-2 ${activeTab === 'local' ? 'border-cyan-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
            >
                LOCAL LIBRARY
            </button>
            <button 
                onClick={() => setActiveTab('youtube')}
                className={`h-full border-b-2 font-bold transition-colors px-2 flex items-center gap-2 ${activeTab === 'youtube' ? 'border-red-600 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
            >
                <Youtube size={18} className={activeTab === 'youtube' ? 'text-red-500' : ''} />
                YOUTUBE
            </button>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-zinc-950">
          {activeTab === 'local' ? (
            <div className="p-0 md:p-4">
                <table className="w-full text-left border-collapse">
                    <thead className="hidden md:table-header-group">
                    <tr className="text-zinc-500 border-b border-zinc-800/50">
                        <th className="p-3 font-medium text-xs uppercase tracking-wider">Track</th>
                        <th className="p-3 font-medium text-xs uppercase tracking-wider">Artist</th>
                        <th className="p-3 font-medium text-xs uppercase tracking-wider">BPM</th>
                        <th className="p-3 font-medium text-xs uppercase tracking-wider">Key</th>
                        <th className="p-3"></th>
                    </tr>
                    </thead>
                    <tbody>
                    {SAMPLE_TRACKS.map((track) => (
                        <tr key={track.id} className="border-b border-zinc-900 md:border-none hover:bg-zinc-900/50 group transition-colors">
                        <td className="p-3 flex items-center gap-3">
                            <img src={track.coverArt} className="w-12 h-12 rounded bg-zinc-800 object-cover" alt="art" />
                            <div className="flex flex-col">
                                <span className="font-medium text-white text-sm md:text-base">{track.title}</span>
                                <span className="md:hidden text-xs text-zinc-500">{track.artist} • {track.bpm} BPM</span>
                            </div>
                        </td>
                        <td className="p-3 text-zinc-400 hidden md:table-cell">{track.artist}</td>
                        <td className="p-3 text-zinc-500 font-mono text-sm hidden md:table-cell">{track.bpm}</td>
                        <td className="p-3 text-zinc-500 font-mono text-sm hidden md:table-cell">{track.key}</td>
                        <td className="p-3 text-right">
                            <button 
                            onClick={() => onSelect(track)}
                            className="bg-cyan-600/20 text-cyan-400 hover:bg-cyan-500 hover:text-white border border-cyan-500/50 px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ml-auto"
                            >
                            <Play size={14} fill="currentColor" /> LOAD
                            </button>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
          ) : (
            <div className="flex flex-col h-full p-6 max-w-2xl mx-auto w-full">
                <div className="text-center mb-6">
                    <h3 className="text-xl text-white font-bold mb-2 flex items-center justify-center gap-2">
                        <Cloud size={20} className="text-cyan-400" />
                        Cloud Audio Extractor
                    </h3>
                    <p className="text-zinc-500 text-sm">Powered by remote yt-dlp instances for zero-latency processing.</p>
                </div>

                <div className="flex gap-2 mb-6">
                    <div className="relative flex-1">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                            <Search size={18} />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Paste YouTube Link..." 
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-red-600 transition-colors"
                            value={ytUrl}
                            onChange={(e) => setYtUrl(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={handleYoutubeDownload}
                        disabled={!ytUrl || isProcessing}
                        className={`px-6 rounded-lg font-bold flex items-center gap-2 transition-all ${!ytUrl || isProcessing ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20'}`}
                    >
                        {isProcessing ? 'BUSY' : <><Download size={18} /> RIP</>}
                    </button>
                </div>

                {/* Terminal Window */}
                <div className="flex-1 bg-black rounded-lg border border-zinc-800 font-mono text-xs md:text-sm p-4 overflow-hidden flex flex-col shadow-inner">
                    <div className="flex justify-between items-center mb-3 border-b border-zinc-900 pb-2">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        </div>
                        <div className="text-zinc-600 text-[10px] uppercase">yt-dlp v2024.10.05</div>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-1 text-zinc-400 font-mono">
                        {logs.length === 0 && !isProcessing && (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-700 opacity-50">
                                <Terminal size={48} className="mb-4" />
                                <p>Awaiting URL Input...</p>
                            </div>
                        )}
                        {logs.map((log, i) => (
                            <div key={i} className="break-all">
                                <span className="text-zinc-600 mr-2 opacity-50">{new Date().toLocaleTimeString('en-US', {hour12:false})}</span>
                                <span className={log.includes('error') ? 'text-red-500' : log.includes('100%') ? 'text-green-400' : log.includes('audio-x') ? 'text-cyan-400' : 'text-zinc-300'}>{log}</span>
                            </div>
                        ))}
                        <div ref={logEndRef} />
                    </div>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Library;