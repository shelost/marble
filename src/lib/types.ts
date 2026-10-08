import type { MultiPolygon, Polygon } from 'geojson';

export type LonLat = [lon: number, lat: number];
export type Mode = 'globe' | 'map';
export type Language = 'en' | 'ko';

export interface Polity {
	name: string;
	ko?: string;
	color: string;
	wikipedia?: string;
	wikidata?: string;
	/** First and last year it appears, across all its rows. */
	from: number;
	to: number;
	/** When it was largest, and how large (km²). */
	peak: { year: number; area: number };
}

export interface Chunk {
	from: number;
	to: number;
	file: string;
	rows: number;
}

export interface AtlasIndex {
	source: { name: string; version: string; license: string };
	years: [number, number];
	chunks: Chunk[];
	/** Every year in which some border changes, ascending. */
	changes: number[];
	/** Polities marked at their height under the timeline. */
	peaks: number[];
	polities: Polity[];
}

/** One polity's shape for a span of years. */
export interface Row {
	id: string;
	polity: number;
	from: number;
	to: number;
	/** km² */
	area: number;
	/** A point inside the shape, for its label. */
	label: LonLat | null;
	geometry: Polygon | MultiPolygon;
	/** [[west, south], [east, north]] in degrees; west > east when it crosses the antimeridian. */
	bounds: [LonLat, LonLat];
}

export interface WorldEvent {
	year: number;
	en: string;
	ko: string;
	/** Where to look when it's picked. */
	at: LonLat;
}
