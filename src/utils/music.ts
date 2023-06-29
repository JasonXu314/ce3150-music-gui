//					 0 s/f   1s    1f     2s     2f      3s     3f      4s     4f      5s
export type Majors = 'cM' | 'gM' | 'fM' | 'dM' | 'bbM' | 'aM' | 'ebM' | 'eM' | 'dbM' | 'bM';
export type Minors = 'am' | 'em' | 'dm' | 'bm' | 'gm' | 'f#m' | 'cm' | 'c#m';
export type MusicKey = Majors | Minors;

export type Pitches = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g';
export type Octaves = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type ReducedPitch = `${Pitches}${Octaves}`;
export type FullPitch = `${Pitches}#${Octaves}` | `${Pitches}b${Octaves}` | ReducedPitch;

export type NoteValues = 'dw' | 'w' | 'dh' | 'h' | 'dq' | 'q' | 'de' | 'e' | 'ds' | 's' | 't';

export type NoteType = 'space' | 'line';
export type Clef = 'treble' | 'bass'; // fuck violas amirite lmao

export interface Note {
	pitch: ReducedPitch;
	value: NoteValues;
	slurred: boolean;
	accidental: '#' | 'b' | null;
	rest: boolean;
}

export interface FullNote {
	pitch: FullPitch;
	value: NoteValues;
	slurred: boolean;
	rest: boolean;
}

export interface KeyData {
	modifiedPitches: Pitches[];
	modifier: '#' | 'b';
}

export function reduce(pitch: FullPitch): ReducedPitch {
	return (pitch.length > 2 ? pitch.substring(0, 1) + pitch.substring(2, 3) : pitch) as ReducedPitch;
}

export function numericalValue(noteValue: NoteValues, timeD: number): number {
	switch (noteValue) {
		case 'dw':
			return timeD * 1.5;
		case 'w':
			return timeD;
		case 'dh':
			return timeD * 0.75;
		case 'h':
			return timeD * 0.5;
		case 'dq':
			return (timeD / 4) * 1.5;
		case 'q':
			return timeD / 4;
		case 'de':
			return (timeD / 8) * 1.5;
		case 'e':
			return timeD / 8;
		case 'ds':
			return (timeD / 16) * 1.5;
		case 's':
			return timeD / 16;
		case 't':
			return timeD / 32;
	}
}

export function makeNoteResolver(key: MusicKey): (note: Note) => FullNote {
	const { modifier, modifiedPitches } = getKeyData(key);

	return (note: Note) =>
		!note.accidental
			? {
					...note,
					pitch: `${note.pitch.slice(0, 1)}${modifiedPitches.includes(note.pitch.slice(0, 1) as Pitches) ? modifier : ''}${note.pitch.slice(
						1
					)}` as FullPitch
			  }
			: { ...note, pitch: `${note.pitch.slice(0, 1)}${note.accidental}${note.pitch.slice(1)}` as FullPitch };
}

export function getKeyData(key: MusicKey): KeyData {
	switch (key) {
		case 'cM':
		case 'am':
			return {
				modifiedPitches: [],
				modifier: '#'
			};
		case 'gM':
		case 'em':
			return {
				modifiedPitches: ['f'],
				modifier: '#'
			};
		case 'dM':
		case 'bm':
			return {
				modifiedPitches: ['f', 'c'],
				modifier: '#'
			};
		case 'aM':
		case 'f#m':
			return {
				modifiedPitches: ['f', 'c', 'g'],
				modifier: '#'
			};
		case 'eM':
		case 'c#m':
			return {
				modifiedPitches: ['f', 'c', 'g', 'd'],
				modifier: '#'
			};
		case 'bM':
			return {
				modifiedPitches: ['f', 'c', 'g', 'd', 'a'],
				modifier: '#'
			};
		case 'fM':
		case 'dm':
			return {
				modifiedPitches: ['b'],
				modifier: 'b'
			};
		case 'bbM':
		case 'gm':
			return {
				modifiedPitches: ['b', 'e'],
				modifier: 'b'
			};
		case 'ebM':
		case 'cm':
			return {
				modifiedPitches: ['b', 'e', 'a'],
				modifier: 'b'
			};
		case 'dbM':
			return {
				modifiedPitches: ['b', 'e', 'a', 'd'],
				modifier: 'b'
			};
	}
}

