<!--
	Takes the print behind it apart toward the bottom edge, so a panel of art flows into the page
	instead of ending on a ruled line. Not a gradient: the page colour is painted back over the art
	in an 8×8 ordered dither, a dot at a time, so what you see is the print's own grain thinning
	out until there is nothing left. Fills its positioned parent, and paints over nothing else.
-->
<script lang="ts">
	import { onMount } from 'svelte';

	let {
		/** The page behind the art. Anything else and the dissolve reads as a smudge. */
		colour = '#05030f',
		/** How much of the box the dissolve takes, measured up from the bottom edge. */
		depth = 0.5,
		/** Grid of the dissolve in CSS pixels, near the pitch of the dots in the prints. */
		cell = 9
	}: { colour?: string; depth?: number; cell?: number } = $props();

	let canvas: HTMLCanvasElement;

	// The same 8×8 ordered matrix the torch burns through, so both dissolves share a grain.
	const BAYER = [
		0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60,
		28, 52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47,
		7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21
	];

	onMount(() => {
		const stage = canvas.parentElement!;
		let timer = 0;

		function paint() {
			const width = stage.clientWidth;
			const height = stage.clientHeight;
			if (!width || !height) return;

			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			canvas.width = Math.round(width * dpr);
			canvas.height = Math.round(height * dpr);
			const ctx = canvas.getContext('2d')!;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			ctx.fillStyle = colour;

			// A share of the box, but never so short a run that the print snaps off rather than
			// thins: a phone's band of art is only a couple of hundred pixels tall.
			const span = Math.min(height, Math.max(height * depth, 100));
			const top = height - span;
			// Wide enough that four neighbours leave no pinhole between them, so the last row is solid.
			const radius = cell * 0.72;

			ctx.beginPath();
			for (let gy = Math.floor(top / cell); gy * cell < height; gy++) {
				const cy = (gy + 0.5) * cell;
				const run = (gy & 7) << 3;
				const under = (cy - top) / span;
				if (under <= 0) continue;
				// The waterline drifts across the width so the dissolve doesn't read as a straight
				// edge, and the drift dies out at both ends: none at the start, none at the bottom,
				// where every last dot has to go.
				const wobble = 4 * under * (1 - under);
				for (let gx = 0; gx * cell < width; gx++) {
					const cx = (gx + 0.5) * cell;
					const drift = 0.07 * Math.sin(cx * 0.013) + 0.04 * Math.sin(cx * 0.043 + 2.1);
					const t = Math.min(1, Math.max(0, under + drift * wobble));
					// Bent low, because a disc covers rather more than its own cell: straight, the art
					// would be half gone by the time the dissolve looked like it had started. It
					// reaches full cover just before the edge, or the densest cell of the matrix
					// leaves a line of stragglers along it.
					const cover = Math.min(1, (t / 0.94) ** 1.8);
					if (cover <= (BAYER[run | (gx & 7)] + 0.5) / 64) continue;
					ctx.moveTo(cx + radius, cy);
					ctx.arc(cx, cy, radius, 0, Math.PI * 2);
				}
			}
			ctx.fill();
		}

		paint();
		const size = new ResizeObserver(() => {
			clearTimeout(timer);
			timer = window.setTimeout(paint, 100);
		});
		size.observe(stage);

		return () => {
			clearTimeout(timer);
			size.disconnect();
		};
	});
</script>

<canvas bind:this={canvas} class="absolute inset-0 z-0 block size-full" aria-hidden="true"></canvas>
