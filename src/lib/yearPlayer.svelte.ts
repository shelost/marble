import { FIRST_YEAR, LAST_YEAR, toPosition, toYear } from './timescale';

/** The whole timeline in about a minute. */
const SECONDS = 64;

/**
 * Plays the timeline at a steady pace along the track, so eras that change faster pass more
 * slowly in years. The year itself lives with the caller and is read and written through the
 * two callbacks, so the slider and the player never disagree.
 */
export class YearPlayer {
	playing = $state(false);
	#read: () => number;
	#write: (year: number) => void;
	#frame = 0;
	#last = 0;
	#position = 0;

	constructor(read: () => number, write: (year: number) => void) {
		this.#read = read;
		this.#write = write;
	}

	#tick = (now: number) => {
		if (!this.playing) return;
		this.#position = Math.min(1, this.#position + (now - this.#last) / 1000 / SECONDS);
		this.#last = now;
		this.#write(Math.round(toYear(this.#position)));
		if (this.#position < 1) this.#frame = requestAnimationFrame(this.#tick);
		else this.playing = false;
	};

	play() {
		if (this.playing) return;
		if (this.#read() >= LAST_YEAR) this.#write(FIRST_YEAR);
		this.#position = toPosition(this.#read());
		this.#last = performance.now();
		this.playing = true;
		this.#frame = requestAnimationFrame(this.#tick);
	}

	stop() {
		this.playing = false;
		cancelAnimationFrame(this.#frame);
	}

	toggle() {
		if (this.playing) this.stop();
		else this.play();
	}
}
