/**
 * Builds the map's data in static/data from Cliopatria (Seshat Global History Databank,
 * CC BY 4.0) and Natural Earth land. Run with `npm run data`; the output is committed, so the
 * site itself never needs the 170 MB source.
 *
 * - Keeps polities (not the composite "(Empire)" rows) that exist from 1000 BCE on.
 * - Simplifies borders for a whole-world view and finds a point inside each shape for its label.
 * - Splits rows into era chunks, each its own TopoJSON, so the app loads only the years in view.
 * - Writes an index of polities with a colour, Wikipedia and Wikidata links, Korean names from
 *   Wikidata, and the year each one was largest.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { unzipSync } from 'fflate';
import mapshaper from 'mapshaper';
import { topology } from 'topojson-server';
import { colorFor } from './palette.mjs';

const require = createRequire(import.meta.url);

const VERSION = 'v0.2.1';
const SOURCE = `https://raw.githubusercontent.com/Seshat-Global-History-Databank/cliopatria/${VERSION}/cliopatria.geojson.zip`;
const FIRST_YEAR = -1000;
const LAST_YEAR = 2024;
/** Chunk starts; each chunk runs to the year before the next. Recent centuries change faster. */
const CHUNK_STARTS = [-1000, -500, -250, 0, 250, 500, 750, 1000, 1200, 1400, 1500, 1600, 1700, 1800, 1850, 1900, 1950];
/** Border simplification, in meters: about one texel of the 4096 px world texture. */
const TOLERANCE = 6000;
/** Largest empires get a mark at their height under the timeline. */
const PEAKS = [
	'Achaemenid Empire',
	'Macedonian Empire',
	'Maurya Empire',
	'Han Dynasty',
	'Xiongnu',
	'Roman Empire',
	'Sasanian Empire',
	'Gupta Empire',
	'Göktürk Khaganate',
	'Tang Dynasty',
	'Umayyad Caliphate',
	'Abbasid Caliphate',
	'Mongol Empire',
	'Timurid Empire',
	'Ming Dynasty',
	'Inca Empire',
	'Ottoman Empire',
	'Spanish Empire',
	'Mughal Empire',
	'Qing Dynasty',
	'Russian Empire',
	'British Colonial Empire'
];

/** Korean names where Cliopatria links a polity to the wrong Wikidata item, or none. */
const KOREAN = {
	'Roman Empire': '로마 제국',
	'Byzantine Empire': '비잔티움 제국',
	Joseon: '조선',
	'Han Dynasty': '한나라',
	'Western Jin': '서진',
	'Eastern Jin': '동진',
	'Liang Dynasty': '양나라',
	'Southern Qi': '남제',
	'Liu Song Dynasty': '유송',
	'Cao Wei': '조위',
	'Northern Song': '북송',
	'Southern Song': '남송',
	'Republic of China': '중화민국',
	'Sasanian Empire': '사산 제국',
	'Seleucid Empire': '셀레우코스 제국',
	'Kingdom of France': '프랑스 왕국',
	'Mali Empire': '말리 제국',
	'British Africa': '영국령 아프리카',
	'German Africa': '독일령 아프리카',
	'Italian Africa': '이탈리아령 아프리카',
	'Western Göktürks': '서돌궐',
	'Eastern Göktürks': '동돌궐',
	'Mongol Khanate': '몽골 칸국',
	'Muhammad Ali dynasty': '무함마드 알리 왕조'
};

const CACHE = '.cache';
const OUT = 'static/data';

/** @param {string} message */
const log = (message) => console.log(`[data] ${message}`);

