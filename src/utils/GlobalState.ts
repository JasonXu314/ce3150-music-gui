import type { Clef, MusicKey } from './music';
import type { Bar } from './music-gui/Bar';
import type { RenderEngine } from './renderEngine';

export class GlobalStateModule {
	public augmentedBar: Bar | null = null;

	constructor(private readonly _renderEngine: RenderEngine, private _timeN: number, private _timeD: number, public key: MusicKey, private _clef: Clef) {}

	public get renderEngine(): RenderEngine {
		return this._renderEngine;
	}

	public get time(): [number, number] {
		return [this._timeN, this._timeD];
	}

	public get clef(): Clef {
		return this._clef;
	}
}

