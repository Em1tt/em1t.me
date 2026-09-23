<!--
	Two halftone spheres you can drag into each other, from the collision-detection post.
	Idle, the small one orbits the big one so they collide on their own.
	Fills its positioned parent.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { fitCanvas, groundDots, halftoneDisc, INKS } from '$lib/halftone';

	let canvas: HTMLCanvasElement;

	onMount(() => {
		const stage = canvas.parentElement!;
		const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

		let view: ReturnType<typeof fitCanvas> | undefined;
		let ground: HTMLCanvasElement | undefined;
		let bodies: { x: number; y: number; r: number }[] = [];
		let dragging = -1;
		let grab = { x: 0, y: 0 };
		let lastTouch = -Infinity;
		let running = false;
		let frame = 0;

		function resize() {
			view = fitCanvas(canvas);
			const { width, height } = view;
			ground = document.createElement('canvas');
			ground.width = canvas.width;
			ground.height = canvas.height;
			const g = ground.getContext('2d')!;
			g.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
			groundDots(g, width, height, 10, 2.1);
			const m = Math.min(width, height);
			const first = !bodies.length;
			if (first) {
				bodies = [
					{ x: width * 0.7, y: height * 0.46, r: 0 },
					{ x: width * 0.5, y: height * 0.7, r: 0 }
				];
			}
			bodies[0].r = m * 0.2;
			bodies[1].r = m * 0.12;
			// With reduced motion there's no idle orbit, so start them touching to show a collision.
			if (first && reduce) {
				const [a, b] = bodies;
				const d = (a.r + b.r) * 0.85;
				b.x = a.x - d * 0.8;
				b.y = a.y + d * 0.6;
			}
			draw();
		}

		function draw() {
			if (!view || !ground) return;
			const { ctx, width, height } = view;
			const [a, b] = bodies;
			const hit = Math.hypot(b.x - a.x, b.y - a.y) < a.r + b.r;

			ctx.clearRect(0, 0, width, height);
			ctx.drawImage(ground, 0, 0, width, height);
			ctx.strokeStyle = hit ? INKS.ember : '#94a3b8';
			ctx.globalAlpha = hit ? 1 : 0.6;
			ctx.setLineDash([2, 7]);
			ctx.lineWidth = 1.5;
			ctx.beginPath();
			ctx.moveTo(a.x, a.y);
			ctx.lineTo(b.x, b.y);
			ctx.stroke();
			ctx.setLineDash([]);
			ctx.globalAlpha = 1;
			halftoneDisc(ctx, a.x, a.y, a.r, hit ? INKS.ember : INKS.orange, 10);
			halftoneDisc(ctx, b.x, b.y, b.r, hit ? INKS.ember : INKS.green, 10);
		}

		function loop(now: number) {
			frame = 0;
			if (!running) return;
			if (dragging < 0 && performance.now() - lastTouch > 3000 && view) {
				const { width, height } = view;
				const [a, b] = bodies;
				a.x += (width * 0.7 - a.x) * 0.02;
				a.y += (height * 0.46 - a.y) * 0.02;
				const angle = now / 2300;
				const orbit = (a.r + b.r) * (1.02 + 0.32 * Math.sin(now / 1700));
				b.x = a.x + Math.cos(angle) * orbit;
				b.y = a.y + Math.sin(angle) * orbit * 0.8;
			}
			draw();
			frame = requestAnimationFrame(loop);
		}

		function local(event: PointerEvent) {
			const rect = stage.getBoundingClientRect();
			return { x: event.clientX - rect.left, y: event.clientY - rect.top };
		}

		function onDown(event: PointerEvent) {
			if ((event.target as Element).closest('a, button, input, textarea, select')) return;
			const p = local(event);
			dragging = bodies.findIndex((body) => Math.hypot(body.x - p.x, body.y - p.y) < body.r + 12);
			if (dragging < 0) return;
			grab = { x: bodies[dragging].x - p.x, y: bodies[dragging].y - p.y };
			stage.setPointerCapture(event.pointerId);
			lastTouch = performance.now();
			canvas.style.cursor = 'grabbing';
		}

		function onMove(event: PointerEvent) {
			if (dragging < 0) return;
			const p = local(event);
			bodies[dragging].x = p.x + grab.x;
			bodies[dragging].y = p.y + grab.y;
			lastTouch = performance.now();
			if (reduce) draw();
		}

		function onUp() {
			dragging = -1;
			lastTouch = performance.now();
			canvas.style.cursor = '';
		}

		stage.addEventListener('pointerdown', onDown);
		stage.addEventListener('pointermove', onMove);
		stage.addEventListener('pointerup', onUp);
		stage.addEventListener('pointercancel', onUp);

		const size = new ResizeObserver(resize);
		size.observe(stage);

		const visibility = new IntersectionObserver(([entry]) => {
			if (entry.isIntersecting && !running) {
				running = true;
				if (!reduce) frame = requestAnimationFrame(loop);
			} else if (!entry.isIntersecting) {
				running = false;
			}
		});
		visibility.observe(stage);

		return () => {
			running = false;
			cancelAnimationFrame(frame);
			size.disconnect();
			visibility.disconnect();
			stage.removeEventListener('pointerdown', onDown);
			stage.removeEventListener('pointermove', onMove);
			stage.removeEventListener('pointerup', onUp);
			stage.removeEventListener('pointercancel', onUp);
		};
	});
</script>

<canvas
	bind:this={canvas}
	class="absolute inset-0 z-0 block size-full cursor-grab touch-pan-y"
	aria-hidden="true"
></canvas>