async function source() {
	mkdirSync(CACHE, { recursive: true });
	const zip = `${CACHE}/cliopatria-${VERSION}.zip`;
	if (!existsSync(zip)) {
		log(`downloading Cliopatria ${VERSION}`);
		const response = await fetch(SOURCE);
		if (!response.ok) throw new Error(`Download failed: ${response.status} ${SOURCE}`);
		writeFileSync(zip, Buffer.from(await response.arrayBuffer()));
	}
	const files = unzipSync(readFileSync(zip));
	const name = Object.keys(files).find((file) => file.endsWith('.geojson'));
	if (!name) throw new Error('No .geojson in the Cliopatria archive');
	log(`read ${name}`);
	return Buffer.from(files[name]).toString('utf8');
}

/** @param {string} geojson */
async function simplify(geojson) {
	log('simplifying');
	const commands = [
		'-i in.json',
		`-filter '!Name.startsWith("(") && ToYear >= ${FIRST_YEAR}'`,
		`-simplify interval=${TOLERANCE} keep-shapes no-repair`,
		"-each 'lx=this.innerX, ly=this.innerY'",
		'-o out.json format=geojson precision=0.001'
	].join(' ');
	const output = await mapshaper.applyCommands(commands, { 'in.json': geojson });
	return /** @type {import('geojson').FeatureCollection<import('geojson').Polygon | import('geojson').MultiPolygon>} */ (
		JSON.parse(String(output['out.json']))
	);
}

/** Korean names for Wikidata items, cached between builds. @param {string[]} ids */
async function koreanNames(ids) {
	const file = `${CACHE}/wikidata-ko.json`;
	/** @type {Record<string, string>} */
	const names = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
	const missing = ids.filter((id) => !(id in names));
	for (let i = 0; i < missing.length; i += 200) {
		const batch = missing.slice(i, i + 200);
		const query = `SELECT ?item ?ko WHERE { VALUES ?item { ${batch.map((id) => `wd:${id}`).join(' ')} } OPTIONAL { ?item rdfs:label ?ko FILTER(LANG(?ko) = "ko") } }`;
		try {
			const response = await fetch('https://query.wikidata.org/sparql', {
				method: 'POST',
				headers: {
					Accept: 'application/sparql-results+json',
					'Content-Type': 'application/x-www-form-urlencoded',
					'User-Agent': 'marble-data/0.1 (https://github.com/shelost/marble)'
				},
				body: new URLSearchParams({ query })
			});
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			const { results } = await response.json();
			for (const id of batch) names[id] = '';
			for (const binding of results.bindings) {
				const id = binding.item.value.split('/').pop();
				if (binding.ko) names[id] = binding.ko.value;
			}
			log(`Korean names ${Math.min(i + 200, missing.length)}/${missing.length}`);
		} catch (error) {
			log(`Korean names skipped for a batch: ${/** @type {Error} */ (error).message}`);
		}
	}
	writeFileSync(file, JSON.stringify(names));
	return names;
}

/** The most common non-empty value. @param {string[]} values */
function mode(values) {
	/** @type {Map<string, number>} */
	const counts = new Map();
	for (const value of values) if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
	return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
}

const round = (/** @type {number} */ value, /** @type {number} */ step) => Math.round(value / step) * step;

/** Twice a ring's area in lon/lat, positive when it runs clockwise. @param {number[][]} ring */
function clockwise(ring) {
	let sum = 0;
	for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) sum += (ring[i][0] - ring[j][0]) * (ring[i][1] + ring[j][1]);
	return sum > 0;
}

/**
 * d3-geo reads polygons on the sphere: an outer ring must run clockwise and holes
 * counter-clockwise, or the shape means everything outside it. GeoJSON writers use the
 * opposite order, so set it here.
 * @param {import('geojson').Polygon | import('geojson').MultiPolygon} geometry
 */
function rewind(geometry) {
	const fix = (/** @type {number[][][]} */ polygon) =>
		polygon.map((ring, k) => (clockwise(ring) === (k === 0) ? ring : [...ring].reverse()));
	if (geometry.type === 'Polygon') return { ...geometry, coordinates: fix(geometry.coordinates) };
	return { ...geometry, coordinates: geometry.coordinates.map(fix) };
}

