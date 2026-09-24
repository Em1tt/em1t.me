<!--
	Circle vs circle: they touch when the distance between the centres is at most r₁ + r₂. Each
	radius is drawn along the line between the centres, so you can see the two add up.
-->
<script lang="ts">
	import { INKS } from '$lib/halftone';
	import Dot from './Dot.svelte';
	import Stage from './Stage.svelte';
	import { draggable, within } from './drag';

	const W = 640;
	const H = 300;
	const R1 = 90;
	const R2 = 55;

	let S1 = $state({ x: 220, y: 160 });
	let S2 = $state({ x: 470, y: 110 });

	const d = $derived(Math.hypot(S2.x - S1.x, S2.y - S1.y));
	const hit = $derived(d <= R1 + R2);
	// Unit vector from S₁ towards S₂, for drawing the radii along the centre line.
	const u = $derived(d > 0 ? { x: (S2.x - S1.x) / d, y: (S2.y - S1.y) / d } : { x: 1, y: 0 });

	const circles = [
		{ name: '1', r: R1, color: '#45d16b', get: () => S1, set: (p: typeof S1) => (S1 = p) },
		{ name: '2', r: R2, color: INKS.orange, get: () => S2, set: (p: typeof S1) => (S2 = p) }
	];
</script>

<Stage
	height={H}
	interactive
	label="Two circles with centres S1 and S2 and radii r1 and r2. Drag either circle."
	caption="Drag either circle."
	readout="|S₁S₂| = {Math.round(d)} {hit ? '≤' : '>'} r₁ + r₂ = {R1} + {R2} = {R1 + R2} → {hit
		? 'collision'
		: 'apart'}"
>
	{#each circles as circle (circle.name)}
		<g
			class="handle"
			tabindex="0"
			role="button"
			aria-label="Circle {circle.name}; drag or use the arrow keys"
			{@attach draggable(circle.get, (point) => circle.set(within(point, W, H, 20)))}
		>
			<circle
				cx={circle.get().x}
				cy={circle.get().y}
				r={circle.r}
				fill={hit ? 'rgb(255 86 64 / 0.16)' : 'rgb(148 163 184 / 0.06)'}
				stroke={hit ? INKS.ember : circle.color}
				stroke-width="2"
			/>
		</g>
	{/each}

	<line
		x1={S1.x}
		y1={S1.y}
		x2={S2.x}
		y2={S2.y}
		stroke="#e2e8f0"
		stroke-width="1.5"
		stroke-dasharray="6 5"
		pointer-events="none"
	/>
	<g stroke-width="4" pointer-events="none">
		<line x1={S1.x} y1={S1.y} x2={S1.x + u.x * R1} y2={S1.y + u.y * R1} stroke="#45d16b" />
		<line x1={S2.x} y1={S2.y} x2={S2.x - u.x * R2} y2={S2.y - u.y * R2} stroke={INKS.orange} />
	</g>
	<g pointer-events="none">
		<Dot x={S1.x} y={S1.y} color="#45d16b" />
		<Dot x={S2.x} y={S2.y} color={INKS.orange} />
		<text x={S1.x - 14} y={S1.y + 30} class="math" fill="#45d16b"
			>S<tspan class="num" font-size="13" dy="5">1</tspan></text
		>
		<text x={S2.x + 12} y={S2.y + 30} class="math" fill={INKS.orange}
			>S<tspan class="num" font-size="13" dy="5">2</tspan></text
		>
	</g>
</Stage>
