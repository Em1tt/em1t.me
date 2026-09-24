<!--
	The general equation of a line through P₁ and P₂, counted in grid squares, with its normal
	vector (a, b). The slope form y = kx + q gives up on vertical lines, where b = 0.
-->
<script lang="ts">
	import { INKS } from '$lib/halftone';
	import Dot from './Dot.svelte';
	import Stage from './Stage.svelte';
	import { normalize } from './collide';
	import { draggable, snap, within, type Point } from './drag';
	import { num, plus } from './format';

	const W = 640;
	const H = 300;
	const U = 30;

	let P1 = $state({ x: 3 * U, y: 7 * U });
	let P2 = $state({ x: 15 * U, y: 3 * U });

	const u = (p: Point) => ({ x: Math.round(p.x / U), y: Math.round(p.y / U) });
	const p1 = $derived(u(P1));
	const p2 = $derived(u(P2));
	const a = $derived(p2.y - p1.y);
	const b = $derived(p1.x - p2.x);
	const c = $derived(p2.x * p1.y - p1.x * p2.y);
	const same = $derived(a === 0 && b === 0);
	const round = (n: number) => Math.round(n * 100) / 100;

	const M = $derived({ x: (P1.x + P2.x) / 2, y: (P1.y + P2.y) / 2 });
	const n = $derived(normalize({ x: a, y: b }));
	const tip = $derived({ x: M.x + n.x * 60, y: M.y + n.y * 60 });
	const far = $derived({ x: (P2.x - P1.x) * 20, y: (P2.y - P1.y) * 20 });

	const equation = $derived(`${num(a)}x ${plus(b)}y ${plus(c)} = 0`);
	const slope = $derived(
		b === 0
			? `b = 0, a vertical line: y = kx + q can't describe it`
			: `y = kx + q with k = −a/b = ${num(round(-a / b))}, q = −c/b = ${num(round(-c / b))}`
	);

	const ends: { name: string; get: () => Point; set: (p: Point) => void }[] = [
		{ name: '1', get: () => P1, set: (p) => (P1 = p) },
		{ name: '2', get: () => P2, set: (p) => (P2 = p) }
	];
</script>

<Stage
	height={H}
	interactive
	label="A line through the points P1 and P2 on a grid, with its normal vector (a, b). Drag either point."
	caption="Drag P₁ or P₂; they snap to the grid, and one square is one unit. Line them up vertically to see the slope form fail."
	readout={same
		? 'P₁ and P₂ are the same point: a line needs two.'
		: `a = y₂ − y₁ = ${p2.y} − ${p1.y} = ${a} · b = x₁ − x₂ = ${p1.x} − ${p2.x} = ${b} · c = x₂y₁ − x₁y₂ = ${c} → ${equation} · ${slope}`}
>
	{#if !same}
		<line
			x1={P1.x - far.x}
			y1={P1.y - far.y}
			x2={P2.x + far.x}
			y2={P2.y + far.y}
			stroke="#45d16b"
			stroke-width="2"
		/>
		<line x1={M.x} y1={M.y} x2={tip.x} y2={tip.y} stroke={INKS.orange} stroke-width="2.5" />
		<path
			d="M {tip.x + n.x * 12} {tip.y + n.y * 12} L {tip.x - n.y * 7} {tip.y + n.x * 7} L {tip.x +
				n.y * 7} {tip.y - n.x * 7} Z"
			fill={INKS.orange}
		/>
		<text x={tip.x + n.x * 22 + 4} y={tip.y + n.y * 22 + 6} class="math" fill={INKS.orange}
			><tspan class="num">(</tspan>a<tspan class="num">,&#160;</tspan>b<tspan class="num">)</tspan
			></text
		>
	{/if}

	{#each ends as end (end.name)}
		<g
			class="handle"
			tabindex="0"
			role="button"
			aria-label="Point P{end.name}; drag or use the arrow keys"
			{@attach draggable(end.get, (point) => end.set(snap(within(point, W, H, U))), U)}
		>
			<circle cx={end.get().x} cy={end.get().y} r="22" fill="transparent" />
			<Dot x={end.get().x} y={end.get().y} color={INKS.ember} />
			<text x={end.get().x + 12} y={end.get().y - 12} class="math" fill={INKS.ember}
				>P<tspan class="num" font-size="13" dy="5">{end.name}</tspan><tspan class="num" dy="-5"
					>({u(end.get()).x},&#160;{u(end.get()).y})</tspan
				></text
			>
		</g>
	{/each}
</Stage>
