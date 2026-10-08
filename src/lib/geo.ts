import { geoEqualEarthRaw } from 'd3-geo';

/**
 * The two shapes the world takes, in scene units. The globe is a unit sphere turned so the
 * point being looked at faces the camera (+z). The map is the Equal Earth projection on the
 * z = 0 plane, centred on a chosen meridian. The shaders in render/shaders.ts compute the same.
 */

export const RAD = Math.PI / 180;
export const DEG = 180 / Math.PI;

/** Half the map's width and height: Equal Earth reaches ±2.7066 by ±1.3173. */
export const MAP_HALF = {
	x: geoEqualEarthRaw(Math.PI, 0)[0],
	y: geoEqualEarthRaw(0, Math.PI / 2)[1]
};

/** Longitude wrapped into [-π, π). */
export function wrap(lambda: number): number {
	return lambda - 2 * Math.PI * Math.floor((lambda + Math.PI) / (2 * Math.PI));
}

export function spherePoint(lambda: number, phi: number): [number, number, number] {
	const c = Math.cos(phi);
	return [c * Math.sin(lambda), Math.sin(phi), c * Math.cos(lambda)];
}

/**
 * The rotation that brings (lon, lat) to the front, row-major: first turn about the pole by
 * -lon, then tilt about the x axis by +lat.
 */
export function frontRotation(lambda: number, phi: number): number[] {
	const cl = Math.cos(lambda);
	const sl = Math.sin(lambda);
	const cp = Math.cos(phi);
	const sp = Math.sin(phi);
	return [cl, 0, -sl, -sp * sl, cp, -sp * cl, cp * sl, sp, cp * cl];
}

export function rotate(m: number[], [x, y, z]: [number, number, number]): [number, number, number] {
	return [m[0] * x + m[1] * y + m[2] * z, m[3] * x + m[4] * y + m[5] * z, m[6] * x + m[7] * y + m[8] * z];
}

/** The inverse rotation: m is orthonormal, so its transpose. */
export function unrotate(m: number[], [x, y, z]: [number, number, number]): [number, number, number] {
	return [m[0] * x + m[3] * y + m[6] * z, m[1] * x + m[4] * y + m[7] * z, m[2] * x + m[5] * y + m[8] * z];
}

/** A point on the map, centred on meridian `center`. */
export function mapPoint(lambda: number, phi: number, center: number): [number, number] {
	return geoEqualEarthRaw(wrap(lambda - center), phi);
}

/** The longitude and latitude at a map point, or null outside the map. */
export function mapInvert(x: number, y: number, center: number): [number, number] | null {
	if (Math.abs(y) > MAP_HALF.y) return null;
	const [lambda, phi] = geoEqualEarthRaw.invert!(x, y);
	if (!Number.isFinite(lambda) || Math.abs(lambda) > Math.PI + 1e-9) return null;
	return [wrap(lambda + center), phi];
}
