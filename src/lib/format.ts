import type { Language } from './types';

/** There is no year 0: the year after 1 BCE is 1 CE. */
export function formatYear(year: number, lang: Language = 'en'): string {
	if (year <= 0) {
		const bce = year === 0 ? 1 : -year;
		return lang === 'ko' ? `기원전 ${bce}년` : `${bce} BCE`;
	}
	return lang === 'ko' ? `${year}년` : `${year} CE`;
}

export function formatSpan(from: number, to: number, lang: Language = 'en'): string {
	if (lang === 'en' && from < 0 && to < 0) return `${-from}–${-to} BCE`;
	return `${formatYear(from, lang)} – ${formatYear(to, lang)}`;
}

export function formatArea(km2: number, lang: Language = 'en'): string {
	if (lang === 'ko') {
		if (km2 >= 1e4) return `${Math.round(km2 / 1e4).toLocaleString('ko-KR')}만 km²`;
		return `${Math.round(km2).toLocaleString('ko-KR')} km²`;
	}
	if (km2 >= 1e6) return `${(km2 / 1e6).toFixed(km2 >= 1e7 ? 0 : 1)} million km²`;
	const step = km2 >= 1e4 ? 1e3 : 1e2;
	return `${(Math.round(km2 / step) * step).toLocaleString('en-US')} km²`;
}
