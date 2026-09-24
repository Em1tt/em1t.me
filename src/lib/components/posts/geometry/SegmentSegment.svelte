<!--
	Segment vs segment, in grid squares: AB and CD cross when C and D are on opposite sides of the
	line through A and B, and A and B are on opposite sides of the line through C and D.
-->
<script lang="ts">
	import { INKS } from '$lib/halftone';
	import Dot from './Dot.svelte';
	import Stage from './Stage.svelte';
	import { crossingPoint, lineThrough, segmentsIntersect, side } from './collide';
	import { draggable, snap, within, type Point } from './drag';
	import { num } from './format';

	const W = 640;
	const H = 300;
	const U = 30;

	let A = $state({ x: 2 * U, y: 8 * U });
	let B = $state({ x: 12 * U, y: 2 * U });
	let C = $state({ x: 7 * U, y: 2 * U });
	let D = $state({ x: 18 * U, y: 8 * U });

	const u = (p: Point) => ({ x: Math.round(p.x / U), y: Math.round(p.y / U) });
	const a = $derived(u(A));
	const b = $derived(u(B));
	const c = $derived(u(C));
	const d = $derived(u(D));
	const sC = $derived(side(c, lineThrough(a, b)));
	const sD = $derived(side(d, lineThrough(a, b)));
	const sA = $derived(side(a, lineThrough(c, d)));
	const sB = $derived(side(b, lineThrough(c, d)));
	const hit = $derived(segmentsIntersect(a, b, c, d));
	const collinear = $derived(sC === 0 && sD === 0);
	const X = $derived(crossingPoint(a, b, c, d));
	const round = (n: number) => num(Math.round(n * 100) / 100);
	const verdict = (s1: number, s2: number) =>
		s1 * s2 < 0 ? 'opposite sides' : s1 * s2 > 0 ? 'same side' : 'one on the line';

	const handles: { name: string; color: string; get: () => Point; set: (q: Point) => void }[] = [
		{ name: 'A', color: '#45d16b', get: () => A, set: (q) => (A = q) },
		{ name: 'B', color: '#45d16b', get: () => B, set: (q) => (B = q) },
		{ name: 'C', color: INKS.orange, get: () => C, set: (q) => (C = q) },
		{ name: 'D', color: INKS.orange, get: () => D, set: (q) => (D = q) }
	];
</script>

<Stage
	height={H}
	interactive
	label="Two segments, AB and CD, and the point where they cross. Drag any of the four ends."
	caption="Drag any of the four ends; one square is one unit. The numbers are each end's ax + by + c against the other segment's line."
	readout={collinear
		? `All four ends on one line → ${hit ? 'they overlap along it' : 'no overlap along it → apart'}`
		: `C, D against AB: ${num(sC)}, ${num(sD)} (${verdict(sC, sD)}) · A, B against CD: ${num(sA)}, ${num(sB)} (${verdict(sA, sB)}) → ${hit ? `they cross at (${round(X.x)}, ${round(X.y)})` : 'apart'}`}
>
	<line
		x1={A.x}
		y1={A.y}
		x2={B.x}
		y2={B.y}
		stroke={hit ? INKS.ember : '#45d16b'}
		stroke-width="3"
	/>
	<line
		x1={C.x}
		y1={C.y}
		x2={D.x}
		y2={D.y}
		stroke={hit ? INKS.ember : INKS.orange}
		stroke-width="3"
	/>
	{#if hit && !collinear}
		<Dot x={X.x * U} y={X.y * U} r={6} color="#f1f5f9" />
	{/if}

	{#each handles as handle (handle.name)}
		<g
			class="handle"
			tabindex="0"
			role="button"
			aria-label="End {handle.name}; drag or use the arrow keys"
			{@attach draggable(handle.get, (q) => handle.set(snap(within(q, W, H, U))), U)}
		>
			<circle cx={handle.get().x} cy={handle.get().y} r="20" fill="transparent" />
			<Dot x={handle.get().x} y={handle.get().y} color={handle.color} />
			<text x={handle.get().x + 12} y={handle.get().y - 12} class="math" fill={handle.color}
				>{handle.name}</text
			>
		</g>
	{/each}
</Stage>
