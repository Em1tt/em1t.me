<!--
	Circle vs line: the line through P₁ and P₂ is ax + by + c = 0, and the circle touches it when
	the centre's distance |ax + by + c| / √(a² + b²) is at most r.
-->
<script lang="ts">
	import { INKS } from '$lib/halftone';
	import Dot from './Dot.svelte';
	import Stage from './Stage.svelte';
	import { draggable, within } from './drag';
	import { num, plus } from './format';

	const W = 640;
	const H = 300;
	const R = 50;

	let P1 = $state({ x: 70, y: 250 });
	let P2 = $state({ x: 570, y: 70 });
	let C = $state({ x: 440, y: 240 });

	// ax + by + c = 0 through P₁ and P₂.
	const a = $derived(Math.round(P2.y - P1.y));
	const b = $derived(Math.round(P1.x - P2.x));
	const c = $derived(Math.round(P2.x * P1.y - P1.x * P2.y));
	const value = $derived(a * C.x + b * C.y + c);
	const length = $derived(Math.hypot(a, b) || 1);
	const d = $derived(Math.round(Math.abs(value) / length));
	const hit = $derived(d <= R);
	// F, the foot of the perpendicular from C: step back along the normal (a, b).
	const F = $derived({
		x: C.x - (value / length) * (a / length),
		y: C.y - (value / length) * (b / length)
	});
	// Draw the whole line, not just the segment between the handles.
	const far = $derived({ x: (P2.x - P1.x) * 20, y: (P2.y - P1.y) * 20 });
</script>

<Stage
	height={H}
	interactive
	label="A line through the points P1 and P2, and a circle with centre C, with the perpendicular from C to the line. Drag any of the three points."
	caption="Drag P₁, P₂ or the circle."
	readout="{num(a)}x {plus(b)}y {plus(c)} = 0 · d = |ax + by + c| / √(a² + b²) = {d} {hit
		? '≤'
		: '>'} r = {R} → {hit ? 'collision' : 'apart'}"
>
	<line
		x1={P1.x - far.x}
		y1={P1.y - far.y}
		x2={P2.x + far.x}
		y2={P2.y + far.y}
		stroke={hit ? INKS.ember : '#45d16b'}
		stroke-width="2"
	/>
	<circle
		cx={C.x}
		cy={C.y}
		r={R}
		fill={hit ? 'rgb(255 86 64 / 0.16)' : 'rgb(148 163 184 / 0.06)'}
		stroke={hit ? INKS.ember : INKS.orange}
		stroke-width="2"
		pointer-events="none"
	/>
	<line
		x1={C.x}
		y1={C.y}
		x2={F.x}
		y2={F.y}
		stroke="#e2e8f0"
		stroke-width="2"
		stroke-dasharray="6 5"
	/>
	<Dot x={F.x} y={F.y} r={5} color="#f1f5f9" />
	<text x={(C.x + F.x) / 2 + 10} y={(C.y + F.y) / 2} class="math" fill="#f1f5f9">d</text>

	{#each [{ name: '1', get: () => P1, set: (p: typeof P1) => (P1 = p) }, { name: '2', get: () => P2, set: (p: typeof P1) => (P2 = p) }] as handle (handle.name)}
		<g
			class="handle"
			tabindex="0"
			role="button"
			aria-label="Point P{handle.name} on the line; drag or use the arrow keys"
			{@attach draggable(handle.get, (point) => handle.set(within(point, W, H, 12)))}
		>
			<circle cx={handle.get().x} cy={handle.get().y} r="22" fill="transparent" />
			<Dot x={handle.get().x} y={handle.get().y} color="#45d16b" />
			<text x={handle.get().x + 12} y={handle.get().y - 12} class="math" fill="#45d16b"
				>P<tspan class="num" font-size="13" dy="5">{handle.name}</tspan></text
			>
		</g>
	{/each}
	<g
		class="handle"
		tabindex="0"
		role="button"
		aria-label="Circle centre C; drag or use the arrow keys"
		{@attach draggable(
			() => C,
			(point) => (C = within(point, W, H, 16))
		)}
	>
		<circle cx={C.x} cy={C.y} r={R} fill="transparent" />
		<Dot x={C.x} y={C.y} color={INKS.orange} />
		<text x={C.x + 14} y={C.y + 26} class="math" fill={INKS.orange}>C</text>
	</g>
</Stage>
