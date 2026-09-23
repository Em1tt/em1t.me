<!--
	Burn-through reveal: the print sits under the black, and the cursor (or a slow idle ember)
	uncovers it through an 8×8 ordered dither. Embers flicker at the edge as the trail cools.
	Fills its positioned parent and listens to pointer moves on it.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { INKS } from '$lib/halftone';

	let { art }: { art: string } = $props();

	let canvas: HTMLCanvasElement;

	const CELL = 6;
	const BAYER = [
		0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60,
		28, 52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47,
		7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21
	];

	onMount(() => {
		const stage = canvas.parentElement!;
		const ctx = canvas.getContext('2d')!;
		const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
		const image = new Image();

		let width = 0;
		let height = 0;
		let dpr = 1;
		let cols = 0;
		let rows = 0;
		let heat = new Float32Array(0);
		let mask: HTMLCanvasElement | undefined;
		let maskCtx: CanvasRenderingContext2D;
		let maskData: ImageData;
		let artLayer: HTMLCanvasElement | undefined;
		let pointer: { x: number; y: number } | null = null;
		let last: { x: number; y: number } | null = null;
		let lastMode = '';
		let lastMove = -Infinity;
		let running = false;
		let frame = 0;
		let resizeTimer = 0;

		function paintArt() {
			if (!artLayer || !image.naturalWidth) return;
			const a = artLayer.getContext('2d')!;
			const s = Math.max(
				artLayer.width / image.naturalWidth,
				artLayer.height / image.naturalHeight
			);
			const w = image.naturalWidth * s;
			const h = image.naturalHeight * s;
			a.drawImage(image, (artLayer.width - w) / 2, (artLayer.height - h) / 2, w, h);
		}

		function layout() {
			width = stage.clientWidth;
			height = stage.clientHeight;
			if (!width || !height) return;
			dpr = Math.min(window.devicePixelRatio || 1, 1.5);
			canvas.width = Math.round(width * dpr);
			canvas.height = Math.round(height * dpr);
			cols = Math.ceil(width / CELL);
			rows = Math.ceil(height / CELL);
			heat = new Float32Array(cols * rows);
			mask = document.createElement('canvas');
			mask.width = cols;
			mask.height = rows;
			maskCtx = mask.getContext('2d')!;
			maskData = maskCtx.createImageData(cols, rows);
			artLayer = document.createElement('canvas');
			artLayer.width = canvas.width;
			artLayer.height = canvas.height;
			paintArt();
			last = null;
			// With reduced motion nothing fades, so leave one patch uncovered from the start.
			if (reduce) splat(width * 0.78, height * 0.3, Math.min(width, height) * 0.3, 1.2);
			draw();
		}

		function splat(x: number, y: number, radius: number, strength: number) {
			const x0 = Math.max(0, Math.floor((x - radius) / CELL));
			const x1 = Math.min(cols - 1, Math.floor((x + radius) / CELL));
			const y0 = Math.max(0, Math.floor((y - radius) / CELL));
			const y1 = Math.min(rows - 1, Math.floor((y + radius) / CELL));
			for (let gy = y0; gy <= y1; gy++) {
				const dy = (gy + 0.5) * CELL - y;
				for (let gx = x0; gx <= x1; gx++) {
					const dx = (gx + 0.5) * CELL - x;
					const d2 = (dx * dx + dy * dy) / (radius * radius);
					if (d2 >= 1) continue;
					const v = strength * (1 - d2);
					const i = gy * cols + gx;
					if (v > heat[i]) heat[i] = v;
				}
			}
		}

		function sweep(a: { x: number; y: number }, b: { x: number; y: number }, radius: number) {
			const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / (radius * 0.25)));
			for (let k = 1; k <= steps; k++) {
				splat(a.x + ((b.x - a.x) * k) / steps, a.y + ((b.y - a.y) * k) / steps, radius, 1.15);
			}
		}

		function update(now: number) {
			const radius = Math.max(80, Math.min(width, height) * 0.19);
			let point: { x: number; y: number } | null = null;
			let mode = '';
			if (pointer && now - lastMove < 2400) {
				point = pointer;
				mode = 'pointer';
			} else if (!reduce && now - lastMove > 1200) {
				const t = now / 1000;
				point = {
					x: width * (0.8 + 0.12 * Math.sin(t * 0.47)),
					y: height * (0.42 + 0.32 * Math.sin(t * 0.31 + 1.2))
				};
				mode = 'idle';
			}
			if (point) {
				if (last && mode === lastMode) sweep(last, point, radius);
				else splat(point.x, point.y, radius, 1.15);
			}
			last = point;
			lastMode = mode;
		}

		function draw() {
			if (!mask || !artLayer) return;
			const data = maskData.data;
			const rim = new Path2D();
			const decay = reduce ? 1 : 0.972;
			const r = CELL * 0.38;
			for (let gy = 0; gy < rows; gy++) {
				const row = (gy & 7) << 3;
				for (let gx = 0; gx < cols; gx++) {
					const i = gy * cols + gx;
					let h = heat[i];
					if (h === 0) {
						data[i * 4 + 3] = 0;
						continue;
					}
					h *= decay;
					if (h < 0.01) h = 0;
					heat[i] = h;
					const threshold = (BAYER[row | (gx & 7)] + 0.5) / 64;
					if (h > threshold) {
						data[i * 4 + 3] = 255;
						if (h - threshold < 0.06) {
							const cx = (gx + 0.5) * CELL;
							const cy = (gy + 0.5) * CELL;
							rim.moveTo(cx + r, cy);
							rim.arc(cx, cy, r, 0, Math.PI * 2);
						}
					} else {
						data[i * 4 + 3] = 0;
					}
				}
			}
			maskCtx.putImageData(maskData, 0, 0);
			ctx.setTransform(1, 0, 0, 1, 0, 0);
			ctx.globalCompositeOperation = 'source-over';
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.drawImage(artLayer, 0, 0);
			ctx.globalCompositeOperation = 'destination-in';
			ctx.imageSmoothingEnabled = false;
			ctx.drawImage(mask, 0, 0, cols * CELL * dpr, rows * CELL * dpr);
			ctx.globalCompositeOperation = 'source-over';
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			ctx.fillStyle = INKS.ember;
			ctx.fill(rim);
		}

		function loop(now: number) {
			frame = 0;
			if (!running) return;
			update(now);
			draw();
			frame = requestAnimationFrame(loop);
		}

		function onPoint(event: PointerEvent) {
			const rect = stage.getBoundingClientRect();
			pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
			lastMove = performance.now();
			if (reduce) {
				requestAnimationFrame((now) => {
					update(now);
					draw();
				});
			}
		}
		const onLeave = () => (pointer = null);

		stage.addEventListener('pointermove', onPoint);
		stage.addEventListener('pointerleave', onLeave);

		const visibility = new IntersectionObserver(([entry]) => {
			if (entry.isIntersecting && !running) {
				running = true;
				if (!reduce) frame = requestAnimationFrame(loop);
			} else if (!entry.isIntersecting) {
				running = false;
			}
		});
		visibility.observe(stage);

		const size = new ResizeObserver(() => {
			clearTimeout(resizeTimer);
			resizeTimer = window.setTimeout(layout, 100);
		});
		size.observe(stage);

		image.onload = () => {
			paintArt();
			draw();
		};
		image.src = art;

		return () => {
			running = false;
			cancelAnimationFrame(frame);
			clearTimeout(resizeTimer);
			visibility.disconnect();
			size.disconnect();
			stage.removeEventListener('pointermove', onPoint);
			stage.removeEventListener('pointerleave', onLeave);
		};
	});
</script>

<canvas bind:this={canvas} class="absolute inset-0 z-0 block size-full" aria-hidden="true"></canvas>
