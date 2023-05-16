import { GlobalStateModule } from './GlobalState';
import type { Entity } from './entity';
import { makeNoteResolver, numericalValue, type MusicKey, type Note, type NoteValues } from './music';
import type { Staff } from './music-gui/Staff';
import { StaffLine } from './music-gui/StaffLine';
import { PhantomNote, StaffNote } from './music-gui/StaffNote';
import { StaffSpace } from './music-gui/StaffSpace';
import { Point } from './point';
import { RenderEngine } from './renderEngine';
import { decrement, idxToPitch, increment } from './utils';

interface EngineEvents {
	entityClicked: (entity: Entity, metadata: { button: MouseButton; spacePos: Point; pagePos: Point }) => void;
	entityDblClicked: (entity: Entity) => void;
	click: (evt: MouseEvent) => void;
}

export enum MouseButton {
	LEFT,
	MIDDLE,
	RIGHT,
	BACK,
	FORWARD
}

export class Engine {
	private readonly context: CanvasRenderingContext2D;
	private readonly layers: Entity[][] = [];
	private readonly renderEngine: RenderEngine;

	public readonly globalState: GlobalStateModule;

	private _selectedEntity: Entity | null = null;
	private _hoveredEntity: Entity | null = null;
	private _mousePos: Point | null = null;
	private _mouseDown = false;
	private _mouseDelta: Point | null = null;

	private _listeners: { [K in keyof EngineEvents]: EngineEvents[K][] };
	private _phantomNote: PhantomNote | null = null;

	private mouseListener: (evt: MouseEvent) => void = (evt) => {
		if (this._mousePos) {
			this._mousePos = this.renderEngine.canvasToSpace(new Point(evt.offsetX, evt.offsetY));

			if (this._mouseDelta) {
				this._mouseDelta.x += evt.movementX;
				this._mouseDelta.y -= evt.movementY;
			}
		}
	};

	constructor(private readonly canvas: HTMLCanvasElement) {
		const ctx = canvas.getContext('2d');

		if (ctx) {
			this.context = ctx;
			this.renderEngine = new RenderEngine(ctx, canvas);

			this._listeners = { entityClicked: [], click: [], entityDblClicked: [] };

			this.globalState = new GlobalStateModule(this.renderEngine, 4, 4, 'cM', 'treble');

			canvas.addEventListener('mouseout', () => {
				this._mousePos = null;

				canvas.removeEventListener('mousemove', this.mouseListener);
			});

			canvas.addEventListener('mouseover', (evt) => {
				this._mousePos = new Point(evt.offsetX, evt.offsetY);

				canvas.addEventListener('mousemove', this.mouseListener);
			});

			canvas.addEventListener('mousedown', () => {
				this._mouseDown = true;
				this._mouseDelta = new Point();
			});

			canvas.addEventListener('mouseup', (evt: MouseEvent) => {
				this._mouseDown = false;
				this._mouseDelta = null;

				if (this._hoveredEntity) {
					if (evt.button === MouseButton.LEFT) {
						this._selectedEntity = this._hoveredEntity;
					}

					for (const listener of this._listeners.entityClicked) {
						listener(this._hoveredEntity, {
							button: evt.button,
							spacePos: this._mousePos!,
							pagePos: this.renderEngine.spaceToCanvas(this._mousePos!).add(new Point(16, 52))
						});
					}
				} else {
					if (evt.button === MouseButton.LEFT) {
						this._selectedEntity = null;
					}

					for (const listener of this._listeners.click) {
						listener(evt);
					}
				}
			});

			canvas.addEventListener('dblclick', () => {
				if (this._selectedEntity) {
					for (const listener of this._listeners.entityDblClicked) {
						listener(this._selectedEntity);
					}
				}
			});

			canvas.addEventListener('contextmenu', (evt: MouseEvent) => {
				if (this._selectedEntity) {
					evt.preventDefault();
				}
			});

			this.on('entityClicked', (entity, meta) => {
				if (meta.button === MouseButton.LEFT && this._phantomNote && (entity instanceof StaffLine || entity instanceof StaffSpace)) {
					const note = entity.bar.addNote({
						pitch: idxToPitch(entity.idx, entity instanceof StaffLine ? 'line' : 'space', 'treble'),
						value: this._phantomNote.value,
						slurred: false,
						accidental: null
					});
					this._phantomNote = null;
					this.globalState.augmentedBar = null;

					this._selectedEntity = note;
				}
			});
		} else {
			throw new Error('Unable to get canvas context');
		}
	}

	public add(entity: Entity, layer: number): void {
		while (layer >= this.layers.length) {
			this.layers.push([]);
		}

		this.layers[layer].push(entity);
	}

