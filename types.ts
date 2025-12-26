
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

const A4_REF_HZ = 432;

const noteToMidi = (label: string) => {
  const match = label.match(/^([A-Ga-g])([#b]?)(\d)$/);
  if (!match) return null;
  const letter = match[1].toUpperCase();
  const accidental = match[2];
  const octave = parseInt(match[3], 10);
  const base: Record<string, number> = {
    C: 0,
    D: 2,
    E: 4,
    F: 5,
    G: 7,
    A: 9,
    B: 11
  };
  let semitone = base[letter];
  if (accidental === '#') semitone += 1;
  if (accidental === 'b') semitone -= 1;
  return (octave + 1) * 12 + semitone;
};

const noteToFreq = (label: string, a4 = A4_REF_HZ) => {
  const midi = noteToMidi(label);
  if (midi === null) return 0;
  return a4 * Math.pow(2, (midi - 69) / 12);
};

export type ScaleType = 
  | 'Chakra C' 
  | 'Celtic Moon D' 
  | 'Sun D' 
  | 'Earth Om C#' 
  | 'Mystic E' 
  | 'Stardust C#' 
  | 'Planetary C';

// Frequencies shifted up one octave (multiplied by 2) for that higher crystal bowl sound
export const SCALES: Record<ScaleType, ScaleNote[]> = {
  'Chakra C': [
    { label: 'C5', freq: noteToFreq('C5'), color: '#FF7E7E', width: 95 },
    { label: 'D5', freq: noteToFreq('D5'), color: '#FFB84D', width: 90 },
    { label: 'E5', freq: noteToFreq('E5'), color: '#FFF24D', width: 85 },
    { label: 'F5', freq: noteToFreq('F5'), color: '#74E874', width: 80 },
    { label: 'G5', freq: noteToFreq('G5'), color: '#4D9BFF', width: 75 },
    { label: 'A5', freq: noteToFreq('A5'), color: '#7E7EFF', width: 70 },
    { label: 'B5', freq: noteToFreq('B5'), color: '#C67EFF', width: 65 },
    { label: 'C6', freq: noteToFreq('C6'), color: '#FF7EFC', width: 60 },
  ],
  'Celtic Moon D': [
    { label: 'D5', freq: noteToFreq('D5'), color: '#A5F3FC', width: 95 },
    { label: 'E5', freq: noteToFreq('E5'), color: '#93C5FD', width: 90 },
    { label: 'F5', freq: noteToFreq('F5'), color: '#A5B4FC', width: 85 },
    { label: 'G5', freq: noteToFreq('G5'), color: '#C4B5FD', width: 80 },
    { label: 'A5', freq: noteToFreq('A5'), color: '#DDD6FE', width: 75 },
    { label: 'Bb5', freq: noteToFreq('Bb5'), color: '#E9D5FF', width: 70 },
    { label: 'C6', freq: noteToFreq('C6'), color: '#F3E8FF', width: 65 },
    { label: 'D6', freq: noteToFreq('D6'), color: '#FFFFFF', width: 60 },
  ],
  'Sun D': [
    { label: 'D5', freq: noteToFreq('D5'), color: '#FDE68A', width: 95 },
    { label: 'E5', freq: noteToFreq('E5'), color: '#FCD34D', width: 90 },
    { label: 'F#5', freq: noteToFreq('F#5'), color: '#FBBF24', width: 85 },
    { label: 'G5', freq: noteToFreq('G5'), color: '#F59E0B', width: 80 },
    { label: 'A5', freq: noteToFreq('A5'), color: '#D97706', width: 75 },
    { label: 'B5', freq: noteToFreq('B5'), color: '#B45309', width: 70 },
    { label: 'C#6', freq: noteToFreq('C#6'), color: '#FDE68A', width: 65 },
    { label: 'D6', freq: noteToFreq('D6'), color: '#FFFBEB', width: 60 },
  ],
  'Earth Om C#': [
    { label: 'C#5', freq: noteToFreq('C#5'), color: '#86EFAC', width: 95 },
    { label: 'D#5', freq: noteToFreq('D#5'), color: '#4ADE80', width: 90 },
    { label: 'E5', freq: noteToFreq('E5'), color: '#22C55E', width: 85 },
    { label: 'F#5', freq: noteToFreq('F#5'), color: '#16A34A', width: 80 },
    { label: 'G#5', freq: noteToFreq('G#5'), color: '#15803D', width: 75 },
    { label: 'A5', freq: noteToFreq('A5'), color: '#166534', width: 70 },
    { label: 'B5', freq: noteToFreq('B5'), color: '#14532D', width: 65 },
    { label: 'C#6', freq: noteToFreq('C#6'), color: '#DCFCE7', width: 60 },
  ],
  'Mystic E': [
    { label: 'E5', freq: noteToFreq('E5'), color: '#F9A8D4', width: 95 },
    { label: 'F5', freq: noteToFreq('F5'), color: '#F472B6', width: 90 },
    { label: 'G#5', freq: noteToFreq('G#5'), color: '#EC4899', width: 85 },
    { label: 'A5', freq: noteToFreq('A5'), color: '#DB2777', width: 80 },
    { label: 'B5', freq: noteToFreq('B5'), color: '#BE185D', width: 75 },
    { label: 'C6', freq: noteToFreq('C6'), color: '#9D174D', width: 70 },
    { label: 'D#6', freq: noteToFreq('D#6'), color: '#831843', width: 65 },
    { label: 'E6', freq: noteToFreq('E6'), color: '#FFF1F2', width: 60 },
  ],
  'Stardust C#': [
    { label: 'C#5', freq: noteToFreq('C#5'), color: '#E9D5FF', width: 95 },
    { label: 'E5', freq: noteToFreq('E5'), color: '#D8B4FE', width: 90 },
    { label: 'F#5', freq: noteToFreq('F#5'), color: '#C084FC', width: 85 },
    { label: 'G#5', freq: noteToFreq('G#5'), color: '#A855F7', width: 80 },
    { label: 'B5', freq: noteToFreq('B5'), color: '#9333EA', width: 75 },
    { label: 'C#6', freq: noteToFreq('C#6'), color: '#7E22CE', width: 70 },
    { label: 'E6', freq: noteToFreq('E6'), color: '#6B21A8', width: 65 },
    { label: 'F#6', freq: noteToFreq('F#6'), color: '#FAF5FF', width: 60 },
  ],
  'Planetary C': [
    { label: 'C5', freq: noteToFreq('C5'), color: '#BAE6FD', width: 95 },
    { label: 'D5', freq: noteToFreq('D5'), color: '#7DD3FC', width: 90 },
    { label: 'Eb5', freq: noteToFreq('Eb5'), color: '#38BDF8', width: 85 },
    { label: 'F5', freq: noteToFreq('F5'), color: '#0EA5E9', width: 80 },
    { label: 'G5', freq: noteToFreq('G5'), color: '#0284C7', width: 75 },
    { label: 'Ab5', freq: noteToFreq('Ab5'), color: '#0369A1', width: 70 },
    { label: 'Bb5', freq: noteToFreq('Bb5'), color: '#075985', width: 65 },
    { label: 'C6', freq: noteToFreq('C6'), color: '#F0F9FF', width: 60 },
  ]
};
