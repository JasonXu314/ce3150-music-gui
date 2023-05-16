import type { GlobalStateModule } from '../GlobalState';
import { Entity, type Metadata } from '../entity';
import { Point } from '../point';
import type { RenderEngine } from '../renderEngine';
import type { Bar } from './Bar';

export class StaffLine extends Entity {
	constructor(public readonly bar: Bar, public readonly idx: number, private readonly state: GlobalStateModule) {
		super();
	}

	public render(renderEngine: RenderEngine, metadata: Metadata): void {
		const { center, width } = this.bar.calculateDims();

		if (metadata.hoveredEntity === this) {
			const from = center.add(new Point(-width / 2, 20)).add(new Point(0, -10 * this.idx)),
				to = center.add(new Point(width / 2, 20)).add(new Point(0, -10 * this.idx));

			renderEngine.line(from, to, 6, 'rgba(200, 200, 255, 0.5)');
		}
	}

	public selectedBy(point: Point): boolean | Entity {
		const { center, width } = this.bar.calculateDims();
		const lineCenter = center.add(new Point(0, 20 - 10 * this.idx));

		return Math.abs(lineCenter.y - point.y) <= 2.5 && point.x >= lineCenter.x - width / 2 && point.x <= lineCenter.x + width / 2;
	}
}

