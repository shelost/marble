import {
	AdditiveBlending,
	BackSide,
	BufferAttribute,
	BufferGeometry,
	CanvasTexture,
	Color,
	DoubleSide,
	LineSegments,
	Matrix3,
	Mesh,
	PerspectiveCamera,
	RepeatWrapping,
	Scene,
	ShaderMaterial,
	Sphere,
	SphereGeometry,
	SRGBColorSpace,
	Vector3,
	WebGLRenderer
} from 'three';
import type { FeatureCollection, MultiPolygon, Polygon } from 'geojson';
import { DEG, MAP_HALF, RAD, frontRotation, mapInvert, mapPoint, rotate, spherePoint, unrotate, wrap } from '../geo';
import type { LonLat, Mode, Polity, Row } from '../types';
import { PoliticalPainter, paintBase } from './painter';
import { graticule, ringSegments, ringsOf } from './lines';
import { atmosphereFragment, atmosphereVertex, lineFragment, lineVertex, surfaceFragment, surfaceVertex } from './shaders';

const FOV = 30;
const TAN = Math.tan((FOV / 2) * RAD);
/** Camera distance from the globe's centre: closest, farthest, and where it starts. */
const GLOBE = { near: 1.2, far: 9, initial: 4.4 };
const MORPH_MS = 1500;
const FLY_MS = 1100;
const LIFT = { graticule: 0.0006, coast: 0.0011, border: 0.0016, hover: 0.0022, select: 0.0028 };

export interface Projected {
	x: number;
	y: number;
	/** Screen pixels per scene unit at that point. */
	scale: number;
}

export interface SceneEvents {
	/** After every redraw, e.g. to move labels. */
	onframe?: () => void;
	/** Where the pointer is over the world, or null off it. */
	onpoint?: (at: LonLat | null) => void;
	/** A click or tap on the world. */
	onpick?: (at: LonLat | null) => void;
}

type Land = FeatureCollection<Polygon | MultiPolygon>;

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** The land-and-sea mesh: a 1° grid of longitudes and latitudes spanning the map's meridians. */
function surfaceGeometry(center: number, lonSteps = 360, latSteps = 180): BufferGeometry {
	const positions = new Float32Array((lonSteps + 1) * (latSteps + 1) * 2);
	fillGrid(positions, center, lonSteps, latSteps);
	const index = new Uint32Array(lonSteps * latSteps * 6);
	let k = 0;
	for (let j = 0; j < latSteps; j++) {
		for (let i = 0; i < lonSteps; i++) {
			const a = j * (lonSteps + 1) + i;
			const b = a + 1;
			const c = a + lonSteps + 1;
			const d = c + 1;
			index.set([a, c, b, b, c, d], k);
			k += 6;
		}
	}
	const geometry = new BufferGeometry();
	geometry.setAttribute('position', new BufferAttribute(positions, 2));
	geometry.setIndex(new BufferAttribute(index, 1));
	geometry.boundingSphere = new Sphere(new Vector3(), 4);
	return geometry;
}

function fillGrid(positions: Float32Array, center: number, lonSteps = 360, latSteps = 180) {
	let k = 0;
	for (let j = 0; j <= latSteps; j++) {
		const phi = Math.PI / 2 - (j / latSteps) * Math.PI;
		for (let i = 0; i <= lonSteps; i++) {
			positions[k++] = center - Math.PI + (i / lonSteps) * 2 * Math.PI;
			positions[k++] = phi;
		}
	}
}

/**
 * The world as a globe or a map, drawn with three.js. Both are the same meshes: the shaders
 * put every vertex on the sphere, on the Equal Earth map, or between the two, so switching
 * modes unrolls the globe into the map around the place being looked at.
 *
 * The camera never turns; it always looks down -z. On the globe the world turns under it
 * (the point being looked at faces the camera), and on the map the camera slides over it.
 */