	public remove(entity: Entity, layer?: number): void {
		if (layer === undefined) {
			for (const layer of this.layers) {
				if (layer.includes(entity)) {
					layer.splice(layer.indexOf(entity), 1);
				}
			}
		} else {
			if (!this.layers[layer]) {
				throw new Error(`Layer ${layer} does not exist!`);
			} else if (!this.layers[layer].includes(entity)) {
				throw new Error(`Layer ${layer} does not contain entity!`);
			} else {
				this.layers[layer].splice(this.layers[layer].indexOf(entity), 1);
			}
		}
	}

	public start(): void {
		this._tick();
	}

	public on<T extends keyof EngineEvents>(evt: T, listener: EngineEvents[T]): () => void {
		this._listeners[evt].push(listener);

		return () => {
			this._listeners[evt].splice(this._listeners[evt].indexOf(listener), 1);
		};
	}

	public addBar(): void {
		for (const staff of this.layers[0] as Staff[]) {
			if (staff.calculateOccupiedWidth() <= 700) {
				staff.addBar();
				break;
			}
		}
	}

	public addNote(value: NoteValues): void {
		if (!this._phantomNote) {
			for (const staff of this.layers[0] as Staff[]) {
				for (const bar of staff.bars) {
					if (bar.calculateNoteValue() <= this.globalState.time[1] - numericalValue(value, this.globalState.time[1])) {
						this._phantomNote = new PhantomNote(value, null, this.globalState);
						return;
					}
				}
			}
		}
	}

	public cancel(): void {
		if (this._phantomNote) {
			this._phantomNote = null;
			this.globalState.augmentedBar = null;
		}
	}

	public incrementPitch(): void {
		if (this._selectedEntity && this._selectedEntity instanceof StaffNote) {
			this._selectedEntity.note.pitch = increment(this._selectedEntity.note.pitch);
		}
	}

	public decrementPitch(): void {
		if (this._selectedEntity && this._selectedEntity instanceof StaffNote) {
			this._selectedEntity.note.pitch = decrement(this._selectedEntity.note.pitch);
		}
	}

	public setKey(key: MusicKey): void {
		this.globalState.key = key;
	}

	public compile(): void {
		const notes = (this.layers[0] as Staff[]).reduce<Note[]>(
			(arr, staff) => [...arr, ...staff.bars.reduce<Note[]>((arr, bar) => [...arr, ...bar.notes], [])],
			[]
		);

		const fullNotes = notes.map(makeNoteResolver(this.globalState.key));

		console.log(fullNotes.map((note) => `${note.pitch} ${note.value} ${note.slurred ? 't' : 'f'}`).join('\n'));
	}

	public del(): void {
		if (this._selectedEntity) {
			if (this._selectedEntity instanceof StaffNote) {
				this._selectedEntity.bar.removeNote(this._selectedEntity);
			}
		}
	}

	private _tick(): void {
		requestAnimationFrame(() => this._tick());

		if (!this._mouseDown) {
			this._updateHoveredEntity();
		}

		if (this._hoveredEntity) {
			this.canvas.style.cursor = 'pointer';

			if (this._phantomNote && (this._hoveredEntity instanceof StaffLine || this._hoveredEntity instanceof StaffSpace)) {
				if (
					this._hoveredEntity.bar.calculateNoteValue() <=
					this.globalState.time[1] - numericalValue(this._phantomNote.value, this.globalState.time[1])
				) {
					this._phantomNote.staffPosition = this._hoveredEntity;
					this.globalState.augmentedBar = this._hoveredEntity.bar;
				} else {
					this._phantomNote.staffPosition = null;
					this.globalState.augmentedBar = null;
				}
			} else if (this._phantomNote) {
				this._phantomNote.staffPosition = null;
				this.globalState.augmentedBar = null;
			}
		} else {
			this.canvas.style.cursor = 'unset';
			if (this._phantomNote) {
				this._phantomNote.staffPosition = null;
				this.globalState.augmentedBar = null;
			}
		}

		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.context.fillStyle = 'white';
		this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
		this.context.fillStyle = 'black';
		this.layers.forEach((layer) => {
			layer.forEach((entity) => {
				entity.render(this.renderEngine, {
					selected: this._selectedEntity === entity,
					mouse: null,
					selectedEntity: this._selectedEntity,
					hoveredEntity: this._hoveredEntity
				});
			});
		});

		this._phantomNote?.render(this.renderEngine);

		if (this._mouseDelta) {
			this._mouseDelta = new Point();
		}
	}

	private _updateHoveredEntity(): void {
		if (this._mousePos) {
			const reversedLayers = this.layers.reduce<Entity[][]>((arr, layer) => [layer, ...arr], []);

			for (const layer of reversedLayers) {
				const reversedEntities = layer.reduce<Entity[]>((arr, entity) => [entity, ...arr], []);

				for (const entity of reversedEntities) {
					const selected = entity.selectedBy(this._mousePos);
					if (selected) {
						if (typeof selected === 'object') {
							this._hoveredEntity = selected;
						} else {
							this._hoveredEntity = entity;
						}
						return;
					}
				}
			}
		}

		this._hoveredEntity = null;
	}
}

