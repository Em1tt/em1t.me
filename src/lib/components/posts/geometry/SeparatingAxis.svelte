<!--
	The separating axis theorem for two convex polygons. Every edge normal is a candidate axis;
	the figure draws the most telling one with both polygons' shadows on it: the widest gap when
	they're apart, or the smallest overlap when every axis overlaps and they collide.
-->
<script lang="ts">
	import { INKS } from '$lib/halftone';
	import Stage from './Stage.svelte';
	import { draggable, within, type Point } from './drag';

	const W = 640;
	const H = 340;

	// Shapes as corner offsets from their centre: a rotated rectangle and a triangle.
	const angle = (25 * Math.PI) / 180;
	const box = [
		{ x: -62, y: -34 },
		{ x: 62, y: -34 },
		{ x: 62, y: 34 },
		{ x: -62, y: 34 }
	].map((p) => ({
		x: p.x * Math.cos(angle) - p.y * Math.sin(angle),
		y: p.x * Math.sin(angle) + p.y * Math.cos(angle)
	}));
	const triangle = [
		{ x: 0, y: -54 },
		{ x: 54, y: 42 },
		{ x: -50, y: 35 }
	];

	let centreA = $state({ x: 220, y: 130 });
	let centreB = $state({ x: 430, y: 150 });

	const place = (shape: Point[], at: Point) => shape.map((p) => ({ x: p.x + at.x, y: p.y + at.y }));
	const A = $derived(place(box, centreA));
	const B = $derived(place(triangle, centreB));

	const dot = (u: Point, v: Point) => u.x * v.x + u.y * v.y;
	const axesOf = (polygon: Point[]) =>
		polygon.map((p1, i) => {
			const p2 = polygon[(i + 1) % polygon.length];
			const n = { x: p2.y - p1.y, y: p1.x - p2.x };
			const length = Math.hypot(n.x, n.y);
			return { x: n.x / length, y: n.y / length };
		});
	const project = (polygon: Point[], axis: Point) => {
		const values = polygon.map((p) => dot(p, axis));
		return [Math.min(...values), Math.max(...values)] as const;
	};

	const tests = $derived(
		[...axesOf(A), ...axesOf(B)].map((axis) => {
			const a = project(A, axis);
			const b = project(B, axis);
			// Positive: how far the shadows overlap. Negative: the size of the gap.
			return { axis, a, b, overlap: Math.min(a[1], b[1]) - Math.max(a[0], b[0]) };
		})
	);
	const gaps = $derived(tests.filter((test) => test.overlap < 0).length);
	const hit = $derived(gaps === 0);
	// The smallest overlap: the widest gap when they're apart, the tightest overlap when they touch.
	const shown = $derived(tests.reduce((best, test) => (test.overlap < best.overlap ? test : best)));

	// The chosen axis is drawn beside both shapes, not through them, so their shadows are easy to
	// see: shifted along its perpendicular past every corner, on a side where both shadows fit.
	const O = { x: W / 2, y: H / 2 };
	const perp = $derived({ x: -shown.axis.y, y: shown.axis.x });
	const at = (s: number, shift: number) => {
		const k = s - dot(O, shown.axis);
		return {
			x: O.x + shown.axis.x * k + perp.x * shift,
			y: O.y + shown.axis.y * k + perp.y * shift
		};
	};
	const shift = $derived.by(() => {
		const across = [...A, ...B].map((p) => dot(p, perp));
		const centre = dot(O, perp);
		const ends = [...shown.a, ...shown.b];
		const fits = (shift: number) =>
			ends.every((s) => {
				const p = at(s, shift);
				return p.x > 12 && p.x < W - 12 && p.y > 12 && p.y < H - 12;
			});
		const sides = [24, 48, 80].flatMap((gap) => [
			Math.max(...across) + gap - centre,
			Math.min(...across) - gap - centre
		]);
		return sides.find(fits) ?? 0;
	});
	const along = (s: number, offset: number) => at(s, shift + offset);
	const path = (polygon: Point[]) => polygon.map((p) => `${p.x},${p.y}`).join(' ');

	const shapes: { name: string; get: () => Point; set: (p: Point) => void }[] = [
		{ name: 'rectangle', get: () => centreA, set: (p) => (centreA = p) },
		{ name: 'triangle', get: () => centreB, set: (p) => (centreB = p) }
	];
</script>

<Stage
	height={H}
	interactive
	label="A rotated rectangle and a triangle, with one of their edge normals drawn as an axis and both shapes' shadows on it. Drag either shape."
	caption="Drag either shape. The line is the axis the test hinges on, with each shape's shadow on it."
	readout={hit
		? `The shadows overlap on all ${tests.length} axes → collision`
		: `${gaps} of ${tests.length} axes show a gap; one is enough → apart`}
>
	<line
		x1={along(-2000, 0).x}
		y1={along(-2000, 0).y}
		x2={along(2000, 0).x}
		y2={along(2000, 0).y}
		stroke="rgb(148 163 184 / 0.35)"
		stroke-dasharray="3 6"
	/>
	{#each [{ polygon: A, shadow: shown.a, color: '#45d16b', offset: -7 }, { polygon: B, shadow: shown.b, color: INKS.orange, offset: 7 }] as item, i (i)}
		<line
			x1={along(item.shadow[0], item.offset).x}
			y1={along(item.shadow[0], item.offset).y}
			x2={along(item.shadow[1], item.offset).x}
			y2={along(item.shadow[1], item.offset).y}
			stroke={item.color}
			stroke-width="6"
		/>
		{#each item.polygon as corner, j (j)}
			{#if Math.abs(dot(corner, shown.axis) - item.shadow[0]) < 0.01 || Math.abs(dot(corner, shown.axis) - item.shadow[1]) < 0.01}
				<line
					x1={corner.x}
					y1={corner.y}
					x2={along(dot(corner, shown.axis), item.offset).x}
					y2={along(dot(corner, shown.axis), item.offset).y}
					stroke={item.color}
					stroke-dasharray="3 5"
					opacity="0.6"
				/>
			{/if}
		{/each}
	{/each}

	{#each shapes as shape, i (shape.name)}
		<g
			class="handle"
			tabindex="0"
			role="button"
			aria-label="The {shape.name}; drag or use the arrow keys"
			{@attach draggable(shape.get, (point) => shape.set(within(point, W, H, 56)))}
		>
			<polygon
				points={path(i === 0 ? A : B)}
				fill={hit ? 'rgb(255 86 64 / 0.16)' : 'rgb(148 163 184 / 0.06)'}
				stroke={hit ? INKS.ember : i === 0 ? '#45d16b' : INKS.orange}
				stroke-width="2"
			/>
		</g>
	{/each}
</Stage>
