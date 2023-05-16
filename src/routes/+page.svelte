<script lang="ts">
	import { hotkey } from '@svelteuidev/composables';
	import { Button, Group, NativeSelect } from '@svelteuidev/core';
	import { onMount } from 'svelte';
	import { Engine } from '../utils/engine';
	import type { MusicKey, NoteValues } from '../utils/music';
	import { Staff } from '../utils/music-gui/Staff';

	let canvas: HTMLCanvasElement | undefined,
		engine: Engine | undefined,
		staffIdx = 0,
		noteValue = 'q',
		dotted = false,
		key: MusicKey = 'cM';

	onMount(() => {
		if (canvas) {
			engine = new Engine(canvas);

			(window as any).engine = engine;

			engine.add(new Staff(staffIdx++, engine.globalState), 0);

			engine.start();
		}
	});

	function addNote(value: string) {
		if (engine) {
			engine.addNote(dotted && !value.startsWith('d') ? (('d' + value) as NoteValues) : (value as NoteValues));
			dotted = false;
		}
	}

	$: engine?.setKey(key);
</script>

<Group
	use={[
		[
			hotkey,
			[
				['ArrowUp', () => engine?.incrementPitch()],
				['ArrowDown', () => engine?.decrementPitch()],
				['Escape', () => engine?.cancel()],
				['Delete', () => engine?.del()],
				['Backspace', () => engine?.del()]
			]
		]
	]}
>
	<Button on:click={() => engine?.add(new Staff(staffIdx++, engine.globalState), 0)}>Add Line</Button>
	<Button on:click={() => engine?.addBar()}>Add Bar</Button>
	<Button
		on:click={() => addNote(noteValue)}
		use={[
			[
				hotkey,
				[
					['d', () => (dotted = true)],
					['w', () => addNote('w')],
					['h', () => addNote('h')],
					['q', () => addNote('q')],
					['e', () => addNote('e')],
					['s', () => addNote('s')],
					['t', () => addNote('t')]
				]
			]
		]}>Add Note</Button
	>
	<NativeSelect
		data={[
			{ label: 'Dotted Whole', value: 'dw' },
			{ label: 'Whole', value: 'w' },
			{ label: 'Dotted Half', value: 'dh' },
			{ label: 'Half', value: 'h' },
			{ label: 'Dotted Quarter', value: 'dq' },
			{ label: 'Quarter', value: 'q' },
			{ label: 'Dotted Eighth', value: 'de' },
			{ label: 'Eighth', value: 'e' },
			{ label: 'Dotted Sixteenth', value: 'ds' },
			{ label: 'Sixteenth', value: 's' },
			{ label: 'Thirty-secondth', value: 't' }
		]}
		bind:value={noteValue}
	/>
	<NativeSelect
		data={[
			{ label: 'C Major', value: 'cM' },
			{ label: 'G Major', value: 'gM' },
			{ label: 'F Major', value: 'fM' },
			{ label: 'D Major', value: 'dM' },
			{ label: 'Bb Major', value: 'bbM' },
			{ label: 'A Major', value: 'aM' },
			{ label: 'Eb Major', value: 'ebM' },
			{ label: 'E Major', value: 'eM' },
			{ label: 'Db Major', value: 'dbM' },
			{ label: 'B Major', value: 'bM' },
			{ label: 'A Minor', value: 'am' },
			{ label: 'A Minor', value: 'em' },
			{ label: 'D Minor', value: 'dm' },
			{ label: 'B Minor', value: 'bm' },
			{ label: 'G Minor', value: 'gm' },
			{ label: 'F# Minor', value: 'f#m' },
			{ label: 'C Minor', value: 'cm' },
			{ label: 'C# Minor', value: 'c#m' }
		]}
		bind:value={key}
	/>
	<Button on:click={() => engine?.compile()}>Compile</Button>
</Group>
<canvas bind:this={canvas} height={2400} width={1200} />
