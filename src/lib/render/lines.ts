import { BufferAttribute, BufferGeometry, Sphere, Vector3 } from 'three';
import type { MultiPolygon, Polygon, Position } from 'geojson';

const RAD = Math.PI / 180;

/**
 * Line segments along rings of [lon, lat] degrees. Long edges are split into pieces of at most
 * `step` degrees so they follow the globe's curve. `position` holds each vertex's longitude
 * and latitude in radians (the shaders place it), and `partner` the other end of its segment.
 */
export function ringSegments(rings: Iterable<Position[]>, step = 1.5): BufferGeometry {
	const ends: number[] = [];
	const partners: number[] = [];
	for (const ring of rings) {
		for (let i = 1; i < ring.length; i++) {
			const [x0, y0] = ring[i - 1];
			const [x1, y1] = ring[i];
			if (Math.abs(x1 - x0) > 180) continue;
			const pieces = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) / step));
			for (let k = 0; k < pieces; k++) {
				const ax = (x0 + ((x1 - x0) * k) / pieces) * RAD;
				const ay = (y0 + ((y1 - y0) * k) / pieces) * RAD;
				const bx = (x0 + ((x1 - x0) * (k + 1)) / pieces) * RAD;
				const by = (y0 + ((y1 - y0) * (k + 1)) / pieces) * RAD;
				ends.push(ax, ay, bx, by);
				partners.push(bx, by, ax, ay);
			}
		}
	}
	const geometry = new BufferGeometry();
	geometry.setAttribute('position', new BufferAttribute(new Float32Array(ends), 2));
	geometry.setAttribute('partner', new BufferAttribute(new Float32Array(partners), 2));
	geometry.boundingSphere = new Sphere(new Vector3(), 4);
	return geometry;
}

/** Every ring of some polygons. */
export function* ringsOf(geometries: Iterable<Polygon | MultiPolygon>): Generator<Position[]> {
	for (const geometry of geometries) {
		if (geometry.type === 'Polygon') yield* geometry.coordinates;
		else for (const polygon of geometry.coordinates) yield* polygon;
	}
}

/** Meridians and parallels every `step` degrees, stopping short of the poles. */
export function graticule(step = 30): Position[][] {
	const lines: Position[][] = [];
	for (let lon = -180; lon < 180; lon += step) {
		lines.push(Array.from({ length: 81 }, (_, i) => [lon, -80 + i * 2]));
	}
	for (let lat = -60; lat <= 60; lat += step) {
		lines.push(Array.from({ length: 181 }, (_, i) => [-180 + i * 2, lat]));
	}
	return lines;
}
