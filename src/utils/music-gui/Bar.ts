import type { GlobalStateModule } from '../GlobalState';
import { Entity, type Metadata } from '../entity';
import { numericalValue, type Note } from '../music';
import { Point } from '../point';
import type { RenderEngine } from '../renderEngine';
import type { Staff } from './Staff';
import { StaffLine } from './StaffLine';
import { StaffNote } from './StaffNote';
import { StaffSpace } from './StaffSpace';

interface DimsData {
	center: Point;
	width: number;
}

export class Bar extends Entity {
	private readonly lines: StaffLine[];
	private readonly spaces: StaffSpace[];
	private readonly _notes: StaffNote[] = [];

	constructor(public readonly staff: Staff, public readonly idx: number, private readonly state: GlobalStateModule) {
		super();

		this.lines = new Array(5).fill(null).map((_, i) => new StaffLine(this, i, state));
		this.spaces = new Array(4).fill(null).map((_, i) => new StaffSpace(this, i, state));
	}

	public get notes(): readonly Note[] {
		return this._notes.map((sn) => sn.note);
	}

	public render(renderEngine: RenderEngine, metadata: Metadata): void {
		const { center, width } = this.calculateDims();

		renderEngine.line(center.add(new Point(-width / 2, 20)), center.add(new Point(-width / 2, -20)));

		if (!this.staff.isLastBar(this)) {
			renderEngine.line(center.add(new Point(width / 2, 20)), center.add(new Point(width / 2, -20)));
		}

		this.lines.forEach((line) => line.render(renderEngine, metadata));
		this.spaces.forEach((space) => space.render(renderEngine, metadata));

		this._notes.forEach((note) => note.render(renderEngine, metadata));
	}

	public selectedBy(point: Point): boolean | Entity {
		return (
			this._notes.find((sn) => sn.selectedBy(point)) ||
			this.lines.find((line) => line.selectedBy(point)) ||
			this.spaces.find((space) => space.selectedBy(point)) ||
			false
		);
	}

	public calculateWidth(): number {
		return Math.max(
			this._notes.reduce((total, sn) => (sn.note.value === 'w' ? total + 50 : total + 50), 0) + (this.state.augmentedBar === this ? 50 : 0),
			200
		);
	}

	public calculateDims(): DimsData {
		const leftMargin = this.staff.calculatePreceedingWidth(this),
			isLastBar = this.staff.isLastBar(this),
			width = this.calculateWidth();

		return isLastBar
			? {
					center: new Point(
						-this.state.renderEngine.width / 2 + 200 + leftMargin / 2 + 450,
						this.state.renderEngine.height / 2 - 70 - 150 * this.staff.idx
					),
					width: 900 - leftMargin
			  }
			: {
					center: new Point(
						-this.state.renderEngine.width / 2 + 200 + leftMargin + width / 2,
						this.state.renderEngine.height / 2 - 70 - 150 * this.staff.idx
					),
					width
			  };
	}

	public calculateNoteValue(): number {
		return this._notes.reduce((total, sn) => total + numericalValue(sn.note.value, this.state.time[1]), 0);
	}

	public addNote(note: Note): StaffNote {
		const newNote = new StaffNote(this, this._notes.length, note, note.rest, this.state);
		this._notes.push(newNote);
		return newNote;
	}

	public removeNote(note: StaffNote) {
		this._notes.splice(note.idx, 1);
	}
}

