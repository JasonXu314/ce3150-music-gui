import type { GlobalStateModule } from '../GlobalState';
import { Entity, type Metadata } from '../entity';
import type { Point } from '../point';
import type { RenderEngine } from '../renderEngine';
import type { StaffNote } from './StaffNote';

export class Slur extends Entity {
	constructor(public readonly from: StaffNote, public readonly to: StaffNote, private readonly state: GlobalStateModule) {
		super();
	}

	public render(renderEngine: RenderEngine, metadata: Metadata): void {
		throw new Error('Method not implemented.');
	}

	public selectedBy(point: Point): boolean | Entity {
		throw new Error('Method not implemented.');
	}
}

