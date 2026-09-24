<!--
	A concave (C-shaped) polygon against another shape, with the edge-based tests from the concave
	polygons chapter.
	- point: ray casting, with the crossings marked;
	- segment, circle, polygon: the edges that are hit, and the containment check when none is.
	`compare` also runs the separating axis test, which only sees the C's convex outline.
-->
<script lang="ts">
	import { untrack } from 'svelte';
	import { INKS } from '$lib/halftone';
	import Dot from './Dot.svelte';
	import Stage from './Stage.svelte';
	import {
		circleSegmentCollide,
		convexPolygonsCollide,
		crossingPoint,
		edges,
		pointInPolygon,
		rayCrossings,
		segmentsIntersect
	} from './collide';
	import { draggable, within, type Point } from './drag';

	type Against = 'point' | 'segment' | 'circle' | 'polygon';
	let { against, compare = false }: { against: Against; compare?: boolean } = $props();

	const W = 640;
	const H = 320;
	const R = 30;
	// A C shape opening to the right, and its convex outline (what the separating axis test sees).
	const cShape = [
		{ x: -90, y: -80 },
		{ x: 90, y: -80 },
		{ x: 90, y: -40 },
		{ x: -30, y: -40 },
		{ x: -30, y: 40 },
		{ x: 90, y: 40 },
		{ x: 90, y: 80 },
		{ x: -90, y: 80 }
	];
	const hull = [
		{ x: -90, y: -80 },
		{ x: 90, y: -80 },
		{ x: 90, y: 80 },
		{ x: -90, y: 80 }
	];
	const square = [
		{ x: -22, y: -22 },
		{ x: 22, y: -22 },
		{ x: 22, y: 22 },
		{ x: -22, y: 22 }
	];
	const starts: Record<Against, Point> = {
		point: { x: 262, y: 160 },
		segment: { x: 0, y: 0 },
		circle: { x: 256, y: 160 },
		polygon: { x: 262, y: 160 }
	};

	let centre = $state({ x: 210, y: 160 });
	let other = $state(untrack(() => starts[against]));
	let end1 = $state({ x: 256, y: 150 });
	let end2 = $state({ x: 480, y: 60 });

	const place = (shape: Point[], at: Point) => shape.map((p) => ({ x: p.x + at.x, y: p.y + at.y }));
	const path = (polygon: Point[]) => polygon.map((p) => `${p.x},${p.y}`).join(' ');
	const C = $derived(place(cShape, centre));
	const B = $derived(place(square, other));

	// Which edges of the C are hit, and where.
	const hits = $derived.by(() => {
		const list = edges(C).map(([p, q]) => {
			if (against === 'segment')
				return segmentsIntersect(end1, end2, p, q) ? [crossingPoint(end1, end2, p, q)] : null;
			if (against === 'circle') return circleSegmentCollide({ ...other, r: R }, p, q) ? [] : null;
			if (against === 'polygon') {
				const points = edges(B)
					.filter(([r, s]) => segmentsIntersect(p, q, r, s))
					.map(([r, s]) => crossingPoint(r, s, p, q));
				return points.length ? points : null;
			}
			return null;
		});
		return list;
	});
	const hitCount = $derived(hits.filter(Boolean).length);
	const crossings = $derived(against === 'point' ? rayCrossings(other, C) : []);

	// When no edge is hit, the shapes are apart unless one lies inside the other.
	const inside = $derived.by(() => {
		if (against === 'point') return pointInPolygon(other, C);
		if (against === 'segment') return pointInPolygon(end1, C);
		if (against === 'circle') return pointInPolygon(other, C);
		return pointInPolygon(B[0], C) || pointInPolygon(C[0], B);
	});
	const hit = $derived(against === 'point' ? inside : hitCount > 0 || inside);
	const sat = $derived(against === 'polygon' ? convexPolygonsCollide(C, B) : hit);

	const readout = $derived.by(() => {
		if (against === 'point') {
			const n = crossings.length;
			return `The ray crosses ${n} edge${n === 1 ? '' : 's'}: ${n % 2 ? 'odd → inside' : 'even → outside'}`;
		}
		const what = against === 'circle' ? 'touches' : 'crosses';
		const containment = {
			segment: `A is ${inside ? 'inside' : 'outside'}`,
			circle: `the centre is ${inside ? 'inside' : 'outside'}`,
			polygon: inside ? 'one is inside the other' : 'neither is inside the other'
		}[against];
		const edgesVerdict =
			hitCount > 0
				? `${what} ${hitCount} edge${hitCount === 1 ? '' : 's'} → collision`
				: `${what} no edge, and ${containment} → ${inside ? 'collision' : 'apart'}`;
		if (!compare) return `The ${against === 'polygon' ? 'square' : against} ${edgesVerdict}`;
		return `Edge tests: ${hit ? 'collision' : 'apart'} · separating axis test: ${sat ? 'collision' : 'apart'}${sat === hit ? '' : ', wrong: it only sees the dashed outline'}`;
	});
	const captions: Record<Against, string> = {
		point: 'Drag P or the C. The ray runs from P to the right; each dot is an edge it crosses.',
		segment: 'Drag the C, A or B. Edges the segment crosses light up.',
		circle: 'Drag the C or the circle. Edges within reach of the circle light up.',
		polygon: 'Drag the C or the square. Edges that cross light up.'
	};
	const fill = $derived(hit ? 'rgb(255 86 64 / 0.16)' : 'rgb(148 163 184 / 0.06)');

	const ends: { name: string; get: () => Point; set: (p: Point) => void }[] = [
		{ name: 'A', get: () => end1, set: (p) => (end1 = p) },
		{ name: 'B', get: () => end2, set: (p) => (end2 = p) }
	];