export class MarbleScene {
	mode: Mode = 'globe';
	#canvas: HTMLCanvasElement;
	#events: SceneEvents;
	#renderer: WebGLRenderer;
	#scene = new Scene();
	#camera = new PerspectiveCamera(FOV, 1, 0.01, 60);
	#shared = { uMorph: { value: 0 }, uRotation: { value: new Matrix3() }, uCenter: { value: 0 } };
	#surface: Mesh<BufferGeometry, ShaderMaterial>;
	#atmosphere: Mesh<SphereGeometry, ShaderMaterial>;
	#borders: LineSegments<BufferGeometry, ShaderMaterial>;
	#hover: LineSegments<BufferGeometry, ShaderMaterial>;
	#select: LineSegments<BufferGeometry, ShaderMaterial>;
	#painter: PoliticalPainter;
	#political: CanvasTexture;
	#textures: CanvasTexture[] = [];
	#pendingRows: { rows: Row[]; polities: Polity[] } | null = null;

	/** The globe: the point facing the camera, and the camera's distance from the centre. */
	#view = { lon: 60 * RAD, lat: 22 * RAD, distance: GLOBE.initial };
	/** The map: its central meridian, the point under the camera, and the camera's height. */
	#map = { center: 60 * RAD, x: 0, y: 0, distance: 5 };
	#rotation = frontRotation(60 * RAD, 22 * RAD);
	#morph = 0;
	#transition: { from: number; to: number; start: number } | null = null;
	#fly: { start: number; from: [number, number]; to: [number, number] } | null = null;

	#width = 1;
	#height = 1;
	/** Pixels at the top and bottom covered by other UI: the world centres in the space between. */
	#inset = { top: 0, bottom: 0 };
	/** The globe's resting distance, set to fit the space on screen; it follows resizes until a zoom. */
	#home = GLOBE.initial;
	#zoomed = false;
	#dirty = true;
	#frame = 0;
	#last = 0;
	#resize: ResizeObserver;

	#pointers = new Map<number, { x: number; y: number }>();
	#drag: { x: number; y: number; startX: number; startY: number; time: number; moved: number } | null = null;
	#pinch: number | null = null;
	#velocity = { x: 0, y: 0 };
	#hoverAt: { x: number; y: number } | null = null;

