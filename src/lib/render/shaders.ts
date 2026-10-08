/**
 * Every vertex carries its longitude and latitude (radians), and the vertex shaders place it on
 * the globe, on the map, or in between: `uMorph` runs 0 (globe) to 1 (map). This mirrors
 * src/lib/geo.ts.
 */
const PLACE = /* glsl */ `
	uniform float uMorph;
	uniform mat3 uRotation;
	uniform float uCenter;
	const float PI = 3.141592653589793;

	float wrapLon(float x) { return x - 2.0 * PI * floor((x + PI) / (2.0 * PI)); }

	vec3 spherePosition(vec2 ll) {
		float c = cos(ll.y);
		return uRotation * vec3(c * sin(ll.x), sin(ll.y), c * cos(ll.x));
	}

	vec2 equalEarth(float lambda, float phi) {
		const float A1 = 1.340264;
		const float A2 = -0.081106;
		const float A3 = 0.000893;
		const float A4 = 0.003796;
		const float M = 0.8660254037844386;
		float theta = asin(M * sin(phi));
		float t2 = theta * theta;
		float t6 = t2 * t2 * t2;
		return vec2(
			lambda * cos(theta) / (M * (A1 + 3.0 * A2 * t2 + t6 * (7.0 * A3 + 9.0 * A4 * t2))),
			theta * (A1 + A2 * t2 + t6 * (A3 + A4 * t2))
		);
	}
`;

/**
 * The land and sea, with the political wash. `position.xy` is longitude and latitude. Its grid
 * is built across the map's own meridians, so its longitudes need no wrapping on the map.
 */
export const surfaceVertex = /* glsl */ `
	${PLACE}
	varying vec2 vLonLat;
	varying vec3 vNormal;

	void main() {
		vec2 lonlat = position.xy;
		vec3 s = spherePosition(lonlat);
		vec3 m = vec3(equalEarth(lonlat.x - uCenter, lonlat.y), 0.0);
		vLonLat = lonlat;
		vNormal = normalize(mix(s, vec3(0.0, 0.0, 1.0), uMorph));
		gl_Position = projectionMatrix * modelViewMatrix * vec4(mix(s, m, uMorph), 1.0);
	}
`;

export const surfaceFragment = /* glsl */ `
	uniform sampler2D uBase;
	uniform sampler2D uPolitical;
	uniform float uWash;
	uniform float uMorph;
	uniform vec3 uLight;
	varying vec2 vLonLat;
	varying vec3 vNormal;
	const float PI = 3.141592653589793;

	void main() {
		vec2 uv = vec2(vLonLat.x / (2.0 * PI) + 0.5, vLonLat.y / PI + 0.5);
		vec4 base = texture2D(uBase, uv);
		vec4 political = texture2D(uPolitical, uv);
		vec3 color = mix(base.rgb, political.rgb, political.a * uWash);
		float diffuse = max(dot(normalize(vNormal), uLight), 0.0);
		float shade = mix(0.42 + 0.68 * diffuse, 1.0, uMorph);
		gl_FragColor = vec4(color * shade, 1.0);
		#include <colorspace_fragment>
	}
`;

/**
 * Borders, coastlines and the graticule, with `position.xy` as longitude and latitude. Each
 * vertex also knows the other end of its segment, so on the map a segment that would cross the
 * edge is dropped instead of drawn across.
 */
export const lineVertex = /* glsl */ `
	${PLACE}
	attribute vec2 partner;
	uniform float uLift;

	void main() {
		vec2 lonlat = position.xy;
		float a = wrapLon(lonlat.x - uCenter);
		float b = wrapLon(partner.x - uCenter);
		if (uMorph > 0.001 && abs(a - b) > PI) {
			gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
			return;
		}
		vec3 s = spherePosition(lonlat) * (1.0 + uLift);
		vec3 m = vec3(equalEarth(a, lonlat.y), uLift);
		gl_Position = projectionMatrix * modelViewMatrix * vec4(mix(s, m, uMorph), 1.0);
	}
`;

export const lineFragment = /* glsl */ `
	uniform vec3 uColor;
	uniform float uOpacity;

	void main() {
		gl_FragColor = vec4(uColor, uOpacity);
		#include <colorspace_fragment>
	}
`;

/** A soft rim of air around the globe, fading out as it unrolls. */
export const atmosphereVertex = /* glsl */ `
	varying vec3 vNormal;
	varying vec3 vView;

	void main() {
		vec4 world = modelViewMatrix * vec4(position, 1.0);
		vNormal = normalize(normalMatrix * normal);
		vView = normalize(-world.xyz);
		gl_Position = projectionMatrix * world;
	}
`;

export const atmosphereFragment = /* glsl */ `
	uniform vec3 uColor;
	uniform float uOpacity;
	varying vec3 vNormal;
	varying vec3 vView;

	/* Seen from inside, the shell's normal faces away; it's brightest by the globe's edge and fades out. */
	void main() {
		float rim = smoothstep(0.0, 0.42, -dot(vNormal, vView));
		gl_FragColor = vec4(uColor, rim * rim * uOpacity);
		#include <colorspace_fragment>
	}
`;
