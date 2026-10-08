/**
 * Where a year sits on the timeline, 0 to 1. Borders change a few times a century in the first
 * millennium BCE and every year or two in the last two centuries, so recent years get more of
 * the track: each stretch is linear, and the stops say how much room each era gets.
 */
const STOPS: [year: number, position: number][] = [
	[-1000, 0],
	[0, 0.24],
	[1000, 0.46],
	[1500, 0.62],
	[1800, 0.79],
	[2024, 1]
];

export const FIRST_YEAR = STOPS[0][0];
export const LAST_YEAR = STOPS[STOPS.length - 1][0];

/** Years labelled under the track. */
export const ERA_MARKS = [-1000, -500, 0, 500, 1000, 1500, 1800, 1900, 2000];

export function toPosition(year: number): number {
	const y = Math.min(LAST_YEAR, Math.max(FIRST_YEAR, year));
	for (let i = 1; i < STOPS.length; i++) {
		const [y1, p1] = STOPS[i];
		if (y <= y1) {
			const [y0, p0] = STOPS[i - 1];
			return p0 + ((y - y0) / (y1 - y0)) * (p1 - p0);
		}
	}
	return 1;
}

export function toYear(position: number): number {
	const p = Math.min(1, Math.max(0, position));
	for (let i = 1; i < STOPS.length; i++) {
		const [y1, p1] = STOPS[i];
		if (p <= p1) {
			const [y0, p0] = STOPS[i - 1];
			return y0 + ((p - p0) / (p1 - p0)) * (y1 - y0);
		}
	}
	return LAST_YEAR;
}
