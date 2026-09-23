<!-- A point, a circle and a rectangle in the plane, each described by nothing but numbers. -->
<script lang="ts">
	import { INKS } from '$lib/halftone';
	import Dot from './Dot.svelte';
	import Stage from './Stage.svelte';

	// One unit is one grid square; the origin sits on a grid line.
	const U = 30;
	const O = { x: 300, y: 150 };
	const at = (x: number, y: number) => ({ x: O.x + x * U, y: O.y - y * U });

	const A = at(4, 3);
	const S = at(-5, 2);
	const box = { from: at(3, -1), to: at(8, -4) };
</script>

<Stage
	height={330}
	label="A coordinate plane with the point A at (4, 3), a circle with its centre S at (−5, 2) and radius 2, and a rectangle spanning x from 3 to 8 and y from −4 to −1"
>
	<g stroke="#cbd5e1" stroke-width="1.5">
		<line x1="15" y1={O.y} x2="620" y2={O.y} />
		<line x1={O.x} y1="315" x2={O.x} y2="18" />
	</g>
	<path d="M 628 {O.y} l -12 -6 v 12 z" fill="#cbd5e1" />
	<path d="M {O.x} 10 l -6 12 h 12 z" fill="#cbd5e1" />
	<text x="612" y={O.y + 26} class="math" fill="#e2e8f0">x</text>
	<text x={O.x + 12} y="26" class="math" fill="#e2e8f0">y</text>
	<text x={O.x - 10} y={O.y + 24} text-anchor="end" class="math" fill="#94a3b8">O</text>

	<g stroke={INKS.orange} stroke-width="1.5" stroke-dasharray="6 5">
		<line x1={A.x} y1={A.y} x2={A.x} y2={O.y} />
		<line x1={A.x} y1={A.y} x2={O.x} y2={A.y} />
	</g>
	<text x={A.x} y={O.y + 22} text-anchor="middle" class="mono">4</text>
	<text x={O.x - 10} y={A.y + 5} text-anchor="end" class="mono">3</text>
	<Dot x={A.x} y={A.y} color={INKS.ember} />
	<text x={A.x + 14} y={A.y - 12} class="math" fill={INKS.ember}
		>A<tspan class="num">(4, 3)</tspan></text
	>

	<circle
		cx={S.x}
		cy={S.y}
		r={2 * U}
		fill="rgb(69 209 107 / 0.1)"
		stroke="#45d16b"
		stroke-width="2"
	/>
	<line x1={S.x} y1={S.y} x2={S.x + 2 * U} y2={S.y} stroke="#45d16b" stroke-dasharray="4 4" />
	<Dot x={S.x} y={S.y} r={6} color="#45d16b" />
	<text x={S.x + U} y={S.y - 8} text-anchor="middle" class="math" fill="#45d16b">r</text>
	<text x={S.x} y={S.y + 2 * U + 28} text-anchor="middle" class="math" fill="#45d16b"
		>S<tspan class="num">(−5, 2),&#160;</tspan>r<tspan class="num">&#160;=&#160;2</tspan></text
	>

	<rect
		x={box.from.x}
		y={box.from.y}
		width={box.to.x - box.from.x}
		height={box.to.y - box.from.y}
		fill="rgb(255 86 64 / 0.1)"
		stroke={INKS.ember}
		stroke-width="2"
	/>
	<text x={(box.from.x + box.to.x) / 2} y={box.to.y + 26} text-anchor="middle" class="mono"
		>x ∈ [3, 8], y ∈ [−4, −1]</text
	>
</Stage>
