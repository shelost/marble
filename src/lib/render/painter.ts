import { geoEquirectangular, geoPath } from 'd3-geo';
import type { FeatureCollection, MultiPolygon, Polygon } from 'geojson';
import type { Polity, Row } from '../types';

export const PALETTE = {
	ocean: '#1c3549',
	land: '#d8d0bf'
};

type Land = FeatureCollection<Polygon | MultiPolygon>;

/** A canvas covering the whole world in plate carrée, the texture the globe and map sample. */
function sheet(width: number, height: number) {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('2D canvas is unavailable');
	const projection = geoEquirectangular()
		.scale(width / (2 * Math.PI))
		.translate([width / 2, height / 2])
		.precision(0.2);
	return { canvas, ctx, path: geoPath(projection, ctx) };
}

/** Land and sea, painted once. */
export function paintBase(width: number, height: number, land: Land): HTMLCanvasElement {
	const { canvas, ctx, path } = sheet(width, height);
	ctx.fillStyle = PALETTE.ocean;
	ctx.fillRect(0, 0, width, height);
	ctx.beginPath();
	path(land);
	ctx.fillStyle = PALETTE.land;
	ctx.fill();
	return canvas;
}

/**
 * The polities alive in a year, each in its colour, cut to the coastline: the source borders
 * are coarser than the coast, so they're painted over the sea and then trimmed by the land.
 */
export class PoliticalPainter {
	readonly canvas: HTMLCanvasElement;
	#ctx: CanvasRenderingContext2D;
	#path: ReturnType<typeof geoPath>;
	#land: HTMLCanvasElement;

	constructor(width: number, height: number, land: Land) {
		const { canvas, ctx, path } = sheet(width, height);
		this.canvas = canvas;
		this.#ctx = ctx;
		this.#path = path;
		const mask = sheet(width, height);
		mask.ctx.beginPath();
		mask.path(land);
		mask.ctx.fillStyle = '#fff';
		mask.ctx.fill();
		this.#land = mask.canvas;
	}

	/** Rows come largest first, so smaller polities paint over the ones around them. */
	paint(rows: Row[], polities: Polity[]) {
		const ctx = this.#ctx;
		const { width, height } = this.canvas;
		ctx.globalCompositeOperation = 'source-over';
		ctx.clearRect(0, 0, width, height);
		for (const row of rows) {
			ctx.beginPath();
			this.#path(row.geometry);
			ctx.fillStyle = polities[row.polity]?.color ?? '#999';
			ctx.fill();
		}
		ctx.globalCompositeOperation = 'destination-in';
		ctx.drawImage(this.#land, 0, 0);
		ctx.globalCompositeOperation = 'source-over';
	}
}
