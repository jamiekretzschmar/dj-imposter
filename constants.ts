import { TrackMetadata } from './types';

export const AUDIO_BUFFER_SIZE = 4096;
export const ANALYZER_FFT_SIZE = 2048;
export const LATENCY_HINT = 'interactive';

// Using known reliable CORS-enabled audio samples
export const SAMPLE_TRACKS: TrackMetadata[] = [
 {
    id: 'track1',
    title: 'My Song Name',
    artist: 'Me',
    bpm: 120,
    url: '/music/track1.mp3',
    cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=50',
 },

 {
    id: 'track2',
    title: 'My Song Name2',
    artist: 'Me',
    bpm: 120,
    url: '/music/track2.mp3',
    cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=50',
 },

  {
    id: 't1',
    title: 'Lepidoptera',
    artist: 'Epoq',
    bpm: 124,
    duration: 180,
    url: 'https://commondatastorage.googleapis.com/codeskulptor-assets/Epoq-Lepidoptera.ogg',
    coverArt: 'https://picsum.photos/400/400?random=1',
    key: 'Am'
  },
  {
    id: 't2',
    title: 'Neverwritten RPG',
    artist: 'Kangaroo MusiQue',
    bpm: 120,
    duration: 210,
    url: 'https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Kangaroo_MusiQue_-_The_Neverwritten_Role_Playing_Game.mp3',
    coverArt: 'https://picsum.photos/400/400?random=2',
    key: 'C'
  },
  {
    id: 't3',
    title: 'Sevis',
    artist: 'Tenacious D',
    bpm: 128,
    duration: 240,
    url: 'https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Sevis.mp3', 
    coverArt: 'https://picsum.photos/400/400?random=3',
    key: 'Gm'
  }
];

export const YOUTUBE_MOCK_RESULTS: TrackMetadata[] = [
    {
        id: 'yt1',
        title: 'lofi hip hop radio - beats to relax/study to',
        artist: 'Lofi Girl',
        bpm: 80,
        duration: 1200,
        url: 'https://commondatastorage.googleapis.com/codeskulptor-demos/pyman_assets/intromusic.ogg', // Reliable alternative
        coverArt: 'https://i.ytimg.com/vi/jfKfPfyJRdk/maxresdefault.jpg',
        key: 'Cm'
    },
    {
        id: 'yt2',
        title: 'Boiler Room: Fred again..',
        artist: 'Fred again..',
        bpm: 128,
        duration: 3600,
        url: 'https://commondatastorage.googleapis.com/codeskulptor-assets/Epoq-Lepidoptera.ogg',
        coverArt: 'https://i.ytimg.com/vi/c0-hvjV2A5Y/maxresdefault.jpg',
        key: 'Fm'
    }
];
