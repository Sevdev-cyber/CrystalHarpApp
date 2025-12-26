
export interface Message {
  role: 'user' | 'model';
  text: string;
}

export interface Soundscape {
  id: string;
  name: string;
  description: string;
  type: 'crystal' | 'ambient' | 'nature';
}

export interface ScaleNote {
  label: string;
  freq: number;
  color: string;
  width: number;
}

export type ScaleType = 
  | 'Chakra C' 
  | 'Celtic Moon D' 
  | 'Celestial Sun D' 
  | 'Earth On Cis' 
  | 'Mystic Moon D' 
  | 'Stardust Cis' 
  | 'Planetary C';

// Frequencies shifted up one octave (multiplied by 2) for that higher crystal bowl sound
export const SCALES: Record<ScaleType, ScaleNote[]> = {
  'Chakra C': [
    { label: 'C5', freq: 523.25, color: '#FF7E7E', width: 95 },
    { label: 'D5', freq: 587.33, color: '#FFB84D', width: 90 },
    { label: 'E5', freq: 659.25, color: '#FFF24D', width: 85 },
    { label: 'F5', freq: 698.46, color: '#74E874', width: 80 },
    { label: 'G5', freq: 783.99, color: '#4D9BFF', width: 75 },
    { label: 'A5', freq: 880.00, color: '#7E7EFF', width: 70 },
    { label: 'B5', freq: 987.77, color: '#C67EFF', width: 65 },
    { label: 'C6', freq: 1046.50, color: '#FF7EFC', width: 60 },
  ],
  'Celtic Moon D': [
    { label: 'D5', freq: 587.33, color: '#A5F3FC', width: 95 },
    { label: 'E5', freq: 659.25, color: '#93C5FD', width: 90 },
    { label: 'F5', freq: 698.46, color: '#A5B4FC', width: 85 },
    { label: 'G5', freq: 783.99, color: '#C4B5FD', width: 80 },
    { label: 'A5', freq: 880.00, color: '#DDD6FE', width: 75 },
    { label: 'Bb5', freq: 932.33, color: '#E9D5FF', width: 70 },
    { label: 'C6', freq: 1046.50, color: '#F3E8FF', width: 65 },
    { label: 'D6', freq: 1174.66, color: '#FFFFFF', width: 60 },
  ],
  'Celestial Sun D': [
    { label: 'D5', freq: 587.33, color: '#FDE68A', width: 95 },
    { label: 'E5', freq: 659.25, color: '#FCD34D', width: 90 },
    { label: 'F#5', freq: 739.99, color: '#FBBF24', width: 85 },
    { label: 'G5', freq: 783.99, color: '#F59E0B', width: 80 },
    { label: 'A5', freq: 880.00, color: '#D97706', width: 75 },
    { label: 'B5', freq: 987.77, color: '#B45309', width: 70 },
    { label: 'C#6', freq: 1108.73, color: '#FDE68A', width: 65 },
    { label: 'D6', freq: 1174.66, color: '#FFFBEB', width: 60 },
  ],
  'Earth On Cis': [
    { label: 'C#5', freq: 554.37, color: '#86EFAC', width: 95 },
    { label: 'D#5', freq: 622.25, color: '#4ADE80', width: 90 },
    { label: 'E5', freq: 659.25, color: '#22C55E', width: 85 },
    { label: 'F#5', freq: 739.99, color: '#16A34A', width: 80 },
    { label: 'G#5', freq: 830.61, color: '#15803D', width: 75 },
    { label: 'A5', freq: 880.00, color: '#166534', width: 70 },
    { label: 'B5', freq: 987.77, color: '#14532D', width: 65 },
    { label: 'C#6', freq: 1108.73, color: '#DCFCE7', width: 60 },
  ],
  'Mystic Moon D': [
    { label: 'D5', freq: 587.33, color: '#F9A8D4', width: 95 },
    { label: 'Eb5', freq: 622.25, color: '#F472B6', width: 90 },
    { label: 'F5', freq: 698.46, color: '#EC4899', width: 85 },
    { label: 'G5', freq: 783.99, color: '#DB2777', width: 80 },
    { label: 'Ab5', freq: 830.61, color: '#BE185D', width: 75 },
    { label: 'Bb5', freq: 932.33, color: '#9D174D', width: 70 },
    { label: 'C6', freq: 1046.50, color: '#831843', width: 65 },
    { label: 'D6', freq: 1174.66, color: '#FFF1F2', width: 60 },
  ],
  'Stardust Cis': [
    { label: 'C#5', freq: 554.37, color: '#E9D5FF', width: 95 },
    { label: 'E5', freq: 659.25, color: '#D8B4FE', width: 90 },
    { label: 'F#5', freq: 739.99, color: '#C084FC', width: 85 },
    { label: 'G#5', freq: 830.61, color: '#A855F7', width: 80 },
    { label: 'B5', freq: 987.77, color: '#9333EA', width: 75 },
    { label: 'C#6', freq: 1108.73, color: '#7E22CE', width: 70 },
    { label: 'E6', freq: 1318.51, color: '#6B21A8', width: 65 },
    { label: 'F#6', freq: 1479.98, color: '#FAF5FF', width: 60 },
  ],
  'Planetary C': [
    { label: 'C5', freq: 523.25, color: '#BAE6FD', width: 95 },
    { label: 'D5', freq: 587.33, color: '#7DD3FC', width: 90 },
    { label: 'Eb5', freq: 622.25, color: '#38BDF8', width: 85 },
    { label: 'F5', freq: 698.46, color: '#0EA5E9', width: 80 },
    { label: 'G5', freq: 783.99, color: '#0284C7', width: 75 },
    { label: 'Ab5', freq: 830.61, color: '#0369A1', width: 70 },
    { label: 'Bb5', freq: 932.33, color: '#075985', width: 65 },
    { label: 'C6', freq: 1046.50, color: '#F0F9FF', width: 60 },
  ]
};
