/**
 * Crystal Harp App — Type Definitions
 * All scales tuned to 432 Hz
 */

export type PlayMode = 'mallet' | 'water';

export interface ScaleNote {
    label: string;       // e.g. "C5"
    freq: number;        // Hz (432 Hz tuning)
    semitoneShift: number; // from nearest recorded sample
    sampleKey: string;   // which sample file to use
    color: string;       // tube accent color
    chakra?: string;     // optional chakra association
}

export interface ScaleDefinition {
    id: string;
    name: string;
    subtitle: string;
    description: string;
    notes: ScaleNote[];
    productUrl: string;  // Shopify product page
    colors: {
        primary: string;
        secondary: string;
        glow: string;
    };
}

// 432 Hz tuning reference
const A4 = 432;

function noteToFreq(note: string): number {
    const match = note.match(/^([A-G])([#b]?)(\d)$/);
    if (!match) return 0;
    const base: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
    let semitone = base[match[1]];
    if (match[2] === '#') semitone += 1;
    if (match[2] === 'b') semitone -= 1;
    const midi = (parseInt(match[3]) + 1) * 12 + semitone;
    return A4 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Calculate semitone shift from nearest recorded sample.
 * Recorded samples: C5, D5, E5, F5, G5, A5, B5, C6
 * (chromatic notes derived by pitch-shifting ±1-2 semitones)
 */
function calcShift(note: string): { shift: number; sampleKey: string } {
    const recorded = ['C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5', 'C6'];
    const noteToSemitone = (n: string): number => {
        const m = n.match(/^([A-G])([#b]?)(\d)$/);
        if (!m) return 0;
        const base: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
        let s = base[m[1]];
        if (m[2] === '#') s += 1;
        if (m[2] === 'b') s -= 1;
        return (parseInt(m[3]) + 1) * 12 + s;
    };

    const targetSemi = noteToSemitone(note);
    let bestSample = recorded[0];
    let bestShift = 999;

    for (const rec of recorded) {
        const diff = targetSemi - noteToSemitone(rec);
        if (Math.abs(diff) < Math.abs(bestShift)) {
            bestShift = diff;
            bestSample = rec;
        }
    }

    return { shift: bestShift, sampleKey: bestSample };
}

function makeNote(label: string, color: string, chakra?: string): ScaleNote {
    const { shift, sampleKey } = calcShift(label);
    return {
        label,
        freq: noteToFreq(label),
        semitoneShift: shift,
        sampleKey,
        color,
        chakra,
    };
}

export const SCALES: ScaleDefinition[] = [
    {
        id: 'chakra-c',
        name: 'Chakra C',
        subtitle: 'Pure Resonance',
        description: 'The classic chakra healing scale. Each note corresponds to one of the 7 energy centers. Ideal for full-body energy balancing and deep meditation.',
        productUrl: '/collections/all',
        colors: { primary: '#10b981', secondary: '#34d399', glow: 'rgba(16,185,129,0.3)' },
        notes: [
            makeNote('C5', '#EF4444', 'Root'),
            makeNote('D5', '#F97316', 'Sacral'),
            makeNote('E5', '#EAB308', 'Solar Plexus'),
            makeNote('F5', '#22C55E', 'Heart'),
            makeNote('G5', '#3B82F6', 'Throat'),
            makeNote('A5', '#6366F1', 'Third Eye'),
            makeNote('B5', '#A855F7', 'Crown'),
            makeNote('C6', '#EC4899', 'Higher Self'),
        ],
    },
    {
        id: 'celtic-moon-d',
        name: 'Celtic Moon D',
        subtitle: 'Lunar Energy',
        description: 'A mystical, ethereal scale inspired by Celtic tradition. Evokes moonlit landscapes and deep intuition. Perfect for evening meditation and emotional healing.',
        productUrl: '/collections/all',
        colors: { primary: '#818CF8', secondary: '#A5B4FC', glow: 'rgba(129,140,248,0.3)' },
        notes: [
            makeNote('D5', '#A5F3FC'),
            makeNote('E5', '#93C5FD'),
            makeNote('F5', '#A5B4FC'),
            makeNote('G5', '#C4B5FD'),
            makeNote('A5', '#DDD6FE'),
            makeNote('C6', '#E9D5FF'),
            makeNote('D6', '#F3E8FF'),
            makeNote('E6', '#EDE9FE'),
        ],
    },
    {
        id: 'celestial-sun-d',
        name: 'Celestial Sun D',
        subtitle: 'Solar Radiance',
        description: 'A warm, uplifting scale that channels solar energy. Promotes vitality, confidence, and joy. Ideal for morning practice and energizing sessions.',
        productUrl: '/collections/all',
        colors: { primary: '#F59E0B', secondary: '#FCD34D', glow: 'rgba(245,158,11,0.3)' },
        notes: [
            makeNote('D5', '#FDE68A'),
            makeNote('E5', '#FCD34D'),
            makeNote('F#5', '#FBBF24'),
            makeNote('G5', '#F59E0B'),
            makeNote('A5', '#D97706'),
            makeNote('B5', '#B45309'),
            makeNote('C#6', '#FDE68A'),
            makeNote('D6', '#FFFBEB'),
        ],
    },
    {
        id: 'earth-om-c#',
        name: 'Earth Om C#',
        subtitle: 'Ancient Roots',
        description: 'Tuned to the Earth\'s Om frequency (136.1 Hz overtone). Deeply grounding and centering. Used in traditional sound healing for reconnecting with nature.',
        productUrl: '/collections/all',
        colors: { primary: '#22C55E', secondary: '#4ADE80', glow: 'rgba(34,197,94,0.3)' },
        notes: [
            makeNote('C#5', '#86EFAC'),
            makeNote('E5', '#4ADE80'),
            makeNote('F#5', '#22C55E'),
            makeNote('G#5', '#16A34A'),
            makeNote('A5', '#15803D'),
            makeNote('B5', '#166534'),
            makeNote('C#6', '#14532D'),
            makeNote('E6', '#DCFCE7'),
        ],
    },
    {
        id: 'mystic-e',
        name: 'Mystic E',
        subtitle: 'Inner Vision',
        description: 'A scale of deep mystery and inner exploration. Opens the third eye and enhances intuition. Excellent for visualization and dream work.',
        productUrl: '/collections/all',
        colors: { primary: '#EC4899', secondary: '#F472B6', glow: 'rgba(236,72,153,0.3)' },
        notes: [
            makeNote('E5', '#F9A8D4'),
            makeNote('F5', '#F472B6'),
            makeNote('G#5', '#EC4899'),
            makeNote('A5', '#DB2777'),
            makeNote('B5', '#BE185D'),
            makeNote('C6', '#9D174D'),
            makeNote('D6', '#831843'),
            makeNote('E6', '#FFF1F2'),
        ],
    },
    {
        id: 'stardust-c#',
        name: 'Stardust C#',
        subtitle: 'Cosmic Shimmer',
        description: 'A luminous, sparkling scale that evokes the vastness of the cosmos. Creates an ethereal atmosphere perfect for deep space meditation and astral work.',
        productUrl: '/collections/all',
        colors: { primary: '#A855F7', secondary: '#C084FC', glow: 'rgba(168,85,247,0.3)' },
        notes: [
            makeNote('C#5', '#E9D5FF'),
            makeNote('D#5', '#D8B4FE'),
            makeNote('E5', '#C084FC'),
            makeNote('F#5', '#A855F7'),
            makeNote('G#5', '#9333EA'),
            makeNote('A5', '#7E22CE'),
            makeNote('B5', '#6B21A8'),
            makeNote('C#6', '#FAF5FF'),
        ],
    },
    {
        id: 'planetary-c',
        name: 'Planetary C',
        subtitle: 'Planetary Resonance',
        description: 'Based on planetary frequency ratios. A rich, enveloping minor scale that resonates with cosmic cycles. Ideal for deep relaxation and planetary healing.',
        productUrl: '/collections/all',
        colors: { primary: '#0EA5E9', secondary: '#38BDF8', glow: 'rgba(14,165,233,0.3)' },
        notes: [
            makeNote('C5', '#BAE6FD'),
            makeNote('D5', '#7DD3FC'),
            makeNote('Eb5', '#38BDF8'),
            makeNote('F5', '#0EA5E9'),
            makeNote('G5', '#0284C7'),
            makeNote('Ab5', '#0369A1'),
            makeNote('Bb5', '#075985'),
            makeNote('C6', '#F0F9FF'),
        ],
    },
];

export const SCALE_ORDER = SCALES.map(s => s.id);
