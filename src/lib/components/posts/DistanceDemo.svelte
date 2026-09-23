<!--
	Distance between two points, from the collision-detection post.
	'line': A and B on one axis. 'plane': B anywhere, with C closing the right triangle.
	B drifts on its own; hovering takes over; the button pauses it.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { fitCanvas, INKS } from '$lib/halftone';
	import { dot } from './draw';

	let { mode = 'plane' }: { mode?: 'line' | 'plane' } = $props();

	let canvas: HTMLCanvasElement;
	let paused = $state(false);
	let readout = $state('');

	onMount(() => {
		const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
		let view = fitCanvas(canvas);
		let hover: { x: number; y: number } | null = null;
		let frame = 0;
		let running = false;
		let b = { x: 0, y: 0 };

		function draw(now: number) {
			const { ctx, width, height } = view;
			const a = { x: width * 0.42, y: height / 2 };
			if (hover) b = mode === 'line' ? { x: hover.x, y: a.y } : hover;
			else if (!paused) {
				const t = now / 1000;
				b = {
					x: width * (0.62 + 0.26 * Math.sin(t * 0.9)),
					y: mode === 'line' ? a.y : height * (0.5 + 0.34 * Math.cos(t * 0.9))
				};
			}
			ctx.clearRect(0, 0, width, height);
			ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
			ctx.lineWidth = 1;
			ctx.beginPath();
			for (let x = 0.5; x < width; x += 30) {
				ctx.moveTo(x, 0);
				ctx.lineTo(x, height);
			}
			for (let y = 0.5; y < height; y += 30) {
				ctx.moveTo(0, y);
				ctx.lineTo(width, y);
			}
			ctx.stroke();

			const dx = b.x - a.x;
			const dy = b.y - a.y;
			const ab = Math.hypot(dx, dy);
			ctx.lineWidth = 2;
			if (mode === 'plane') {
				ctx.strokeStyle = INKS.orange;
				ctx.setLineDash([8, 6]);
				ctx.beginPath();
				ctx.moveTo(a.x, a.y);
				ctx.lineTo(b.x, a.y);
				ctx.lineTo(b.x, b.y);
				ctx.stroke();
				ctx.setLineDash([]);
			}
			ctx.strokeStyle = '#e2e8f0';
			ctx.beginPath();
			ctx.moveTo(a.x, a.y);
			ctx.lineTo(b.x, b.y);
			ctx.stroke();

			dot(ctx, a.x, a.y, 7, INKS.ember);
			dot(ctx, b.x, b.y, 7, '#45d16b');
			ctx.font = 'italic 600 18px KaTeX_Math, Georgia, serif';
			ctx.fillStyle = INKS.ember;
			ctx.fillText('A', a.x - 6, a.y + 32);
			ctx.fillStyle = '#45d16b';
			ctx.fillText('B', b.x - 6, b.y + (b.y > height - 40 ? -18 : 32));
			if (mode === 'plane') {
				dot(ctx, b.x, a.y, 5, INKS.orange);
				ctx.fillStyle = INKS.orange;
				ctx.fillText('C', b.x + 12, a.y + 6);
				readout = `|AC| = ${Math.abs(Math.round(dx))} · |BC| = ${Math.abs(Math.round(dy))} · |AB| = √(${Math.abs(Math.round(dx))}² + ${Math.abs(Math.round(dy))}²) = ${Math.round(ab)}`;
			} else {
				readout = `|AB| = |x₁ − x₂| = ${Math.round(ab)}`;
			}
		}

		function loop(now: number) {
			frame = 0;
			if (!running) return;
			draw(now);
			frame = requestAnimationFrame(loop);
		}

		const onMove = (event: PointerEvent) => {
			const rect = canvas.getBoundingClientRect();
			hover = { x: event.clientX - rect.left, y: event.clientY - rect.top };
			if (reduce) draw(performance.now());
		};
		const onLeave = () => (hover = null);
		canvas.addEventListener('pointermove', onMove);
		canvas.addEventListener('pointerleave', onLeave);

		const size = new ResizeObserver(() => {
			view = fitCanvas(canvas);
			draw(performance.now());
		});
		size.observe(canvas);
		const visibility = new IntersectionObserver(([entry]) => {
			running = entry.isIntersecting && !reduce;
			if (running && !frame) frame = requestAnimationFrame(loop);
		});
		visibility.observe(canvas);

		return () => {
			running = false;
			cancelAnimationFrame(frame);
			size.disconnect();
			visibility.disconnect();
			canvas.removeEventListener('pointermove', onMove);
			canvas.removeEventListener('pointerleave', onLeave);
		};
	});
</script>

<figure class="demo">
	<div class="relative">
		<canvas
			bind:this={canvas}
			class="block aspect-[16/5] w-full touch-pan-y border border-slate-400/20 bg-[#05030f]"
			aria-label={mode === 'line'
				? 'Two points on a line; move the pointer to move B'
				: 'Two points on a plane with the right triangle between them; move the pointer to move B'}
		></canvas>
		<button
			type="button"
			onclick={() => (paused = !paused)}
			class="google-sans-code-500 absolute top-2 right-2 cursor-pointer bg-[#05030f] px-[0.7em] py-[0.5em] text-[11px] leading-none tracking-[0.08em] text-slate-300 uppercase hover:bg-[#a91a06] hover:text-white"
			>{paused ? 'Play' : 'Pause'}</button
		>
	</div>
	<figcaption class="google-sans-code-400 mt-2 text-xs text-slate-400">
		Move the pointer over the grid. <output class="text-slate-200">{readout}</output>
	</figcaption>
</figure>
