import { geoBounds } from 'd3-geo';
import { feature } from 'topojson-client';
import type { FeatureCollection, MultiPolygon, Polygon } from 'geojson';
import type { GeometryCollection, Topology } from 'topojson-specification';
import type { AtlasIndex, Chunk, LonLat, Row } from './types';

interface RowProperties {
	p: number;
	f: number;
	t: number;
	a: number;
	l: LonLat | null;
}

type ChunkTopology = Topology<{ rows: GeometryCollection<RowProperties> }>;
type LandTopology = Topology<{ land: GeometryCollection }>;

/**
 * The map's data: the index of polities, the land, and border rows loaded an era at a time.
 * Reading rows is synchronous and returns null until the era's chunk has arrived; `ensure`
 * fetches it, and `loaded` changes when it lands so anything reading rows runs again.
 */
export class Atlas {
	index = $state.raw<AtlasIndex | null>(null);
	land = $state.raw<FeatureCollection<Polygon | MultiPolygon> | null>(null);
	error = $state<string | null>(null);
	loaded = $state(0);
	#root: string;
	#rows = new Map<number, Row[]>();
	#pending = new Map<number, Promise<Row[]>>();

	/** @param root the URL of the data folder, ending in a slash */
	constructor(root = '/data/') {
		this.#root = root;
	}

	async load() {
		try {
			const [index, land] = await Promise.all([this.#json<AtlasIndex>('index.json'), this.#json<LandTopology>('land-50m.json')]);
			this.land = feature(land, land.objects.land) as FeatureCollection<Polygon | MultiPolygon>;
			this.index = index;
		} catch (error) {
			this.error = error instanceof Error ? error.message : String(error);
		}
	}

	chunkFor(year: number): Chunk | null {
		return this.index?.chunks.find((chunk) => chunk.from <= year && year <= chunk.to) ?? null;
	}

	/** Fetch the chunk for `year`, and start on its neighbours so playing never waits. */
	ensure(year: number): Promise<Row[]> | null {
		const index = this.index;
		const chunk = this.chunkFor(year);
		if (!index || !chunk) return null;
		const at = index.chunks.indexOf(chunk);
		for (const neighbour of [index.chunks[at + 1], index.chunks[at - 1]]) if (neighbour) this.#fetch(neighbour);
		return this.#fetch(chunk);
	}

	/** Every row alive in `year`, largest first, or null while its chunk is loading. */
	rowsAt(year: number): Row[] | null {
		void this.loaded;
		const chunk = this.chunkFor(year);
		const rows = chunk && this.#rows.get(chunk.from);
		if (!rows) return null;
		return rows.filter((row) => row.from <= year && year <= row.to);
	}

	/** The latest year at or before `year` in which a border changed: rows are the same until the next. */
	settled(year: number): number {
		const changes = this.index?.changes;
		if (!changes?.length) return year;
		let lo = 0;
		let hi = changes.length - 1;
		let found = changes[0];
		while (lo <= hi) {
			const mid = (lo + hi) >> 1;
			if (changes[mid] <= year) {
				found = changes[mid];
				lo = mid + 1;
			} else hi = mid - 1;
		}
		return found;
	}

	#fetch(chunk: Chunk): Promise<Row[]> {
		let pending = this.#pending.get(chunk.from);
		if (!pending) {
			pending = this.#json<ChunkTopology>(chunk.file).then((topology) => {
				const rows = parse(topology);
				this.#rows.set(chunk.from, rows);
				this.loaded++;
				return rows;
			});
			pending.catch(() => this.#pending.delete(chunk.from));
			this.#pending.set(chunk.from, pending);
		}
		return pending;
	}

	async #json<T>(file: string): Promise<T> {
		const response = await fetch(`${this.#root}${file}`);
		if (!response.ok) throw new Error(`Couldn't load ${file} (${response.status})`);
		return response.json();
	}
}

function parse(topology: ChunkTopology): Row[] {
	const collection = feature(topology, topology.objects.rows) as FeatureCollection<Polygon | MultiPolygon, RowProperties>;
	return collection.features
		.map((f) => ({
			id: `${f.properties.p}:${f.properties.f}`,
			polity: f.properties.p,
			from: f.properties.f,
			to: f.properties.t,
			area: f.properties.a,
			label: f.properties.l,
			geometry: f.geometry,
			bounds: geoBounds(f) as [LonLat, LonLat]
		}))
		.sort((a, b) => b.area - a.area);
}
