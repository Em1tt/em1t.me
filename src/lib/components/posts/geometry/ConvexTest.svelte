<!--
	A convex polygon against another shape, for the convex polygons chapter.
	- point: which side of every edge the point is on;
	- line: which side of the line every vertex is on;
	- polygon, rect, segment, circle: the separating axis test, drawing its most telling axis beside
	  the shapes with both shadows on it (the widest gap when they're apart, the tightest overlap
	  when they touch).
-->
<script lang="ts">
	import { untrack } from 'svelte';
	import { INKS } from '$lib/halftone';
	import Dot from './Dot.svelte';
	import Stage from './Stage.svelte';
	import {
		dot,
		edges,
		lineThrough,
		pointInConvexPolygon,
		polygonLineCollide,
		rectToPolygon,
		separatingAxes,
		side,
		type Circle,
		type Polygon
	} from './collide';
	import { draggable, within, type Point } from './drag';

	type Against = 'polygon' | 'rect' | 'segment' | 'circle' | 'point' | 'line';
	let { against }: { against: Against } = $props();

	const W = 640;
	// Tall enough, with shapes small enough, for the axis to fit beside both shapes.
	const H = 400;
	const RECT = { w: 128, h: 82 };
	const R = 44;
	const pentagon = [
		{ x: 0, y: -61 },
		{ x: 58, y: -19 },
		{ x: 36, y: 49 },
		{ x: -36, y: 49 },
		{ x: -58, y: -19 }
	];
	const triangle = [
		{ x: 0, y: -46 },
		{ x: 46, y: 36 },
		{ x: -42, y: 30 }
	];
	const starts: Record<Against, Point> = {
		polygon: { x: 450, y: 190 },
		rect: { x: 380, y: 150 },
		segment: { x: 0, y: 0 },
		circle: { x: 450, y: 210 },
		point: { x: 430, y: 180 },
		line: { x: 0, y: 0 }
	};

	let centre = $state({ x: 190, y: 200 });
	// Where the other shape starts; `against` is fixed for each figure.
	let other = $state(untrack(() => starts[against]));
	let end1 = $state({ x: 370, y: 50 });
	let end2 = $state({ x: 540, y: 350 });

	const place = (shape: Point[], at: Point) => shape.map((p) => ({ x: p.x + at.x, y: p.y + at.y }));
	const A = $derived(place(pentagon, centre));
	const path = (polygon: Point[]) => polygon.map((p) => `${p.x},${p.y}`).join(' ');

	// The other shape as the separating axis test sees it.
	const shape = $derived.by((): Polygon | Circle => {
		if (against === 'polygon') return place(triangle, other);
		if (against === 'rect') return rectToPolygon({ ...other, ...RECT });
		if (against === 'segment') return [end1, end2];
		return { x: other.x, y: other.y, r: R };
	});
	const sat = $derived(against !== 'point' && against !== 'line');
	const tests = $derived(sat ? separatingAxes(A, shape) : []);
	const gaps = $derived(tests.filter((test) => test.overlap < 0).length);
	const shown = $derived(
		tests.length ? tests.reduce((best, test) => (test.overlap < best.overlap ? test : best)) : null
	);

	// Point: the side of each edge, compared with the side the polygon's inside is on.
	const inner = $derived.by(() => {
		const c = { x: centre.x, y: centre.y + 4 };
		return edges(A).map(([p, q]) => Math.sign(side(c, lineThrough(p, q))));
	});
	const outside = $derived(
		against === 'point'
			? edges(A).map(([p, q], i) => {
					const s = Math.sign(side(other, lineThrough(p, q)));
					return s !== 0 && s !== inner[i];
				})
			: []
	);

	// Line: the sign of ax + by + c at every vertex.
	const line = $derived(lineThrough(end1, end2));
	const signs = $derived(A.map((vertex) => Math.sign(side(vertex, line))));

	const hit = $derived(
		against === 'point'
			? pointInConvexPolygon(other, A)
			: against === 'line'
				? polygonLineCollide(A, line)
				: gaps === 0
	);

	// The shown axis is drawn beside both shapes, shifted along its perpendicular to a side where
	// both shadows fit in the frame.
	const O = { x: W / 2, y: H / 2 };
	const perp = $derived(shown ? { x: -shown.axis.y, y: shown.axis.x } : { x: 0, y: 1 });
	const at = (s: number, shift: number) => {
		const axis = shown?.axis ?? { x: 1, y: 0 };
		const k = s - dot(O, axis);
		return { x: O.x + axis.x * k + perp.x * shift, y: O.y + axis.y * k + perp.y * shift };
	};
	const shift = $derived.by(() => {
		if (!shown) return 0;
		const across = [
			...A.map((p) => dot(p, perp)),
			...('r' in shape
				? [dot(shape, perp) - R, dot(shape, perp) + R]
				: shape.map((p) => dot(p, perp)))
		];
		const centreAcross = dot(O, perp);
		const ends = [...shown.a, ...shown.b];
		const fits = (s: number) =>
			ends.every((e) => {
				const p = at(e, s);
				return p.x > 12 && p.x < W - 12 && p.y > 12 && p.y < H - 12;
			});
		const sides = [24, 48, 80].flatMap((gap) => [
			Math.max(...across) + gap - centreAcross,
			Math.min(...across) - gap - centreAcross
		]);
		return sides.find(fits) ?? 0;
	});
	const along = (s: number, offset: number) => at(s, shift + offset);
	// The corners (or, for a circle, the rim points) that cast the ends of a shadow.
	const casters = (points: Point[] | Circle, shadow: [number, number]): Point[] => {
		if (!shown) return [];
		if ('r' in points) {
			return [-1, 1].map((k) => ({
				x: points.x + shown.axis.x * R * k,
				y: points.y + shown.axis.y * R * k
			}));
		}
		return points.filter(
			(p) =>
				Math.abs(dot(p, shown.axis) - shadow[0]) < 0.01 ||
				Math.abs(dot(p, shown.axis) - shadow[1]) < 0.01
		);
	};

	const readout = $derived.by(() => {
		if (against === 'point') {
			const count = outside.filter(Boolean).length;
			return count === 0
				? `P is on the inner side of all ${A.length} edges → inside`
				: `P is on the outer side of ${count} of the ${A.length} edges → outside`;
		}
		if (against === 'line') {
			const plus = signs.filter((s) => s > 0).length;
			const minus = signs.filter((s) => s < 0).length;
			if (hit) return `${plus} vertices on the + side, ${minus} on the − side → collision`;
			return `every vertex on the ${plus ? '+' : '−'} side → apart`;
		}
		const own = against === 'circle' ? ', the circle’s own axis included' : '';
		return hit
			? `The shadows overlap on all ${tests.length} axes${own} → collision`
			: `${gaps} of ${tests.length} axes show a gap; one is enough → apart`;
	});
	const captions: Record<Against, string> = {
		polygon:
			'Drag either shape. The dashed line is the axis the test hinges on, with both shadows on it.',
		rect: 'Drag either shape. The dashed line is the axis the test hinges on, with both shadows on it.',
		segment: 'Drag the pentagon, A or B. The dashed line is the axis the test hinges on.',
		circle: 'Drag the pentagon or the circle. The dashed line is the axis the test hinges on.',
		point: 'Drag the pentagon or P. An edge turns orange when P is on its outer side.',
		line: 'Drag the pentagon, P₁ or P₂. Each vertex is marked with the sign of ax + by + c.'
	};
	const colour = (base: string) => (hit ? INKS.ember : base);
	const fill = $derived(hit ? 'rgb(255 86 64 / 0.16)' : 'rgb(148 163 184 / 0.06)');

	const ends: { name: string; get: () => Point; set: (p: Point) => void }[] = [
		{ name: '1', get: () => end1, set: (p) => (end1 = p) },
		{ name: '2', get: () => end2, set: (p) => (end2 = p) }
	];
	const endLabel = (name: string) =>
		against === 'line' ? `P${name === '1' ? '₁' : '₂'}` : name === '1' ? 'A' : 'B';
