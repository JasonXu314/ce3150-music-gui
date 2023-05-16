import type { Clef, NoteType, Pitches, ReducedPitch } from './music';

export const PITCH_ORDER = [
	'c0',
	'd0',
	'e0',
	'f0',
	'g0',
	'a0',
	'b0',
	'c1',
	'd1',
	'e1',
	'f1',
	'g1',
	'a1',
	'b1',
	'c2',
	'd2',
	'e2',
	'f2',
	'g2',
	'a2',
	'b2',
	'c3',
	'd3',
	'e3',
	'f3',
	'g3',
	'a3',
	'b3',
	'c4',
	'd4',
	'e4',
	'f4',
	'g4',
	'a4',
	'b4',
	'c5',
	'd5',
	'e5',
	'f5',
	'g5',
	'a5',
	'b5',
	'c6',
	'd6',
	'e6',
	'f6',
	'g6',
	'a6',
	'b6',
	'c7',
	'd7',
	'e7',
	'f7',
	'g7',
	'a7',
	'b7',
	'c8',
	'd8',
	'e8',
	'f8',
	'g8',
	'a8',
	'b8'
];

export const PITCH_IDXS = {
	treble: {
		line: ['f5', 'd5', 'b4', 'g4', 'e4'],
		space: ['e5', 'c5', 'a4', 'f4']
	},
	bass: {
		line: ['a3', 'f3', 'd2', 'b2', 'g2'],
		space: []
	}
} as const;

export enum SelectTarget {
	NORMAL,
	BAR,
	STAFF
}

export function pitchToYOffset(pitch: ReducedPitch, reference: ReducedPitch): number {
	const bIdx = PITCH_ORDER.indexOf(reference);

	return (PITCH_ORDER.indexOf(pitch) - bIdx) * 5;
}

export function outOfBounds(pitch: ReducedPitch, clef: Clef): boolean {
	const offset = pitchToYOffset(pitch, clef === 'treble' ? 'b4' : 'd2');

	return offset > 25 || offset < -25;
}

export function idxToPitch(idx: number, type: NoteType, clef: Clef): ReducedPitch {
	return PITCH_IDXS[clef][type][idx];
}

export function noteType(pitch: ReducedPitch, clef: Clef): NoteType {
	return clef === 'treble' ? ((PITCH_ORDER.indexOf(pitch) - PITCH_ORDER.indexOf('b4')) % 2 === 0 ? 'line' : 'space') : 'space'; // TODO: account for bass clef
}

export function increment(pitch: Pitches): Pitches;
export function increment(pitch: ReducedPitch): ReducedPitch;
export function increment(pitch: Pitches | ReducedPitch): ReducedPitch | Pitches {
	if (pitch.length === 1) {
		if (pitch === 'g') {
			return 'a';
		} else {
			return String.fromCharCode(pitch.charCodeAt(0) + 1) as Pitches;
		}
	}

	if (pitch.length === 3) {
		const [name, accidental, octave] = pitch.split('');

		if (name === 'b') {
			return `c${accidental}${parseInt(octave) + 1}` as ReducedPitch;
		} else {
			return `${increment(name as Pitches)}${accidental}${octave}` as ReducedPitch;
		}
	} else {
		const [name, octave] = pitch.split('');

		if (name === 'b') {
			return `c${parseInt(octave) + 1}` as ReducedPitch;
		} else {
			return `${increment(name as Pitches)}${octave}` as ReducedPitch;
		}
	}
}

export function decrement(pitch: Pitches): Pitches;
export function decrement(pitch: ReducedPitch): ReducedPitch;
export function decrement(pitch: Pitches | ReducedPitch): ReducedPitch | Pitches {
	if (pitch.length === 1) {
		if (pitch === 'a') {
			return 'g';
		} else {
			return String.fromCharCode(pitch.charCodeAt(0) - 1) as Pitches;
		}
	}

	if (pitch.length === 3) {
		const [name, accidental, octave] = pitch.split('');

		if (name === 'c') {
			return `b${accidental}${parseInt(octave) - 1}` as ReducedPitch;
		} else {
			return `${decrement(name as Pitches)}${accidental}${octave}` as ReducedPitch;
		}
	} else {
		const [name, octave] = pitch.split('');

		if (name === 'c') {
			return `b${parseInt(octave) - 1}` as ReducedPitch;
		} else {
			return `${decrement(name as Pitches)}${octave}` as ReducedPitch;
		}
	}
}