</script>

<Stage
	height={H}
	interactive
	label="A C-shaped concave polygon and a {against === 'polygon'
		? 'square'
		: against}; drag them to test for a collision."
	caption={compare
		? 'Drag the C or the square. The dashed outline is all the separating axis test can see of the C.'
		: captions[against]}
	{readout}
>
	{#if compare}
		<polygon
			points={path(place(hull, centre))}
			fill="none"
			stroke="rgb(148 163 184 / 0.55)"
			stroke-dasharray="5 5"
		/>
	{/if}

	<g
		class="handle"
		tabindex="0"
		role="button"
		aria-label="The C-shaped polygon; drag or use the arrow keys"
		{@attach draggable(
			() => centre,
			(p) => (centre = within(p, W, H, 92))
		)}
	>
		<polygon points={path(C)} {fill} stroke={hit ? INKS.ember : '#45d16b'} stroke-width="2" />
	</g>
	{#each edges(C) as [p, q], i (i)}
		{#if hits[i]}
			<line x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={INKS.ember} stroke-width="5" />
		{/if}
	{/each}

	{#if against === 'point'}
		<line
			x1={other.x}
			y1={other.y}
			x2={W}
			y2={other.y}
			stroke="#e2e8f0"
			stroke-width="1.5"
			stroke-dasharray="6 5"
		/>
		{#each crossings as crossing, i (i)}
			<Dot x={crossing.x} y={crossing.y} r={5} color="#f1f5f9" />
		{/each}
	{/if}

	{#if against === 'circle'}
		<g
			class="handle"
			tabindex="0"
			role="button"
			aria-label="The circle; drag or use the arrow keys"
			{@attach draggable(
				() => other,
				(p) => (other = within(p, W, H, R))
			)}
		>
			<circle
				cx={other.x}
				cy={other.y}
				r={R}
				{fill}
				stroke={hit ? INKS.ember : INKS.orange}
				stroke-width="2"
			/>
		</g>
	{/if}

	{#if against === 'polygon'}
		<g
			class="handle"
			tabindex="0"
			role="button"
			aria-label="The square; drag or use the arrow keys"
			{@attach draggable(
				() => other,
				(p) => (other = within(p, W, H, 24))
			)}
		>
			<polygon points={path(B)} {fill} stroke={hit ? INKS.ember : INKS.orange} stroke-width="2" />
		</g>
	{/if}

	{#if against === 'segment'}
		<line
			x1={end1.x}
			y1={end1.y}
			x2={end2.x}
			y2={end2.y}
			stroke={hit ? INKS.ember : INKS.orange}
			stroke-width="3"
		/>
		{#each ends as end (end.name)}
			<g
				class="handle"
				tabindex="0"
				role="button"
				aria-label="End {end.name} of the segment; drag or use the arrow keys"
				{@attach draggable(end.get, (p) => end.set(within(p, W, H, 12)))}
			>
				<circle cx={end.get().x} cy={end.get().y} r="20" fill="transparent" />
				<Dot x={end.get().x} y={end.get().y} color={INKS.orange} />
				<text x={end.get().x + 12} y={end.get().y - 12} class="math" fill={INKS.orange}
					>{end.name}</text
				>
			</g>
		{/each}
	{/if}

	{#each hits.flatMap((h) => h ?? []) as point, i (i)}
		<Dot x={point.x} y={point.y} r={5} color="#f1f5f9" />
	{/each}

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
			<text x={other.x - 6} y={other.y - 14} class="math" fill={INKS.ember}>P</text>
		</g>
	{/if}
</Stage>
