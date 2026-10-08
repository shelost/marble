<script lang="ts">
	import { EVENTS, eventAt } from '#lib/events.ts';
	import { formatYear } from '#lib/format.ts';
	import { ERA_MARKS, FIRST_YEAR, LAST_YEAR, toPosition, toYear } from '#lib/timescale.ts';
	import type { YearPlayer } from '#lib/yearPlayer.svelte.ts';
	import type { Language, Polity, WorldEvent } from '#lib/types.ts';

	/**
	 * The year slider: play, the year, the latest event, a tick for every event and a mark at
	 * each great empire's height. Picking an event or a height jumps there; `onevent` hears
	 * about events so the view can turn to their place.
	 */
	let {
		year = $bindable(),
		player,
		polities,
		peaks,
		lang,
		onevent
	}: {
		year: number;
		player: YearPlayer;
		polities: Polity[];
		peaks: number[];
		lang: Language;
		onevent?: (event: WorldEvent) => void;
	} = $props();

	const STEPS = 10000;
	const event = $derived(eventAt(year));
	const pct = (y: number) => toPosition(y) * 100;

	let laneWidth = $state(0);

	/** Heights alternate between two rows; a name that fits in neither is left to its tooltip. */
	const heights = $derived.by(() => {
		const ends = [-Infinity, -Infinity];
		return [...peaks]
			.map((i) => ({ i, polity: polities[i], at: toPosition(polities[i].peak.year) }))
			.sort((a, b) => a.at - b.at)
			.map((peak) => {
				const name = lang === 'ko' ? (peak.polity.ko ?? peak.polity.name) : peak.polity.name;
				const x = peak.at * laneWidth;
				const half = ([...name].length * (lang === 'ko' ? 9.5 : 5.6)) / 2 + 4;
				const row = ends.findIndex((end) => x - half > end);
				if (row >= 0) ends[row] = x + half;
				return { ...peak, name, row };
			});
	});

	function jump(to: number) {
		player.stop();
		year = to;
	}

	function pick(e: WorldEvent) {
		jump(e.year);
		onevent?.(e);
	}

	function slide(event: Event & { currentTarget: HTMLInputElement }) {
		player.stop();
		year = Math.round(toYear(Number(event.currentTarget.value) / STEPS));
	}

	/** Arrows step a year (Shift ten, Alt a hundred); Page keys a century; Home and End the ends. */
	function key(event: KeyboardEvent) {
		const step = event.altKey ? 100 : event.shiftKey ? 10 : 1;
		const moves: Record<string, number> = {
			ArrowLeft: -step,
			ArrowDown: -step,
			ArrowRight: step,
			ArrowUp: step,
			PageDown: -100,
			PageUp: 100
		};
		let next: number | null = null;
		if (event.key in moves) next = year + moves[event.key];
		else if (event.key === 'Home') next = FIRST_YEAR;
		else if (event.key === 'End') next = LAST_YEAR;
		if (next === null) return;
		event.preventDefault();
		jump(Math.min(LAST_YEAR, Math.max(FIRST_YEAR, next)));
	}

	const era = (y: number) => (y === 0 ? (lang === 'ko' ? '1년' : '1 CE') : y < 0 ? formatYear(y, lang) : String(y));
</script>

