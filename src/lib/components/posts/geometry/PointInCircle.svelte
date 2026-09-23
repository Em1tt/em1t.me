<!-- Point in circle: P is inside when its squared distance from the centre is at most r². -->
<script lang="ts">
	import { INKS } from '$lib/halftone';
	import Dot from './Dot.svelte';
	import Stage from './Stage.svelte';
	import { draggable, within } from './drag';
	import { squared } from './format';

	const W = 640;
	const H = 300;
	const R = 100;

	let S = $state({ x: 250, y: 150 });
	let P = $state({ x: 430, y: 80 });

	const dx = $derived(Math.round(P.x - S.x));
	const dy = $derived(Math.round(P.y - S.y));
	const d2 = $derived(dx * dx + dy * dy);
	const inside = $derived(d2 <= R * R);
</script>

<Stage
	height={H}
	interactive
	label="A circle with centre S and radius r, and a point P. Drag either one."
	caption="Drag P or the centre S."
	readout="(x − a)² + (y − b)² = {squared(dx)} + {squared(dy)} = {d2} {inside ? '≤' : '>'} r² = {R *
		R} → {inside ? 'P is inside' : 'P is outside'}"
>
	<circle
		cx={S.x}
		cy={S.y}
		r={R}
		fill={inside ? 'rgb(255 86 64 / 0.14)' : 'rgb(69 209 107 / 0.06)'}
		stroke={inside ? INKS.ember : '#45d16b'}
		stroke-width="2"
	/>
	<g stroke={INKS.orange} stroke-width="1.5" stroke-dasharray="6 5">
		<line x1={S.x} y1={S.y} x2={P.x} y2={S.y} />
		<line x1={P.x} y1={S.y} x2={P.x} y2={P.y} />
	</g>
	<line x1={S.x} y1={S.y} x2={P.x} y2={P.y} stroke="#e2e8f0" stroke-width="2" />
	<text
		x={(S.x + P.x) / 2}
		y={S.y + (P.y >= S.y ? -10 : 24)}
		text-anchor="middle"
		class="math"
		fill={INKS.orange}>x<tspan class="num">&#160;−&#160;</tspan>a</text
	>
	<text
		x={P.x + (P.x >= S.x ? 10 : -10)}
		y={(S.y + P.y) / 2 + 6}
		text-anchor={P.x >= S.x ? 'start' : 'end'}
		class="math"
		fill={INKS.orange}>y<tspan class="num">&#160;−&#160;</tspan>b</text
	>

	<g
		class="handle"
		tabindex="0"
		role="button"
		aria-label="Centre S; drag or use the arrow keys"
		{@attach draggable(
			() => S,
			(point) => (S = within(point, W, H, 20))
		)}
	>
		<circle cx={S.x} cy={S.y} r="22" fill="transparent" />
		<Dot x={S.x} y={S.y} color="#45d16b" />
		<text x={S.x - 14} y={S.y + 30} class="math" fill="#45d16b">S</text>
	</g>
	<g
		class="handle"
		tabindex="0"
		role="button"
		aria-label="Point P; drag or use the arrow keys"
		{@attach draggable(
			() => P,
			(point) => (P = within(point, W, H, 12))
		)}
	>
		<circle cx={P.x} cy={P.y} r="22" fill="transparent" />
		<Dot x={P.x} y={P.y} color={INKS.ember} />
		<text x={P.x + 14} y={P.y - 12} class="math" fill={INKS.ember}>P</text>
	</g>
</Stage>
