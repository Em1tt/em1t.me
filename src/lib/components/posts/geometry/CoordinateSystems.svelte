<!--
	The Cartesian coordinate system in a plane and in space, side by side. Space is drawn in
	cabinet projection: z points towards you, at 45° and half length.
-->
<script lang="ts">
	import { INKS } from '$lib/halftone';
	import Dot from './Dot.svelte';
	import Stage from './Stage.svelte';

	const U = 30;

	// The plane.
	const O2 = { x: 50, y: 250 };
	const P2 = { x: O2.x + 6 * U, y: O2.y - 5 * U };

	// Space: x right, y up, z towards you.
	const O3 = { x: 420, y: 220 };
	const Z = { x: -U * 0.5 * Math.SQRT1_2, y: U * 0.5 * Math.SQRT1_2 };
	const at = (x: number, y: number, z: number) => ({
		x: O3.x + x * U + z * Z.x,
		y: O3.y - y * U + z * Z.y
	});
	const P3 = at(4, 4, 3);
	const floor = { x: at(4, 0, 0), foot: at(4, 0, 3), z: at(0, 0, 3) };
	const zEnd = at(0, 0, 6);
</script>

<Stage
	height={300}
	label="Left: a plane with x and y axes and a point P at (x, y). Right: space with x, y and z axes and a point P at (x, y, z), with dashed lines down to the floor and back to the axes."
>
	<line x1="320" y1="20" x2="320" y2="280" stroke="rgb(148 163 184 / 0.25)" />

	<g stroke="#cbd5e1" stroke-width="1.5">
		<line x1={O2.x} y1={O2.y} x2="290" y2={O2.y} />
		<line x1={O2.x} y1={O2.y} x2={O2.x} y2="28" />
	</g>
	<path d="M 298 {O2.y} l -12 -6 v 12 z" fill="#cbd5e1" />
	<path d="M {O2.x} 20 l -6 12 h 12 z" fill="#cbd5e1" />
	<text x="284" y={O2.y + 26} class="math" fill="#e2e8f0">x</text>
	<text x={O2.x + 12} y="34" class="math" fill="#e2e8f0">y</text>
	<text x={O2.x - 8} y={O2.y + 24} text-anchor="end" class="math" fill="#94a3b8">O</text>
	<g stroke={INKS.orange} stroke-width="1.5" stroke-dasharray="6 5">
		<line x1={P2.x} y1={P2.y} x2={P2.x} y2={O2.y} />
		<line x1={P2.x} y1={P2.y} x2={O2.x} y2={P2.y} />
	</g>
	<Dot x={P2.x} y={P2.y} color={INKS.ember} />
	<text x={P2.x + 14} y={P2.y - 12} class="math" fill={INKS.ember}
		>P<tspan class="num">(</tspan>x<tspan class="num">,&#160;</tspan>y<tspan class="num">)</tspan
		></text
	>
	<text x="170" y="290" text-anchor="middle" class="mono">plane (2D)</text>

	<g stroke="#cbd5e1" stroke-width="1.5">
		<line x1={O3.x} y1={O3.y} x2="610" y2={O3.y} />
		<line x1={O3.x} y1={O3.y} x2={O3.x} y2="28" />
		<line x1={O3.x} y1={O3.y} x2={zEnd.x} y2={zEnd.y} />
	</g>
	<path d="M 618 {O3.y} l -12 -6 v 12 z" fill="#cbd5e1" />
	<path d="M {O3.x} 20 l -6 12 h 12 z" fill="#cbd5e1" />
	<text x="604" y={O3.y + 26} class="math" fill="#e2e8f0">x</text>
	<text x={O3.x + 12} y="34" class="math" fill="#e2e8f0">y</text>
	<text x={zEnd.x - 18} y={zEnd.y + 4} class="math" fill="#e2e8f0">z</text>
	<text x={O3.x + 8} y={O3.y - 10} class="math" fill="#94a3b8">O</text>
	<g stroke={INKS.orange} stroke-width="1.5" stroke-dasharray="6 5" fill="none">
		<line x1={P3.x} y1={P3.y} x2={floor.foot.x} y2={floor.foot.y} />
		<path d="M {floor.x.x} {floor.x.y} L {floor.foot.x} {floor.foot.y} L {floor.z.x} {floor.z.y}" />
	</g>
	<Dot x={P3.x} y={P3.y} color={INKS.ember} />
	<text x={P3.x + 14} y={P3.y - 12} class="math" fill={INKS.ember}
		>P<tspan class="num">(</tspan>x<tspan class="num">,&#160;</tspan>y<tspan class="num"
			>,&#160;</tspan
		>z<tspan class="num">)</tspan></text
	>
	<text x="480" y="290" text-anchor="middle" class="mono">space (3D)</text>
</Stage>
