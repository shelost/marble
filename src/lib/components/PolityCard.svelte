<script lang="ts">
	import { formatArea, formatSpan, formatYear } from '#lib/format.ts';
	import type { Language, Polity, Row } from '#lib/types.ts';

	/** The selected polity: its names, its years, its size now and at its height. */
	let {
		polity,
		row,
		lang,
		onpeak,
		onclose
	}: {
		polity: Polity;
		row: Row | null;
		lang: Language;
		onpeak: (year: number) => void;
		onclose: () => void;
	} = $props();

	const wiki = $derived(
		polity.wikipedia ? `https://en.wikipedia.org/wiki/${encodeURIComponent(polity.wikipedia.replaceAll(' ', '_'))}` : null
	);
	const primary = $derived(lang === 'ko' ? (polity.ko ?? polity.name) : polity.name);
	const secondary = $derived(lang === 'ko' ? (polity.ko ? polity.name : null) : (polity.ko ?? null));
</script>

<article class="card" style:--c={polity.color}>
	<header>
		<i></i>
		<div>
			<h2>{primary}</h2>
			{#if secondary}<p class="alt">{secondary}</p>{/if}
		</div>
		<button type="button" class="close" onclick={onclose} aria-label={lang === 'ko' ? '닫기' : 'Close'}>
			<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 2.5l7 7M9.5 2.5l-7 7" /></svg>
		</button>
	</header>

	<dl>
		<dt>{lang === 'ko' ? '존속' : 'On the map'}</dt>
		<dd>{formatSpan(polity.from, polity.to, lang)}</dd>
		{#if row}
			<dt>{lang === 'ko' ? '지금' : 'Now'}</dt>
			<dd>{formatArea(row.area, lang)}</dd>
		{/if}
		<dt>{lang === 'ko' ? '최대 판도' : 'At its height'}</dt>
		<dd>
			<button type="button" class="peak" onclick={() => onpeak(polity.peak.year)}>
				{formatArea(polity.peak.area, lang)} · {formatYear(polity.peak.year, lang)}
			</button>
		</dd>
	</dl>

	{#if wiki}
		<a class="wiki" href={wiki} target="_blank" rel="noopener noreferrer">{lang === 'ko' ? '위키백과 (영어)' : 'Wikipedia'} ↗</a>
	{/if}
</article>

<style>
	.card {
		display: grid;
		gap: 0.75rem;
		padding: 0.9rem 1rem 1rem;
		border: 1px solid var(--line);
		border-radius: 1rem;
		background: var(--glass);
		backdrop-filter: blur(18px) saturate(1.3);
		box-shadow: 0 24px 60px -24px rgb(0 0 0 / 0.6);
	}

	header {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: start;
		gap: 0.65rem;
	}

	header i {
		width: 0.8rem;
		height: 0.8rem;
		margin-top: 0.35rem;
		border-radius: 50%;
		background: var(--c);
		box-shadow: 0 0 0 3px color-mix(in oklab, var(--c) 30%, transparent);
	}

	h2 {
		margin: 0;
		font-size: 1.05rem;
		font-weight: 700;
		line-height: 1.25;
	}

	.alt {
		margin: 0.1rem 0 0;
		color: var(--muted);
		font-size: 0.8rem;
	}

	.close {
		display: grid;
		place-items: center;
		width: 1.6rem;
		height: 1.6rem;
		padding: 0;
		border: none;
		border-radius: 50%;
		background: rgb(255 255 255 / 0.06);
		color: var(--muted);
		cursor: pointer;
	}

	.close:hover {
		background: rgb(255 255 255 / 0.14);
		color: var(--ink);
	}

	.close svg {
		width: 0.65rem;
		height: 0.65rem;
		stroke: currentColor;
		stroke-width: 1.6;
		stroke-linecap: round;
	}

	dl {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.35rem 0.9rem;
		margin: 0;
		font-size: 0.82rem;
	}

	dt {
		color: var(--faint);
	}

	dd {
		margin: 0;
		font-variant-numeric: tabular-nums;
	}

	.peak {
		padding: 0;
		border: none;
		background: none;
		color: var(--gold);
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.peak:hover {
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.wiki {
		justify-self: start;
		color: var(--ink);
		font-size: 0.8rem;
		font-weight: 550;
		text-decoration: none;
		opacity: 0.8;
	}

	.wiki:hover {
		opacity: 1;
		text-decoration: underline;
		text-underline-offset: 3px;
	}
</style>