async function main() {
	const simplified = await simplify(await source());
	const features = simplified.features.filter((feature) => feature.geometry);
	log(`${features.length} rows after filtering`);

	/** @type {Map<string, typeof features>} */
	const byName = new Map();
	for (const feature of features) {
		const name = /** @type {string} */ (feature.properties?.Name);
		byName.set(name, [...(byName.get(name) ?? []), feature]);
	}
	const names = [...byName.keys()].sort((a, b) => a.localeCompare(b));
	const index = new Map(names.map((name, i) => [name, i]));
	const wikidata = names.map((name) => mode((byName.get(name) ?? []).map((f) => f.properties?.Wikidata)));
	const ko = await koreanNames([...new Set(wikidata.filter(Boolean))]);

	const polities = names.map((name, i) => {
		const rows = byName.get(name) ?? [];
		const largest = rows.reduce((best, row) => ((row.properties?.Area ?? 0) > (best.properties?.Area ?? 0) ? row : best));
		return {
			name,
			ko: KOREAN[/** @type {keyof typeof KOREAN} */ (name)] ?? (ko[wikidata[i]] || undefined),
			color: colorFor(name),
			wikipedia: mode(rows.map((f) => f.properties?.Wikipedia)) || undefined,
			wikidata: wikidata[i] || undefined,
			from: Math.min(...rows.map((f) => f.properties?.FromYear)),
			to: Math.max(...rows.map((f) => f.properties?.ToYear)),
			peak: { year: largest.properties?.FromYear, area: Math.round(largest.properties?.Area ?? 0) }
		};
	});

	const rows = features.map((feature) => {
		const p = feature.properties ?? {};
		return {
			type: /** @type {const} */ ('Feature'),
			geometry: rewind(feature.geometry),
			properties: {
				p: index.get(p.Name),
				f: p.FromYear,
				t: p.ToYear,
				a: Math.round(p.Area ?? 0),
				l: Number.isFinite(p.lx) ? [round(p.lx, 0.01), round(p.ly, 0.01)] : null
			}
		};
	});

	rmSync(`${OUT}/chunks`, { recursive: true, force: true });
	mkdirSync(`${OUT}/chunks`, { recursive: true });
	const chunks = CHUNK_STARTS.map((from, i) => {
		const to = (CHUNK_STARTS[i + 1] ?? LAST_YEAR + 1) - 1;
		const members = rows.filter((row) => row.properties.f <= to && row.properties.t >= from);
		const topo = topology({ rows: { type: 'FeatureCollection', features: members } }, 1e5);
		const file = `chunks/${from}.json`;
		writeFileSync(`${OUT}/${file}`, JSON.stringify(topo));
		log(`chunk ${from}..${to}: ${members.length} rows`);
		return { from, to, file, rows: members.length };
	});

	const changes = [
		...new Set(rows.flatMap((row) => [row.properties.f, row.properties.t + 1]).filter((year) => year >= FIRST_YEAR && year <= LAST_YEAR)),
		FIRST_YEAR
	].sort((a, b) => a - b);

	const peaks = PEAKS.map((name) => index.get(name)).filter((i) => i !== undefined);
	const missing = PEAKS.filter((name) => !index.has(name));
	if (missing.length) log(`peaks not found: ${missing.join(', ')}`);

	writeFileSync(
		`${OUT}/index.json`,
		JSON.stringify({
			source: { name: 'Cliopatria', version: VERSION, license: 'CC BY 4.0' },
			years: [FIRST_YEAR, LAST_YEAR],
			chunks,
			changes: [...new Set(changes)],
			peaks,
			polities
		})
	);
	copyFileSync(require.resolve('world-atlas/land-50m.json'), `${OUT}/land-50m.json`);
	log(`wrote ${polities.length} polities, ${chunks.length} chunks, ${changes.length} change years`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
