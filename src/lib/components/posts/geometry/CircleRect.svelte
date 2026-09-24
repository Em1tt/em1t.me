<!--
	Circle vs rectangle: clamp the centre into the rectangle to get the rectangle's closest point,
	then it's a point-in-circle test.
-->
<script lang="ts">
	import { INKS } from '$lib/halftone';
	import Dot from './Dot.svelte';
	import Stage from './Stage.svelte';
	import { draggable, within } from './drag';

	const W = 640;
	const H = 300;
	const R = 50;

	let box = $state({ x: 200, y: 80, w: 190, h: 130 });
	let C = $state({ x: 480, y: 230 });

	const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
	const Q = $derived({ x: clamp(C.x, box.x, box.x + box.w), y: clamp(C.y, box.y, box.y + box.h) });
	const d = $derived(Math.round(Math.hypot(C.x - Q.x, C.y - Q.y)));
	const hit = $derived(d <= R);
</script>

<Stage
	height={H}
	interactive
	label="A rectangle, a circle with centre C, and Q, the point of the rectangle closest to C. Drag the circle or the rectangle."
	caption="Drag the circle or the rectangle."
	readout="Q = (clamp({Math.round(C.x)}, {box.x}, {box.x + box.w}), clamp({Math.round(
		C.y
	)}, {box.y}, {box.y + box.h})) = ({Math.round(Q.x)}, {Math.round(Q.y)}) · |CQ| = {d} {hit
		? '≤'
		: '>'} r = {R} → {hit ? 'collision' : 'apart'}"
>
	<g
		class="handle"
		tabindex="0"
		role="button"
		aria-label="Rectangle; drag or use the arrow keys"
		{@attach draggable(
			() => box,
			(point) => (box = { ...box, ...within(point, W - box.w, H - box.h, 8) })
		)}
	>
		<rect
			x={box.x}
			y={box.y}
			width={box.w}
			height={box.h}
			fill={hit ? 'rgb(255 86 64 / 0.16)' : 'rgb(148 163 184 / 0.06)'}
			stroke={hit ? INKS.ember : '#45d16b'}
			stroke-width="2"
		/>
	</g>

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
		x2={Q.x}
		y2={Q.y}
		stroke="#e2e8f0"
		stroke-width="2"
		stroke-dasharray="6 5"
	/>
	<Dot x={Q.x} y={Q.y} r={5} color="#f1f5f9" />
	<text
		x={Q.x + (Q.x >= C.x ? -14 : 12)}
		y={Q.y + (Q.y >= C.y ? -12 : 24)}
		text-anchor={Q.x >= C.x ? 'end' : 'start'}
		class="math"
		fill="#f1f5f9">Q</text
	>

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
