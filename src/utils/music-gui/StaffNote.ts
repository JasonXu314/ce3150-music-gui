import type { GlobalStateModule } from '../GlobalState';
import { Entity, type Metadata } from '../entity';
import type { Note, NoteType, NoteValues } from '../music';
import { Point } from '../point';
import type { RenderEngine } from '../renderEngine';
import { noteType, outOfBounds, pitchToYOffset } from '../utils';
import type { Bar } from './Bar';
import { StaffLine } from './StaffLine';
import type { StaffSpace } from './StaffSpace';

export class PhantomNote extends Entity {
	constructor(public readonly value: NoteValues, public staffPosition: StaffLine | StaffSpace | null, private readonly state: GlobalStateModule) {
		super();
	}

	public render(renderEngine: RenderEngine): void {
		if (this.staffPosition) {
			renderEngine.text(this.calculatePosition(), StaffNote.format(this.value, this.staffPosition instanceof StaffLine ? 'line' : 'space', null), {
				font: '36px music'
			});
		}
	}

	public selectedBy(point: Point): boolean | Entity {
		if (this.staffPosition) {
			return this.calculatePosition().distanceTo(point) <= 12.5;
		} else {
			return false;
		}
	}

	public calculatePosition(): Point {
		if (this.staffPosition) {
			const { center, width } = this.staffPosition.bar.calculateDims();

			return center.add(
				new Point(
					-width / 2 + 25 + this.staffPosition.bar.notes.length * 50,
					(this.staffPosition instanceof StaffLine ? 20 : 15) -
						this.staffPosition.idx * 10 -
						0.5 +
						(this.value === 'w' || this.value === 'dw' ? 5 : 0)
				)
			);
		} else {
			throw new Error('Cannot calculate position when not aligned to staff');
		}
	}
}

export class StaffNote extends Entity {
	constructor(public readonly bar: Bar, public readonly idx: number, public note: Note, private readonly state: GlobalStateModule) {
		super();
	}

	public render(renderEngine: RenderEngine, metadata: Metadata): void {
		const position = this.calculatePosition();
		const { center: barCenter } = this.bar.calculateDims();

		if (outOfBounds(this.note.pitch, this.state.clef)) {
			for (let yOffset = noteType(this.note.pitch, this.state.clef) === 'line' ? 0 : -5; position.y + yOffset + 0.5 - barCenter.y >= 30; yOffset -= 10) {
				renderEngine.line(position.add(new Point(-12.5, yOffset)), position.add(new Point(12.5, yOffset)));
			}
			for (let yOffset = noteType(this.note.pitch, this.state.clef) === 'line' ? 0 : 5; position.y + yOffset + 0.5 - barCenter.y <= -30; yOffset += 10) {
				renderEngine.line(position.add(new Point(-12.5, yOffset)), position.add(new Point(12.5, yOffset)));
			}
		}

		renderEngine.text(position, StaffNote.format(this.note.value, noteType(this.note.pitch, this.state.clef), this.note.accidental), {
			font: '36px music',
			color: metadata.selectedEntity === this || metadata.hoveredEntity === this ? 'rgb(175, 175, 225)' : 'black'
		});
	}

	public selectedBy(point: Point): boolean | Entity {
		return this.calculatePosition().distanceTo(point) <= 12.5;
	}

	public calculatePosition(): Point {
		const { center, width } = this.bar.calculateDims();

		return center.add(
			new Point(
				-width / 2 + 25 + this.idx * 50,
				pitchToYOffset(this.note.pitch, this.state.clef === 'treble' ? 'b4' : 'd2') -
					0.5 +
					(this.note.value === 'w' || this.note.value === 'dw' ? 5 : 0)
			)
		);
	}

	public static format(note: NoteValues, type: NoteType, accidental: string | null): string {
		if (accidental) {
			return note.startsWith('d') ? `${accidental}${note.slice(1)} ${type === 'line' ? '.' : 'k'}` : `${accidental}${note}`;
		}

		return note.startsWith('d') ? `${note.slice(1)} ${type === 'line' ? '.' : 'k'}` : note;
	}
}

