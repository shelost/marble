# Marble

The political map of the world from 1000 BCE to today, on a globe and on a flat map. Drag the timeline (or press play) and watch empires rise and fall; click a country for its dates, its size and a link to read more.

Built with SvelteKit and three.js.

## Using it

- **Globe / Map** (or <kbd>G</kbd> / <kbd>M</kbd>): switch views. The globe unrolls into an Equal Earth map centred on wherever you were looking, and rolls back up the same way.
- **Drag** to turn the globe or pan the map; **scroll or pinch** to zoom.
- **Timeline**: drag, use the arrow keys (Shift for 10 years, Alt for 100), or press <kbd>Space</kbd> to play. Recent centuries get more of the track because borders change faster. Ticks are turning points: picking one jumps to its year and turns the view to its place. The triangles mark great empires at their height.
- **Click a country** to select it; the selection follows it through the years. <kbd>Esc</kbd> clears it.
- **EN / 한국어** switches labels and text.

## How it works

- `scripts/build-data.mjs` turns [Cliopatria](https://github.com/Seshat-Global-History-Databank/cliopatria) into `static/data`:
  - It keeps polities that exist from 1000 BCE on.
  - It simplifies their borders and finds a point inside each shape for its label.
  - It splits them into era chunks, so the app only downloads the centuries in view (each chunk is 20–200 KB gzipped).
  - It writes an index with a colour per polity, Korean names from Wikidata, and each polity's peak extent.
- `src/lib/render/scene.ts` draws both views with one set of meshes:
  - Every vertex carries its longitude and latitude, and the shaders place it on the sphere, on the map, or in between.
  - Country colours are painted into a texture each time a border changes, then clipped to Natural Earth coastlines.
  - Borders, coastlines and the graticule are vector lines.
- `src/lib/atlas.svelte.ts` loads chunks as the timeline moves. `src/lib/components` holds the view, the timeline and the country card.

## Development

```sh
npm install
npm run dev
npm run check
npm run build
```

`npm run data` rebuilds `static/data` from the pinned Cliopatria release (it downloads about 46 MB into `.cache/`). Colours live in `scripts/palette.mjs`, and corrections to Korean names in `scripts/build-data.mjs`.

## Data and credits

- Borders: **Cliopatria**, Seshat Global History Databank (Chalstrey, Bennett & Mutch), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Marble simplifies the borders and clips them to the coastline.
- Land and coastlines: [Natural Earth](https://www.naturalearthdata.com), public domain, via [world-atlas](https://github.com/topojson/world-atlas).
- Korean names: [Wikidata](https://www.wikidata.org), CC0, with a few corrections.

Cliopatria's borders show areas actually controlled rather than claimed, and it includes states of roughly 5,000 km² or more that lasted 50 years or longer. Some states are missing or start late, for example Tiwanaku, Wari, Great Zimbabwe, and Japan before 540.
