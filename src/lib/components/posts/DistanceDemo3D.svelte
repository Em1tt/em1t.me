<!--
	Distance between two points in space, from the collision-detection post.
	A sits at the origin; B drifts. D is B dropped onto the x axis, C is B dropped onto the floor,
	so |AB| comes from the right triangles ADC and ACB. Drag sideways to turn the view.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { fitCanvas, halftoneDisc, INKS } from '$lib/halftone';

	type Vec = { x: number; y: number; z: number };

	let canvas: HTMLCanvasElement;
	let paused = $state(false);
	let readout = $state('');

	onMount(() => {
		const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
		let view = fitCanvas(canvas);
		let angle = 0.7;
		let dragFrom: number | null = null;
		let frame = 0;
		let running = false;
		let b: Vec = { x: 2.2, y: 1.2, z: 1.4 };
		const tilt = 0.45;

		function project(p: Vec) {
			const { width, height } = view;
			const scale = Math.min(width, height * 2) / 7.5;
			const x = p.x * Math.cos(angle) - p.z * Math.sin(angle);
			const depth = p.x * Math.sin(angle) + p.z * Math.cos(angle);
			const y = p.y * Math.cos(tilt) - depth * Math.sin(tilt);
			return { x: width / 2 - scale + x * scale, y: height * 0.7 - y * scale };
		}

		function line(from: Vec, to: Vec, color: string, dash: number[] = [], lineWidth = 2) {
			const { ctx } = view;
			const p = project(from);
			const q = project(to);
			ctx.strokeStyle = color;
			ctx.lineWidth = lineWidth;
			ctx.setLineDash(dash);
			ctx.beginPath();
			ctx.moveTo(p.x, p.y);
			ctx.lineTo(q.x, q.y);
			ctx.stroke();
			ctx.setLineDash([]);
		}

		function label(p: Vec, text: string, color: string, dx = 10, dy = -10) {
			const q = project(p);
			view.ctx.fillStyle = color;
			view.ctx.fillText(text, q.x + dx, q.y + dy);
		}

		function draw(now: number) {
			const { ctx, width, height } = view;
			if (!paused && !reduce) {
				const t = now / 1000;
				b = {
					x: 2.2 + 0.8 * Math.sin(t * 0.7),
					y: 1.3 + 0.6 * Math.sin(t * 1.1),
					z: 1.4 + 0.9 * Math.cos(t * 0.7)
				};
			}
			const a: Vec = { x: 0, y: 0, z: 0 };
			const c: Vec = { x: b.x, y: 0, z: b.z };
			const d: Vec = { x: b.x, y: 0, z: 0 };
			ctx.clearRect(0, 0, width, height);

			for (let i = -1; i <= 4; i++) {
				line({ x: i, y: 0, z: -1 }, { x: i, y: 0, z: 3 }, 'rgba(148, 163, 184, 0.12)', [], 1);
				if (i <= 3)
					line({ x: -1, y: 0, z: i }, { x: 4, y: 0, z: i }, 'rgba(148, 163, 184, 0.12)', [], 1);
			}
			line(a, { x: 4, y: 0, z: 0 }, 'rgba(255, 86, 64, 0.35)', [], 1);
			line(a, { x: 0, y: 2.4, z: 0 }, 'rgba(69, 209, 107, 0.35)', [], 1);
			line(a, { x: 0, y: 0, z: 3 }, 'rgba(204, 80, 0, 0.45)', [], 1);

			const pa = project(a);
			const pc = project(c);
			const pb = project(b);
			ctx.fillStyle = 'rgba(226, 232, 240, 0.07)';
			ctx.beginPath();
			ctx.moveTo(pa.x, pa.y);
			ctx.lineTo(pc.x, pc.y);
			ctx.lineTo(pb.x, pb.y);
			ctx.closePath();
			ctx.fill();

			line(a, d, INKS.ember);
			line(d, c, INKS.orange);
			line(c, b, '#45d16b');
			line(a, c, '#94a3b8', [6, 6]);
			line(a, b, '#e2e8f0', [], 2.5);

			for (const [p, color, r] of [
				[a, INKS.ember, 9],
				[d, INKS.ember, 6],
				[c, INKS.orange, 6],
				[b, '#45d16b', 9]
			] as const) {
				const q = project(p);
				halftoneDisc(ctx, q.x, q.y, r, color, 4);
			}
			ctx.font = 'italic 600 17px KaTeX_Math, Georgia, serif';
			label(a, 'A', INKS.ember, -18, 18);
			label(d, 'D', INKS.ember, 8, 20);
			label(c, 'C', INKS.orange, 10, 18);
			label(b, 'B', '#45d16b');

			const x = b.x;
			const y = b.y;
			const z = b.z;
			const f = (n: number) => n.toFixed(2);
			readout = `|AD| = ${f(x)} · |DC| = ${f(z)} · |CB| = ${f(y)} · |AB| = √(${f(x)}² + ${f(y)}² + ${f(z)}²) = ${f(Math.hypot(x, y, z))}`;
		}

		function loop(now: number) {
			frame = 0;
			if (!running) return;
			draw(now);
			frame = requestAnimationFrame(loop);
		}

		const onDown = (event: PointerEvent) => {
			dragFrom = event.clientX;
			canvas.setPointerCapture(event.pointerId);
		};
		const onMove = (event: PointerEvent) => {
			if (dragFrom === null) return;
			angle += (event.clientX - dragFrom) * 0.01;
			dragFrom = event.clientX;
			if (reduce || paused) draw(performance.now());
		};
		const onUp = () => (dragFrom = null);
		canvas.addEventListener('pointerdown', onDown);
		canvas.addEventListener('pointermove', onMove);
		canvas.addEventListener('pointerup', onUp);
		canvas.addEventListener('pointercancel', onUp);

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
			canvas.removeEventListener('pointerdown', onDown);
			canvas.removeEventListener('pointermove', onMove);
			canvas.removeEventListener('pointerup', onUp);
			canvas.removeEventListener('pointercancel', onUp);
		};
	});
</script>

<figure class="demo">
	<div class="relative">
		<canvas
			bind:this={canvas}
			class="block aspect-[16/7] w-full cursor-grab touch-pan-y border border-slate-400/20 bg-[#05030f] active:cursor-grabbing"
			aria-label="Two points in space with the right triangles between them; drag sideways to turn the view"
		></canvas>
		<button
			type="button"
			onclick={() => (paused = !paused)}
			class="google-sans-code-500 absolute top-2 right-2 cursor-pointer bg-[#05030f] px-[0.7em] py-[0.5em] text-[11px] leading-none tracking-[0.08em] text-slate-300 uppercase hover:bg-[#a91a06] hover:text-white"
			>{paused ? 'Play' : 'Pause'}</button
		>
	</div>
	<figcaption class="google-sans-code-400 mt-2 text-xs text-slate-400">
		Drag sideways to turn it. <output class="text-slate-200">{readout}</output>
	</figcaption>
</figure>
