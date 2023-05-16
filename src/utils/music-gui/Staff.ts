import type { GlobalStateModule } from '../GlobalState';
import { Entity, type Metadata } from '../entity';
import { getKeyData } from '../music';
import { Point } from '../point';
import type { RenderEngine } from '../renderEngine';
import { pitchToYOffset } from '../utils';
import { Bar } from './Bar';

export class Staff extends Entity {
	private readonly _bars: Bar[];

	constructor(public readonly idx: number, private readonly state: GlobalStateModule) {
		super();

		this._bars = [new Bar(this, 0, state)];
	}

	public render(renderEngine: RenderEngine, metadata: Metadata): void {
		const center = new Point(50, renderEngine.height / 2 - 70 - this.idx * 80);

		for (let i = 1; i <= 3; i++) {
			renderEngine.line(center.add(new Point(-450, 20 - 10 * i)), center.add(new Point(450, 20 - 10 * i)));
		}

		if (this.idx === 0) {
			renderEngine.rect(center, 900, 40);

			renderEngine.text(center.add(new Point(-435, -6)), this.state.clef === 'treble' ? '&' : '?', { font: '36px music' });
			renderEngine.text(center.add(new Point(-415, 14)), this.state.time[0].toString(), { font: '40px music' });
			renderEngine.text(center.add(new Point(-415, -6)), this.state.time[1].toString(), { font: '40px music' });

			this._renderKey();

			this._bars.forEach((bar) => bar.render(renderEngine, metadata));
		} else {
			renderEngine.rect(center, 900, 40);

			renderEngine.text(center.add(new Point(-435, -6)), this.state.clef === 'treble' ? '&' : '?', { font: '36px music' });

			this._renderKey();

			this._bars.forEach((bar) => bar.render(renderEngine, metadata));
		}
	}

	public isLastBar(bar: Bar): boolean {
		return bar === this._bars[this._bars.length - 1];
	}

	public calculatePreceedingWidth(bar: Bar): number {
		let width = this.idx === 0 ? 100 : 75;

		for (const thisBar of this._bars) {
			if (thisBar === bar) {
				return width;
			}

			width += thisBar.calculateWidth();
		}

		throw new Error('Should not get to end of width loop');
	}

	public calculateOccupiedWidth(): number {
		return this._bars.reduce((total, bar) => total + bar.calculateWidth(), 0) + (this.idx === 0 ? 100 : 75);
	}

	public selectedBy(point: Point): boolean | Entity {
		return this._bars.reduce<boolean | Entity>((prev, bar) => (prev ? prev : bar.selectedBy(point)), false);
	}

	public addBar(): void {
		this._bars.push(new Bar(this, this._bars.length, this.state));
	}

	public get bars(): readonly Bar[] {
		return this._bars;
	}

	private _renderKey(): void {
		if (this.state.key !== 'cM' && this.state.key !== 'am') {
			const { modifiedPitches, modifier } = getKeyData(this.state.key);
			const center = new Point(50, this.state.renderEngine.height / 2 - 70 - this.idx * 80);

			modifiedPitches.forEach((pitch, i) => {
				const pos = center.add(
					new Point(
						(this.idx === 0 ? -400 : -410) + i * 10,
						pitchToYOffset(`${pitch}${pitch === 'a' || pitch === 'b' ? 4 : 5}`, this.state.clef === 'treble' ? 'b4' : 'd2') + 4.5
					)
				);

				this.state.renderEngine.text(pos, modifier, { font: '36px music' });
			});
		}
	}
}

