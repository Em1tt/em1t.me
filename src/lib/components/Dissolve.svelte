<!--
	Takes a print apart on its own halftone lattice. The page colour is painted back over the art,
	one screen dot at a time, in an 8×8 ordered dither: whole dots wink out, so what is left is
	still a print, just a thinner one. The grid is the print's, not an arbitrary one — measured off
	the source and put back through the same cover fit the CSS uses, so the discs land on the dots
	instead of chewing them in half.

	Fills its positioned parent, which is also what the art is painted on, so extending that parent
	past its block is what carries the print into whatever follows.
-->
<script lang="ts">
	import { onMount } from 'svelte';

	let {
		/** The print behind it: the same URL the parent's background-image uses. */
		art,
		/** Cells across the print's halftone screen. bg4.png rules 1600px into 192, so 25/3 px. */
		cells = 192,
		/** The parent's background-position-x as a fraction, or the grids drift apart. */
		position = 0.5,
		/** How much of the box the dissolve takes, measured up from the bottom edge. */
		depth = 0.34,
		/** The page behind the art. Anything else and the dissolve reads as a smudge. */
		colour = '#05030f'
	}: {
		art: string;
		cells?: number;
		position?: number;
		depth?: number;
		colour?: string;
	} = $props();

	let canvas: HTMLCanvasElement;

	// The same 8×8 ordered matrix the torch burns through, so both dissolves share a grain.
	const BAYER = [
		0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60,
		28, 52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47,
		7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21
	];

	/** Shrunk into a narrow column the screen is far too fine to read, so dissolve it in blocks. */
	const MIN_DOT = 7;

	onMount(() => {
		const stage = canvas.parentElement!;
		const image = new Image();
		let timer = 0;

		function paint() {
			const width = stage.clientWidth;
			const height = stage.clientHeight;
			if (!width || !height || !image.naturalWidth) return;

			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			canvas.width = Math.round(width * dpr);
			canvas.height = Math.round(height * dpr);
			const ctx = canvas.getContext('2d')!;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			ctx.fillStyle = colour;

			// background-size: cover, background-position: <position> 50% — the same sum the parent's
			// CSS does, so the lattice below lands exactly on the dots it is painting over.
			const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
			const originX = (width - image.naturalWidth * scale) * position;
			const originY = (height - image.naturalHeight * scale) * 0.5;

			// One cell of the print's screen, and the block of whole cells the dissolve works in.
			const pitch = (image.naturalWidth / cells) * scale;
			const step = Math.max(1, Math.round(MIN_DOT / pitch));
			const grid = pitch * step;
			// Wide enough that four neighbours leave no pinhole, so the solid reds go clean too.
			const radius = grid * 0.72;

			// A share of the box, but never so short a run that the print snaps off rather than thins.
			const span = Math.min(height, Math.max(height * depth, 120));
			const top = height - span;

			const firstRow = Math.floor((top - originY) / grid);
			const lastRow = Math.ceil((height - originY) / grid);
			const firstCol = Math.floor(-originX / grid);
			const lastCol = Math.ceil((width - originX) / grid);

			ctx.beginPath();
			for (let j = firstRow; j <= lastRow; j++) {
				const cy = originY + (j + 0.5) * grid;
				const under = (cy - top) / span;
				if (under <= 0) continue;
				// The waterline drifts across the width so the dissolve doesn't read as a straight
				// edge, and the drift dies out at both ends: none at the start, none at the bottom,
				// where every last dot has to go.
				const wobble = 4 * under * (1 - under);
				const run = (j & 7) << 3;
				for (let i = firstCol; i <= lastCol; i++) {
					const cx = originX + (i + 0.5) * grid;
					const drift = 0.07 * Math.sin(cx * 0.013) + 0.04 * Math.sin(cx * 0.043 + 2.1);
					const t = Math.min(1, Math.max(0, under + drift * wobble));
					// A disc now covers its own cell and no more, so this is near enough the share of
					// dots gone. It finishes well short of the edge: the last few per cent of the
					// dots are the ones you notice, and cut off by the box they read as a ruled
					// line rather than a print running out.
					const cover = Math.min(1, (t / 0.82) ** 1.25);
					if (cover <= (BAYER[run | (i & 7)] + 0.5) / 64) continue;
					ctx.moveTo(cx + radius, cy);
					ctx.arc(cx, cy, radius, 0, Math.PI * 2);
				}
			}
			ctx.fill();
		}

		const size = new ResizeObserver(() => {
			clearTimeout(timer);
			timer = window.setTimeout(paint, 100);
		});
		size.observe(stage);
		image.onload = paint;
		image.src = art;

		return () => {
			clearTimeout(timer);
			size.disconnect();
		};
	});
</script>

<canvas bind:this={canvas} class="absolute inset-0 z-0 block size-full" aria-hidden="true"></canvas>