<div class="timeline">
	<div class="readout">
		<button
			type="button"
			class="play"
			onclick={() => player.toggle()}
			aria-label={player.playing ? (lang === 'ko' ? '일시 정지' : 'Pause') : lang === 'ko' ? '재생' : 'Play'}
		>
			{#if player.playing}
				<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 1.5h2.5v9H2.5zM7 1.5h2.5v9H7z" /></svg>
			{:else}
				<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.5v9l7.5-4.5z" /></svg>
			{/if}
		</button>
		<output class="year" for="year">{formatYear(year, lang)}</output>
		{#if event}
			<button type="button" class="event" onclick={() => pick(event)}>
				<span class="event-year">{formatYear(event.year, lang)}</span>
				{lang === 'ko' ? event.ko : event.en}
			</button>
		{/if}
	</div>

	<div class="track">
		<input
			id="year"
			type="range"
			min="0"
			max={STEPS}
			step="1"
			value={Math.round(toPosition(year) * STEPS)}
			oninput={slide}
			onkeydown={key}
			aria-label={lang === 'ko' ? '연도' : 'Year'}
			aria-valuetext={formatYear(year, lang)}
		/>
		<div class="lane ticks" aria-hidden="true">
			{#each EVENTS as e (e.year)}
				<button
					type="button"
					tabindex="-1"
					class="tick"
					class:past={e.year <= year}
					style:left="{pct(e.year)}%"
					title="{formatYear(e.year, lang)} · {lang === 'ko' ? e.ko : e.en}"
					onclick={() => pick(e)}
				></button>
			{/each}
		</div>
	</div>

	<div class="lane eras" aria-hidden="true">
		{#each ERA_MARKS as mark (mark)}
			<span style:left="{pct(mark)}%">{era(mark)}</span>
		{/each}
	</div>

	<div class="lane peaks" bind:clientWidth={laneWidth}>
		{#each heights as peak (peak.i)}
			<button
				type="button"
				class="peak"
				class:reached={peak.polity.peak.year <= year}
				style:left="{peak.at * 100}%"
				style:--c={peak.polity.color}
				title="{peak.name} · {formatYear(peak.polity.peak.year, lang)}"
				aria-label="{peak.name}, {formatYear(peak.polity.peak.year, lang)}"
				onclick={() => jump(peak.polity.peak.year)}
			>
				{#if peak.row >= 0}
					<span class="peak-name" class:low={peak.row === 1}>{peak.name}</span>
				{/if}
			</button>
		{/each}
	</div>
</div>

<style>
	.timeline {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		min-width: 0;
	}

	.readout {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		min-width: 0;
	}

	.play {
		flex: none;
		display: grid;
		place-items: center;
		width: 2.1rem;
		height: 2.1rem;
		padding: 0;
		border: 1px solid var(--line);
		border-radius: 50%;
		background: rgb(255 255 255 / 0.06);
		color: var(--ink);
		cursor: pointer;
		transition: background 160ms ease;
	}

	.play:hover {
		background: rgb(255 255 255 / 0.14);
	}

	.play svg {
		width: 0.75rem;
		height: 0.75rem;
		fill: currentColor;
	}

	.year {
		flex: none;
		min-width: 6.4rem;
		font-size: 1.35rem;
		font-weight: 700;
		letter-spacing: -0.01em;
		font-variant-numeric: tabular-nums;
	}

	.event {
		flex: 1 1 auto;
		min-width: 0;
		overflow: hidden;
		padding: 0;
		border: none;
		background: none;
		color: var(--muted);
		font: inherit;
		font-size: 0.82rem;
		text-align: left;
		text-overflow: ellipsis;
		white-space: nowrap;
		cursor: pointer;
	}

	.event:hover {
		color: var(--ink);
	}

	.event-year {
		margin-right: 0.4rem;
		color: var(--gold);
		font-size: 0.72rem;
		font-variant-numeric: tabular-nums;
	}

	.track {
		position: relative;
		height: 1.5rem;
	}

	input[type='range'] {
		position: absolute;
		inset: 0;
		width: 100%;
		margin: 0;
		background: transparent;
		accent-color: var(--gold);
		cursor: pointer;
	}

	/* Lanes share the range input's inner width, so a year sits under the thumb. */
	.lane {
		position: relative;
		margin: 0 0.5rem;
	}

	.ticks {
		position: absolute;
		left: 0;
		right: 0;
		bottom: -0.2rem;
		height: 0.45rem;
	}

	.tick {
		position: absolute;
		top: 0;
		width: 2px;
		height: 100%;
		padding: 0;
		border: none;
		translate: -50% 0;
		background: var(--muted);
		opacity: 0.45;
		cursor: pointer;
	}

	.tick.past {
		background: var(--gold);
		opacity: 0.85;
	}

	.eras {
		height: 0.9rem;
	}

	.eras span {
		position: absolute;
		translate: -50% 0;
		color: var(--faint);
		font-size: 0.62rem;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.eras span:first-child {
		translate: 0 0;
	}

	.eras span:last-child {
		translate: -100% 0;
	}

	.peaks {
		height: 2.2rem;
	}

	.peak {
		position: absolute;
		top: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0;
		border: none;
		background: none;
		translate: -50% 0;
		font: inherit;
		cursor: pointer;
		opacity: 0.5;
		transition: opacity 300ms ease;
	}

	.peak::before {
		content: '';
		border-left: 4px solid transparent;
		border-right: 4px solid transparent;
		border-bottom: 7px solid var(--c);
	}

	.peak.reached,
	.peak:hover {
		opacity: 1;
	}

	.peak-name {
		margin-top: 0.1rem;
		color: color-mix(in oklab, var(--c) 55%, white);
		font-size: 0.58rem;
		font-weight: 650;
		letter-spacing: 0.04em;
		white-space: nowrap;
	}

	.peak-name.low {
		margin-top: 0.85rem;
	}
</style>