</script>

<Stage
	height={H}
	interactive
	label="A convex pentagon and a {against === 'rect'
		? 'rectangle'
		: against}; drag them to test for a collision."
	caption={captions[against]}
	{readout}
>
	{#if shown}
		<line
			x1={along(-2000, 0).x}
			y1={along(-2000, 0).y}
			x2={along(2000, 0).x}
			y2={along(2000, 0).y}
			stroke="rgb(148 163 184 / 0.35)"
			stroke-dasharray="3 6"
		/>
		{#each [{ points: A, shadow: shown.a, color: '#45d16b', offset: -7 }, { points: shape, shadow: shown.b, color: INKS.orange, offset: 7 }] as item, i (i)}
			<line
				x1={along(item.shadow[0], item.offset).x}
				y1={along(item.shadow[0], item.offset).y}
				x2={along(item.shadow[1], item.offset).x}
				y2={along(item.shadow[1], item.offset).y}
				stroke={item.color}
				stroke-width="6"
			/>
			{#each casters(item.points, item.shadow) as corner, j (j)}
				<line
					x1={corner.x}
					y1={corner.y}
					x2={along(dot(corner, shown.axis), item.offset).x}
					y2={along(dot(corner, shown.axis), item.offset).y}
					stroke={item.color}
					stroke-dasharray="3 5"
					opacity="0.6"
				/>
			{/each}
		{/each}
	{/if}

	{#if against === 'line'}
		<line
			x1={end1.x - (end2.x - end1.x) * 20}
			y1={end1.y - (end2.y - end1.y) * 20}
			x2={end2.x + (end2.x - end1.x) * 20}
			y2={end2.y + (end2.y - end1.y) * 20}
			stroke={colour(INKS.orange)}
			stroke-width="2"
		/>
	{/if}

	<g
		class="handle"
		tabindex="0"
		role="button"
		aria-label="The pentagon; drag or use the arrow keys"
		{@attach draggable(
			() => centre,
			(p) => (centre = within(p, W, H, 62))
		)}
	>
		<polygon points={path(A)} {fill} stroke={colour('#45d16b')} stroke-width="2" />
	</g>
	{#if against === 'point'}
		{#each edges(A) as [p, q], i (i)}
			{#if outside[i]}
				<line x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={INKS.orange} stroke-width="4" />
			{/if}
		{/each}
	{/if}
	{#if against === 'line'}
		{#each A as vertex, i (i)}
			<text
				x={vertex.x + (vertex.x - centre.x) * 0.28}
				y={vertex.y + (vertex.y - centre.y) * 0.28 + 6}
				text-anchor="middle"
				class="math"
				fill={signs[i] > 0 ? '#45d16b' : signs[i] < 0 ? INKS.orange : '#f1f5f9'}
				>{signs[i] > 0 ? '+' : signs[i] < 0 ? '−' : '0'}</text
			>
		{/each}
	{/if}

	{#if against === 'polygon' || against === 'rect' || against === 'circle'}
		<g
			class="handle"
			tabindex="0"
			role="button"
			aria-label="The {against === 'rect'
				? 'rectangle'
				: against === 'circle'
					? 'circle'
					: 'triangle'}; drag or use the arrow keys"
			{@attach draggable(
				() => other,
				(p) =>
					(other = against === 'rect' ? within(p, W - RECT.w, H - RECT.h, 8) : within(p, W, H, 48))
			)}
		>
			{#if 'r' in shape}
				<circle
					cx={shape.x}
					cy={shape.y}
					r={R}
					{fill}
					stroke={colour(INKS.orange)}
					stroke-width="2"
				/>
			{:else}
				<polygon points={path(shape)} {fill} stroke={colour(INKS.orange)} stroke-width="2" />
			{/if}
		</g>
	{/if}

	{#if against === 'segment'}
		<line
			x1={end1.x}
			y1={end1.y}
			x2={end2.x}
			y2={end2.y}
			stroke={colour(INKS.orange)}
			stroke-width="3"
		/>
	{/if}
	{#if against === 'segment' || against === 'line'}
		{#each ends as end (end.name)}
			<g
				class="handle"
				tabindex="0"
				role="button"
				aria-label="Point {endLabel(end.name)}; drag or use the arrow keys"
				{@attach draggable(end.get, (p) => end.set(within(p, W, H, 12)))}
			>
				<circle cx={end.get().x} cy={end.get().y} r="20" fill="transparent" />
				<Dot x={end.get().x} y={end.get().y} color={INKS.orange} />
				<text x={end.get().x + 12} y={end.get().y - 12} class="math" fill={INKS.orange}
					>{endLabel(end.name)}</text
				>
			</g>
		{/each}
	{/if}

	{#if against === 'point'}
		<g
			class="handle"
			tabindex="0"
			role="button"
			aria-label="Point P; drag or use the arrow keys"
			{@attach draggable(
				() => other,
				(p) => (other = within(p, W, H, 12))
			)}
		>
			<circle cx={other.x} cy={other.y} r="22" fill="transparent" />
			<Dot x={other.x} y={other.y} color={INKS.ember} />
			<text x={other.x + 12} y={other.y - 12} class="math" fill={INKS.ember}>P</text>
		</g>
	{/if}
</Stage>
