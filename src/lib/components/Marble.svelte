<script lang="ts">
	import { untrack } from 'svelte';
	import { geoContains } from 'd3-geo';
	import type { FeatureCollection, MultiPolygon, Polygon } from 'geojson';
	import { placeLabels, type Label } from '#lib/labels.ts';
	import { MarbleScene } from '#lib/render/scene.ts';
	import type { Language, LonLat, Mode, Polity, Row } from '#lib/types.ts';

	/**
	 * The world, as a globe or a map. Hovering names a polity and clicking selects it; both
	 * are polity indices, so a selection follows its polity from year to year. Changing `focus`
	 * turns the view to look at that place.
	 */
	let {
		land,
		rows,
		polities,
		mode,
		lang,
		focus = null,
		top = 0,
		bottom = 0,
		hovered = $bindable(null),
		selected = $bindable(null)
	}: {
		land: FeatureCollection<Polygon | MultiPolygon>;
		rows: Row[] | null;
		polities: Polity[];
		mode: Mode;
		lang: Language;
		focus?: LonLat | null;
		/** Pixels at the top and bottom covered by other UI. */
		top?: number;
		bottom?: number;
		hovered?: number | null;
		selected?: number | null;
	} = $props();

	let scene = $state.raw<MarbleScene | null>(null);
	let labels = $state.raw<Label[]>([]);
	let pointer = $state<{ x: number; y: number } | null>(null);

	const hoveredRow = $derived(hovered === null ? null : (rows?.find((row) => row.polity === hovered) ?? null));
	const selectedRow = $derived(selected === null ? null : (rows?.find((row) => row.polity === selected) ?? null));

	function inside([[west, south], [east, north]]: Row['bounds'], [lon, lat]: LonLat) {
		if (lat < south || lat > north) return false;
		return west <= east ? lon >= west && lon <= east : lon >= west || lon <= east;
	}

	/** The polity at a place. Rows come largest first, so test the smallest first: enclaves win. */
	function polityAt(at: LonLat | null): number | null {
		if (!at || !rows) return null;
		for (let i = rows.length - 1; i >= 0; i--) {
			const row = rows[i];
			if (inside(row.bounds, at) && geoContains(row.geometry, at)) return row.polity;
		}
		return null;
	}

	/** The scene is built once per canvas; nothing it reads while being built should rebuild it. */
	function world(canvas: HTMLCanvasElement) {
		const instance: MarbleScene = untrack(
			() =>
				new MarbleScene(canvas, land, {
					onframe: () => {
						labels = rows
							? placeLabels(
									rows,
									polities,
									(lon, lat) => instance.project(lon, lat),
									{ width: canvas.clientWidth, top, bottom: canvas.clientHeight - bottom },
									lang
								)
							: [];
					},
					onpoint: (at) => (hovered = polityAt(at)),
					onpick: (at) => (selected = polityAt(at))
				})
		);
		scene = instance;
		return () => {
			instance.dispose();
			scene = null;
		};
	}

	/* Insets go first: switching mode fits the map to the space left on screen. */
	$effect(() => {
		scene?.setInsets(top, bottom);
	});

	$effect(() => {
		if (scene && rows) scene.setRows(rows, polities);
	});

	$effect(() => {
		scene?.setMode(mode);
	});

	$effect(() => {
		scene?.setHover(hoveredRow);
	});

	$effect(() => {
		scene?.setSelected(selectedRow);
	});

	$effect(() => {
		if (scene && focus) scene.flyTo(focus);
	});

	$effect(() => {
		void lang;
		scene?.refresh();
	});

	const tip = $derived(hovered === null ? null : polities[hovered]);
</script>

<div
	class="marble"
	class:pointing={hovered !== null}
	role="application"
	aria-label="World map"
	onpointermove={(event) => (pointer = { x: event.clientX, y: event.clientY })}
	onpointerleave={() => (pointer = null)}
>
	<canvas {@attach world}></canvas>

	<div class="labels" aria-hidden="true">
		{#each labels as label (label.key)}
			<span
				class="label"
				class:ko={lang === 'ko'}
				class:on={label.row.polity === selected}
				style:--c={label.color}
				style:font-size="{label.size}px"
				style:transform="translate({label.x}px, {label.y}px) translate(-50%, -50%)">{label.text}</span
			>
		{/each}
	</div>

	{#if tip && pointer}
		<div class="tip" style:transform="translate({pointer.x + 14}px, {pointer.y + 16}px)" aria-hidden="true">
			<i style:background={tip.color}></i>
			{lang === 'ko' ? (tip.ko ?? tip.name) : tip.name}
			{#if lang === 'en' && tip.ko}<small>{tip.ko}</small>{:else if lang === 'ko' && tip.ko}<small>{tip.name}</small>{/if}
		</div>
	{/if}
</div>

<style>
	.marble {
		position: absolute;
		inset: 0;
		overflow: hidden;
		cursor: grab;
		touch-action: none;
		user-select: none;
		-webkit-user-select: none;
	}

	.marble:active {
		cursor: grabbing;
	}

	.marble.pointing {
		cursor: pointer;
	}

	canvas {
		display: block;
		width: 100%;
		height: 100%;
	}

	.labels {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.label {
		position: absolute;
		top: 0;
		left: 0;
		font-weight: 650;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		white-space: nowrap;
		color: color-mix(in oklab, var(--c) 32%, #0d0b08);
		text-shadow:
			0 0 3px rgb(255 252 244 / 0.75),
			0 0 8px rgb(255 252 244 / 0.4);
		will-change: transform;
	}

	.label.ko {
		letter-spacing: 0.04em;
		font-weight: 700;
	}

	.label.on {
		color: #1a1205;
		text-shadow:
			0 0 3px #f6c453,
			0 0 10px rgb(246 196 83 / 0.8);
	}

	.tip {
		position: fixed;
		top: 0;
		left: 0;
		z-index: 5;
		display: flex;
		align-items: center;
		gap: 0.45rem;
		padding: 0.35rem 0.6rem;
		border: 1px solid var(--line);
		border-radius: 0.6rem;
		background: rgb(14 18 24 / 0.82);
		backdrop-filter: blur(10px);
		color: var(--ink);
		font-size: 0.8rem;
		font-weight: 550;
		white-space: nowrap;
		pointer-events: none;
	}

	.tip i {
		width: 0.6rem;
		height: 0.6rem;
		border-radius: 50%;
	}

	.tip small {
		color: var(--muted);
		font-weight: 450;
	}
</style>
