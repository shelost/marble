import type { Language, Polity, Row } from './types';
import type { Projected } from './render/scene';

export interface Label {
	key: string;
	x: number;
	y: number;
	/** Font size in px. */
	size: number;
	text: string;
	color: string;
	row: Row;
}

const EARTH_RADIUS = 6371;
const MAX_LABELS = 70;

/**
 * Names for the polities in view, largest first, kept inside `area` (the screen between other UI). A label is sized to its polity's extent on
 * screen and dropped if it would be too small to read or would overlap one already placed.
 */
export function placeLabels(
	rows: Row[],
	polities: Polity[],
	project: (lon: number, lat: number) => Projected | null,
	area: { width: number; top: number; bottom: number },
	lang: Language
): Label[] {
	const placed: Label[] = [];
	const boxes: [number, number, number, number][] = [];
	for (const row of rows) {
		if (placed.length >= MAX_LABELS) break;
		if (!row.label) continue;
		const at = project(row.label[0], row.label[1]);
		if (!at) continue;
		const radius = (Math.sqrt(row.area / Math.PI) / EARTH_RADIUS) * at.scale;
		if (radius < 16) continue;
		const polity = polities[row.polity];
		const text = lang === 'ko' ? (polity.ko ?? polity.name) : polity.name;
		const perChar = lang === 'ko' && polity.ko ? 1.02 : 0.78;
		const length = [...text].length;
		const size = Math.min(22, radius * 0.22, (radius * 2.6) / (length * perChar));
		if (size < 8) continue;
		const w = length * perChar * size + 8;
		const h = size * 1.5;
		const box: [number, number, number, number] = [at.x - w / 2, at.y - h / 2, at.x + w / 2, at.y + h / 2];
		if (box[0] < 4 || box[2] > area.width - 4 || box[1] < area.top || box[3] > area.bottom - 4) continue;
		if (boxes.some((b) => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1])) continue;
		boxes.push(box);
		placed.push({ key: row.id, x: at.x, y: at.y, size, text, color: polity.color, row });
	}
	return placed;
}
