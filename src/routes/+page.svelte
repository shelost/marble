<script lang="ts">
	import { onMount } from 'svelte';
	import { asset } from '$app/paths';
	import Marble from '#lib/components/Marble.svelte';
	import PolityCard from '#lib/components/PolityCard.svelte';
	import Timeline from '#lib/components/Timeline.svelte';
	import { Atlas } from '#lib/atlas.svelte.ts';
	import { YearPlayer } from '#lib/yearPlayer.svelte.ts';
	import type { Language, LonLat, Mode, Row } from '#lib/types.ts';

	/** Chunk names are only known at runtime, so find the data folder from a file in it. */
	const atlas = new Atlas(asset('data/index.json').replace(/index\.json$/, ''));

	let year = $state(1);
	let mode = $state<Mode>('globe');
	let lang = $state<Language>('en');
	let hovered = $state<number | null>(null);
	let selected = $state<number | null>(null);
	let focus = $state<LonLat | null>(null);
	/** The header's and timeline's heights: the world centres in the space between them. */
	let header = $state(0);
	let dock = $state(0);

	const player = new YearPlayer(
		() => year,
		(y) => (year = y)
	);

	/** Rows only change in years when a border does, so everything keys on the settled year. */
	const settled = $derived(atlas.settled(year));
	/** The last rows that arrived: while the next era loads, the map keeps the last one up. */
	let previous: Row[] | null = null;
	const rows = $derived.by(() => {
		const next = atlas.rowsAt(settled);
		if (next) previous = next;
		return previous;
	});

	const polities = $derived(atlas.index?.polities ?? []);
	const chosen = $derived(selected === null ? null : (polities[selected] ?? null));
	const chosenRow = $derived(selected === null ? null : (rows?.find((row) => row.polity === selected) ?? null));

	const TEXT = {
		en: { title: 'Marble', tagline: 'Who ruled where, from 1000 BCE to today', globe: 'Globe', map: 'Map', loading: 'Loading the world…' },
		ko: {
			title: 'Marble',
			tagline: '기원전 1000년부터 오늘까지, 누가 어디를 다스렸나',
			globe: '지구본',
			map: '지도',
			loading: '세계를 불러오는 중…'
		}
	};
	const text = $derived(TEXT[lang]);

	$effect(() => {
		atlas.ensure(year);
	});

	onMount(() => {
		atlas.load();
		return () => player.stop();
	});

	function onkeydown(event: KeyboardEvent) {
		const target = event.target as HTMLElement;
		if (target.closest('input:not([type="range"]), textarea, select, [contenteditable]')) return;
		if (event.key === ' ' && !target.closest('button, a')) {
			event.preventDefault();
			player.toggle();
		} else if (event.key === 'g' || event.key === 'G') {
			mode = 'globe';
		} else if (event.key === 'm' || event.key === 'M') {
			mode = 'map';
		} else if (event.key === 'Escape') {
			selected = null;
		}
	}
</script>

<svelte:head>
	<title>Marble · World history, 1000 BCE to today</title>
	<meta name="description" content="The political map of the world from 1000 BCE to today, on a globe and a flat map." />
</svelte:head>

<svelte:window {onkeydown} />