	constructor(canvas: HTMLCanvasElement, land: Land, events: SceneEvents = {}) {
		this.#canvas = canvas;
		this.#events = events;
		this.#renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
		this.#renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
		this.#renderer.setClearColor(0x000000, 0);

		const small = Math.min(window.screen.width, window.screen.height) < 700;
		const width = this.#renderer.capabilities.maxTextureSize >= 4096 && !small ? 4096 : 2048;
		const anisotropy = Math.min(8, this.#renderer.capabilities.getMaxAnisotropy());
		const texture = (source: HTMLCanvasElement) => {
			const t = new CanvasTexture(source);
			t.colorSpace = SRGBColorSpace;
			t.wrapS = RepeatWrapping;
			t.anisotropy = anisotropy;
			this.#textures.push(t);
			return t;
		};
		this.#painter = new PoliticalPainter(width, width / 2, land);
		this.#political = texture(this.#painter.canvas);

		this.#surface = new Mesh(
			surfaceGeometry(this.#map.center),
			new ShaderMaterial({
				uniforms: {
					...this.#shared,
					uBase: { value: texture(paintBase(width, width / 2, land)) },
					uPolitical: { value: this.#political },
					uWash: { value: 0.84 },
					uLight: { value: new Vector3(-0.45, 0.55, 0.72).normalize() }
				},
				vertexShader: surfaceVertex,
				fragmentShader: surfaceFragment,
				side: DoubleSide
			})
		);
		this.#surface.frustumCulled = false;
		this.#scene.add(this.#surface);

		this.#line(ringSegments(graticule(), 2), '#a9c3d4', 0.13, LIFT.graticule, 1);
		this.#line(ringSegments(ringsOf(land.features.map((f) => f.geometry)), 1), '#0e2131', 0.5, LIFT.coast, 2);
		this.#borders = this.#line(new BufferGeometry(), '#17120d', 0.46, LIFT.border, 3);
		this.#hover = this.#line(new BufferGeometry(), '#fffaf0', 0.95, LIFT.hover, 4);
		this.#select = this.#line(new BufferGeometry(), '#f6c453', 1, LIFT.select, 5);

		this.#atmosphere = new Mesh(
			new SphereGeometry(1.1, 64, 32),
			new ShaderMaterial({
				uniforms: { uColor: { value: new Color('#6fa6d8') }, uOpacity: { value: 0.55 } },
				vertexShader: atmosphereVertex,
				fragmentShader: atmosphereFragment,
				side: BackSide,
				blending: AdditiveBlending,
				transparent: true,
				depthWrite: false
			})
		);
		this.#atmosphere.renderOrder = 6;
		this.#scene.add(this.#atmosphere);

		canvas.addEventListener('pointerdown', this.#down);
		canvas.addEventListener('pointermove', this.#move);
		canvas.addEventListener('pointerup', this.#up);
		canvas.addEventListener('pointercancel', this.#up);
		canvas.addEventListener('pointerleave', this.#leave);
		canvas.addEventListener('wheel', this.#wheel, { passive: false });
		this.#resize = new ResizeObserver(() => this.resize());
		this.#resize.observe(canvas);
		this.resize();
		this.#last = performance.now();
		this.#frame = requestAnimationFrame(this.#loop);
	}

	#line(geometry: BufferGeometry, color: string, opacity: number, lift: number, order: number) {
		const line = new LineSegments(
			geometry,
			new ShaderMaterial({
				uniforms: { ...this.#shared, uColor: { value: new Color(color) }, uOpacity: { value: opacity }, uLift: { value: lift } },
				vertexShader: lineVertex,
				fragmentShader: lineFragment,
				transparent: true,
				depthWrite: false
			})
		);
		line.frustumCulled = false;
		line.renderOrder = order;
		this.#scene.add(line);
		return line;
	}

	/** Paint the polities of a year. Painting waits for the next frame, so scrubbing paints once a frame at most. */
	setRows(rows: Row[], polities: Polity[]) {
		this.#pendingRows = { rows, polities };
	}

	/** Redraw on the next frame, e.g. when labels change language. */
	refresh() {
		this.#dirty = true;
	}

	setHover(row: Row | null) {
		this.#outline(this.#hover, row);
	}

	setSelected(row: Row | null) {
		this.#outline(this.#select, row);
	}

	#outline(line: LineSegments<BufferGeometry, ShaderMaterial>, row: Row | null) {
		line.geometry.dispose();
		line.geometry = row ? ringSegments(ringsOf([row.geometry]), 1) : new BufferGeometry();
		this.#dirty = true;
	}

	setMode(mode: Mode) {
		if (mode === this.mode) return;
		this.mode = mode;
		this.#velocity = { x: 0, y: 0 };
		this.#fly = null;
		if (mode === 'map') {
			const view = this.#view;
			this.#map.center = view.lon;
			const positions = this.#surface.geometry.getAttribute('position') as BufferAttribute;
			fillGrid(positions.array as Float32Array, view.lon);
			positions.needsUpdate = true;
			const [, y] = mapPoint(view.lon, view.lat, view.lon);
			this.#map.x = 0;
			this.#map.y = y;
			this.#map.distance = this.#fit() * clamp((view.distance - 1) / (this.#home - 1), 0.05, 1.15);
			this.#clampMap();
		} else {
			const map = this.#map;
			const [lon, lat] = mapInvert(map.x, map.y, map.center) ?? [map.center, 0];
			this.#view.lon = lon;
			this.#view.lat = clamp(lat, -80 * RAD, 80 * RAD);
			this.#view.distance = clamp(1 + (map.distance / this.#fit()) * (this.#home - 1), GLOBE.near, GLOBE.far);
		}
		this.#transition = { from: this.#morph, to: mode === 'map' ? 1 : 0, start: performance.now() };
	}

	/** Turn the globe, or slide the map, to look at a place. */
	flyTo([lon, lat]: LonLat) {
		if (this.#transition) return;
		const λ = lon * RAD;
		const φ = lat * RAD;
		if (this.mode === 'globe') {
			const from = this.#view.lon;
			const to = from + wrap(λ - from);
			this.#fly = { start: performance.now(), from: [from, this.#view.lat], to: [to, clamp(φ, -75 * RAD, 75 * RAD)] };
		} else {
			const [x, y] = mapPoint(λ, φ, this.#map.center);
			this.#fly = {
				start: performance.now(),
				from: [this.#map.x, this.#map.y],
				to: [clamp(x, -MAP_HALF.x, MAP_HALF.x), clamp(y, -MAP_HALF.y, MAP_HALF.y)]
			};
		}
		this.#velocity = { x: 0, y: 0 };
	}

	/** Leave room for UI over the top and bottom of the canvas. */
	setInsets(top: number, bottom: number) {
		if (top === this.#inset.top && bottom === this.#inset.bottom) return;
		this.#inset = { top, bottom };
		this.resize();
	}

	resize() {
		const width = this.#canvas.clientWidth;
		const height = this.#canvas.clientHeight;
		if (!width || !height) return;
		this.#width = width;
		this.#height = height;
		this.#renderer.setSize(width, height, false);
		this.#camera.aspect = width / height;
		this.#camera.setViewOffset(width, height, 0, (this.#inset.bottom - this.#inset.top) / 2, width, height);
		this.#camera.updateProjectionMatrix();
		const visible = this.#visible();
		this.#home = clamp(1 / Math.sin(Math.atan(0.84 * visible * TAN)), 2.2, GLOBE.far);
		if (!this.#zoomed) {
			this.#view.distance = this.#home;
			this.#map.distance = this.#fit();
		}
		this.#map.distance = Math.min(this.#map.distance, this.#fit() * 1.2);
		this.#clampMap();
		this.#dirty = true;
	}

	/** Where (lon, lat) in degrees is on screen, or null if it's out of sight. */
	project(lon: number, lat: number): Projected | null {
		const m = this.#morph;
		const λ = lon * RAD;
		const φ = lat * RAD;
		const s = rotate(this.#rotation, spherePoint(λ, φ));
		if (m < 0.5 && s[2] < 1 / this.#view.distance + 0.14) return null;
		const [mx, my] = mapPoint(λ, φ, this.#map.center);
		const x = s[0] + (mx - s[0]) * m;
		const y = s[1] + (my - s[1]) * m;
		const z = s[2] * (1 - m);
		const camera = this.#camera.position;
		const depth = camera.z - z;
		if (depth <= 0.01) return null;
		const focal = this.#height / 2 / TAN;
		return {
			x: this.#width / 2 + ((x - camera.x) / depth) * focal,
			y: (this.#height + this.#inset.top - this.#inset.bottom) / 2 - ((y - camera.y) / depth) * focal,
			scale: focal / depth
		};
	}

	/** A point on screen as normalised device coordinates around the view's centre. */
	#ndc(clientX: number, clientY: number): [number, number] {
		const rect = this.#canvas.getBoundingClientRect();
		const shift = (this.#inset.bottom - this.#inset.top) / 2;
		return [((clientX - rect.left) / rect.width) * 2 - 1, 1 - ((clientY - rect.top + shift) / rect.height) * 2];
	}

	/** The longitude and latitude (degrees) under a point on screen, or null. */
	pick(clientX: number, clientY: number): LonLat | null {
		if (this.#transition) return null;
		const [nx, ny] = this.#ndc(clientX, clientY);
		const dir = new Vector3(nx * TAN * this.#camera.aspect, ny * TAN, -1).normalize();
		const origin = this.#camera.position;
		if (this.mode === 'globe') {
			const b = origin.dot(dir);
			const c = origin.lengthSq() - 1;
			const disc = b * b - c;
			if (disc < 0) return null;
			const t = -b - Math.sqrt(disc);
			const hit = origin.clone().addScaledVector(dir, t);
			const [x, y, z] = unrotate(this.#rotation, [hit.x, hit.y, hit.z]);
			return [Math.atan2(x, z) * DEG, Math.asin(clamp(y, -1, 1)) * DEG];
		}
		const t = -origin.z / dir.z;
		const at = mapInvert(origin.x + dir.x * t, origin.y + dir.y * t, this.#map.center);
		return at && [at[0] * DEG, at[1] * DEG];
	}

	dispose() {
		cancelAnimationFrame(this.#frame);
		this.#resize.disconnect();
		const canvas = this.#canvas;
		canvas.removeEventListener('pointerdown', this.#down);
		canvas.removeEventListener('pointermove', this.#move);
		canvas.removeEventListener('pointerup', this.#up);
		canvas.removeEventListener('pointercancel', this.#up);
		canvas.removeEventListener('pointerleave', this.#leave);
		canvas.removeEventListener('wheel', this.#wheel);
		this.#scene.traverse((object) => {
			if (object instanceof Mesh || object instanceof LineSegments) {
				object.geometry.dispose();
				(object.material as ShaderMaterial).dispose();
			}
		});
		for (const texture of this.#textures) texture.dispose();
		this.#renderer.dispose();
	}

	/** The share of the canvas's height that isn't covered. */
	#visible() {
		return Math.max(0.3, 1 - (this.#inset.top + this.#inset.bottom) / this.#height);
	}

	/** Camera height that fits the whole map in the space on screen. */
	#fit() {
		return Math.max(MAP_HALF.y / (TAN * this.#visible()), MAP_HALF.x / (TAN * this.#camera.aspect)) * 1.04;
	}

	/** Keep the map on screen: it can't slide further than its edges, and it centres once it all fits. */
	#clampMap() {
		const map = this.#map;
		const halfHeight = map.distance * TAN * this.#visible();
		const halfWidth = map.distance * TAN * this.#camera.aspect;
		const x = Math.max(0, MAP_HALF.x - halfWidth);
		const y = Math.max(0, MAP_HALF.y - halfHeight);
		map.x = clamp(map.x, -x, x);
		map.y = clamp(map.y, -y, y);
	}

	/** The sphere's radius on screen, in pixels. */
	#globeRadius() {
		const d = this.#view.distance;
		return ((this.#height / 2) * Math.tan(Math.asin(1 / d))) / TAN;
	}

	/** Drag by (dx, dy) screen pixels: turn the globe or slide the map so the ground follows. */
	#pan(dx: number, dy: number) {
		if (this.#transition) return;
		if (this.mode === 'globe') {
			const r = this.#globeRadius();
			this.#view.lon = wrap(this.#view.lon - dx / r);
			this.#view.lat = clamp(this.#view.lat + dy / r, -85 * RAD, 85 * RAD);
		} else {
			const unit = (2 * this.#map.distance * TAN) / this.#height;
			this.#map.x -= dx * unit;
			this.#map.y += dy * unit;
			this.#clampMap();
		}
		this.#dirty = true;
	}

	/** Zoom by `factor` (>1 is out), keeping the map point under the cursor in place. */
	#zoom(factor: number, clientX: number, clientY: number) {
		if (this.#transition) return;
		this.#zoomed = true;
		if (this.mode === 'globe') {
			this.#view.distance = clamp(1 + (this.#view.distance - 1) * factor, GLOBE.near, GLOBE.far);
		} else {
			const [nx, ny] = this.#ndc(clientX, clientY);
			const before = this.#map.distance;
			const after = clamp(before * factor, 0.12, this.#fit() * 1.2);
			const shift = (before - after) * TAN;
			this.#map.x += nx * shift * this.#camera.aspect;
			this.#map.y += ny * shift;
			this.#map.distance = after;
			this.#clampMap();
		}
		this.#dirty = true;
	}

	#down = (event: PointerEvent) => {
		this.#canvas.setPointerCapture(event.pointerId);
		this.#pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
		this.#velocity = { x: 0, y: 0 };
		this.#fly = null;
		if (this.#pointers.size === 1) {
			this.#drag = { x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY, time: event.timeStamp, moved: 0 };
		} else if (this.#pointers.size === 2) {
			const [a, b] = [...this.#pointers.values()];
			this.#pinch = Math.hypot(a.x - b.x, a.y - b.y);
			this.#drag = null;
		}
	};

	#move = (event: PointerEvent) => {
		const pointer = this.#pointers.get(event.pointerId);
		if (!pointer) {
			this.#hoverAt = { x: event.clientX, y: event.clientY };
			return;
		}
		const dx = event.clientX - pointer.x;
		const dy = event.clientY - pointer.y;
		pointer.x = event.clientX;
		pointer.y = event.clientY;
		if (this.#pinch !== null && this.#pointers.size === 2) {
			const [a, b] = [...this.#pointers.values()];
			const distance = Math.hypot(a.x - b.x, a.y - b.y);
			this.#zoom(this.#pinch / distance, (a.x + b.x) / 2, (a.y + b.y) / 2);
			this.#pan(dx / 2, dy / 2);
			this.#pinch = distance;
			return;
		}
		const drag = this.#drag;
		if (!drag) return;
		const dt = Math.max(1, event.timeStamp - drag.time);
		this.#velocity = { x: this.#velocity.x * 0.5 + (dx / dt) * 0.5, y: this.#velocity.y * 0.5 + (dy / dt) * 0.5 };
		drag.time = event.timeStamp;
		drag.moved += Math.hypot(dx, dy);
		this.#pan(dx, dy);
	};

	#up = (event: PointerEvent) => {
		this.#pointers.delete(event.pointerId);
		const drag = this.#drag;
		if (drag && drag.moved < 6) {
			this.#velocity = { x: 0, y: 0 };
			this.#events.onpick?.(this.pick(event.clientX, event.clientY));
		} else if (drag && event.timeStamp - drag.time > 80) {
			this.#velocity = { x: 0, y: 0 };
		}
		if (this.#pointers.size < 2) this.#pinch = null;
		this.#drag = null;
	};

	#leave = (event: PointerEvent) => {
		if (event.pointerType === 'mouse') {
			this.#hoverAt = null;
			this.#events.onpoint?.(null);
		}
	};

	#wheel = (event: WheelEvent) => {
		event.preventDefault();
		const delta = event.deltaY * (event.deltaMode === 1 ? 16 : 1);
		this.#zoom(Math.exp(clamp(delta, -120, 120) * 0.0016), event.clientX, event.clientY);
	};

	#loop = (now: number) => {
		this.#frame = requestAnimationFrame(this.#loop);
		const dt = Math.min(64, now - this.#last);
		this.#last = now;

		if (this.#transition) {
			const { from, to, start } = this.#transition;
			const t = clamp((now - start) / MORPH_MS, 0, 1);
			this.#morph = from + (to - from) * easeInOut(t);
			if (t >= 1) this.#transition = null;
			this.#dirty = true;
		}

		if (this.#fly) {
			const { start, from, to } = this.#fly;
			const t = clamp((now - start) / FLY_MS, 0, 1);
			const e = easeInOut(t);
			const a = from[0] + (to[0] - from[0]) * e;
			const b = from[1] + (to[1] - from[1]) * e;
			if (this.mode === 'globe') {
				this.#view.lon = wrap(a);
				this.#view.lat = b;
			} else {
				this.#map.x = a;
				this.#map.y = b;
				this.#clampMap();
			}
			if (t >= 1) this.#fly = null;
			this.#dirty = true;
		}

		if (!this.#drag && (Math.abs(this.#velocity.x) > 0.01 || Math.abs(this.#velocity.y) > 0.01)) {
			this.#pan(this.#velocity.x * dt, this.#velocity.y * dt);
			const decay = Math.exp(-dt / 260);
			this.#velocity.x *= decay;
			this.#velocity.y *= decay;
		}

		if (this.#pendingRows) {
			const { rows, polities } = this.#pendingRows;
			this.#pendingRows = null;
			this.#painter.paint(rows, polities);
			this.#political.needsUpdate = true;
			this.#borders.geometry.dispose();
			this.#borders.geometry = ringSegments(ringsOf(rows.map((row) => row.geometry)));
			this.#dirty = true;
		}

		if (this.#hoverAt && !this.#drag) {
			const { x, y } = this.#hoverAt;
			this.#hoverAt = null;
			this.#events.onpoint?.(this.pick(x, y));
		}

		if (!this.#dirty) return;
		this.#dirty = false;
		this.#apply();
		this.#renderer.render(this.#scene, this.#camera);
		this.#events.onframe?.();
	};

	/** Turn the state into uniforms and a camera. */
	#apply() {
		const m = this.#morph;
		this.#rotation = frontRotation(this.#view.lon, this.#view.lat);
		this.#shared.uRotation.value.set(...(this.#rotation as [number, number, number, number, number, number, number, number, number]));
		this.#shared.uMorph.value = m;
		this.#shared.uCenter.value = this.#map.center;
		this.#atmosphere.visible = m < 0.98;
		this.#atmosphere.material.uniforms.uOpacity.value = 0.55 * (1 - m) ** 2;
		const x = this.#map.x * m;
		const y = this.#map.y * m;
		this.#camera.position.set(x, y, this.#view.distance + (this.#map.distance - this.#view.distance) * m);
		this.#camera.lookAt(x, y, 0);
	}
}
