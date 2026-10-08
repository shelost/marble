import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

/** Set by a deploy that serves the site from a sub-path, e.g. GitHub Pages. */
const base = /** @type {'' | `/${string}`} */ (process.env.BASE_PATH ?? '');

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: { runes: true },
			adapter: adapter({ fallback: '404.html' }),
			paths: { base }
		})
	]
});