<main>
	{#if atlas.index && atlas.land}
		<Marble
			land={atlas.land}
			{rows}
			{polities}
			{mode}
			{lang}
			{focus}
			top={header ? header + 28 : 0}
			bottom={dock ? dock + 24 : 0}
			bind:hovered
			bind:selected
		/>
	{:else}
		<p class="status" role="status">{atlas.error ?? text.loading}</p>
	{/if}

	<header class="top" bind:clientHeight={header}>
		<div class="brand">
			<h1>{text.title}</h1>
			<p>{text.tagline}</p>
		</div>
		<div class="switches">
			<div class="segmented" role="radiogroup" aria-label={lang === 'ko' ? '보기' : 'View'}>
				{#each ['globe', 'map'] as const as option (option)}
					<button type="button" role="radio" aria-checked={mode === option} class:on={mode === option} onclick={() => (mode = option)}>
						{text[option]}
					</button>
				{/each}
			</div>
			<div class="segmented" role="radiogroup" aria-label="Language">
				<button type="button" role="radio" aria-checked={lang === 'en'} class:on={lang === 'en'} onclick={() => (lang = 'en')}>EN</button>
				<button type="button" role="radio" aria-checked={lang === 'ko'} class:on={lang === 'ko'} onclick={() => (lang = 'ko')}
					>한국어</button
				>
			</div>
		</div>
	</header>

	{#if chosen}
		<aside class="side">
			<PolityCard
				polity={chosen}
				row={chosenRow}
				{lang}
				onpeak={(peak) => {
					player.stop();
					year = peak;
				}}
				onclose={() => (selected = null)}
			/>
		</aside>
	{/if}

	{#if atlas.index}
		<footer class="dock" bind:clientHeight={dock}>
			<Timeline bind:year {player} {polities} peaks={atlas.index.peaks} {lang} onevent={(event) => (focus = event.at)} />
			<p class="credit">
				{lang === 'ko' ? '국경' : 'Borders'}:
				<a href="https://github.com/Seshat-Global-History-Databank/cliopatria" target="_blank" rel="noopener noreferrer">Cliopatria</a>
				(Seshat Global History Databank),
				<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>,
				{lang === 'ko' ? '단순화하고 해안선에 맞춤' : 'simplified and clipped to the coast'} ·
				{lang === 'ko' ? '육지' : 'Land'}:
				<a href="https://www.naturalearthdata.com" target="_blank" rel="noopener noreferrer">Natural Earth</a>
			</p>
		</footer>
	{/if}
</main>

<style>
	main {
		position: fixed;
		inset: 0;
	}

	.status {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		margin: 0;
		color: var(--muted);
		font-size: 0.95rem;
		letter-spacing: 0.02em;
	}

	.top {
		position: absolute;
		top: max(1rem, env(safe-area-inset-top));
		left: max(1.25rem, env(safe-area-inset-left));
		right: max(1.25rem, env(safe-area-inset-right));
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		pointer-events: none;
	}

	.brand h1 {
		margin: 0;
		font-size: 1.4rem;
		font-weight: 750;
		letter-spacing: -0.02em;
	}

	.brand p {
		margin: 0.15rem 0 0;
		color: var(--muted);
		font-size: 0.82rem;
	}

	.switches {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: 0.5rem;
		pointer-events: auto;
	}

	.segmented {
		display: flex;
		padding: 0.2rem;
		border: 1px solid var(--line);
		border-radius: 999px;
		background: var(--glass);
		backdrop-filter: blur(16px);
	}

	.segmented button {
		padding: 0.4rem 0.9rem;
		border: none;
		border-radius: 999px;
		background: transparent;
		color: var(--muted);
		font-size: 0.82rem;
		font-weight: 600;
		cursor: pointer;
		transition:
			background 180ms ease,
			color 180ms ease;
	}

	.segmented button:hover {
		color: var(--ink);
	}

	.segmented button.on {
		background: var(--ink);
		color: #0d1117;
	}

	.side {
		position: absolute;
		right: max(1.25rem, env(safe-area-inset-right));
		bottom: calc(max(1rem, env(safe-area-inset-bottom)) + 10.5rem);
		width: min(20rem, calc(100vw - 2.5rem));
	}

	.dock {
		position: absolute;
		left: 50%;
		bottom: max(1rem, env(safe-area-inset-bottom));
		translate: -50% 0;
		width: min(64rem, calc(100vw - 2rem));
		padding: 0.8rem 1.1rem 0.55rem;
		border: 1px solid var(--line);
		border-radius: 1.1rem;
		background: var(--glass);
		backdrop-filter: blur(18px) saturate(1.3);
		box-shadow: 0 24px 60px -24px rgb(0 0 0 / 0.7);
	}

	.credit {
		margin: 0.35rem 0 0;
		color: var(--faint);
		font-size: 0.64rem;
		line-height: 1.4;
	}

	.credit a {
		color: var(--muted);
	}

	@media (max-width: 640px) {
		.top {
			flex-direction: column;
		}

		.brand p {
			display: none;
		}

		.switches {
			justify-content: flex-start;
		}

		.side {
			left: max(1rem, env(safe-area-inset-left));
			right: auto;
			bottom: calc(max(1rem, env(safe-area-inset-bottom)) + 11.5rem);
		}
	}
</style>
