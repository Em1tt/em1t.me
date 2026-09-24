<!-- The midpoint S of a segment AB: the average of the endpoints' coordinates. -->
<script lang="ts">
	import { INKS } from '$lib/halftone';
	import Dot from './Dot.svelte';
	import Stage from './Stage.svelte';
	import { draggable, within, type Point } from './drag';

	const W = 640;
	const H = 260;

	let A = $state({ x: 120, y: 190 });
	let B = $state({ x: 500, y: 70 });
	const S = $derived({ x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 });
	const r = (n: number) => Math.round(n);

	const ends: { name: string; color: string; get: () => Point; set: (p: Point) => void }[] = [
		{ name: 'A', color: INKS.ember, get: () => A, set: (p) => (A = p) },
		{ name: 'B', color: '#45d16b', get: () => B, set: (p) => (B = p) }
	];
</script>

<Stage
	height={H}
	interactive
	label="A segment from A to B with its midpoint S. Drag A or B."
	caption="Drag A or B."
	readout="S = (({r(A.x)} + {r(B.x)}) / 2, ({r(A.y)} + {r(B.y)}) / 2) = ({r(S.x)}, {r(
		S.y
	)}) · |AS| = |BS| = {r(Math.hypot(S.x - A.x, S.y - A.y))}"
>
	<line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="#e2e8f0" stroke-width="2" />
	<Dot x={S.x} y={S.y} color={INKS.orange} />
	<text x={S.x + 12} y={S.y + 26} class="math" fill={INKS.orange}>S</text>
	{#each ends as end (end.name)}
		<g
			class="handle"
			tabindex="0"
			role="button"
			aria-label="Point {end.name}; drag or use the arrow keys"
			{@attach draggable(end.get, (point) => end.set(within(point, W, H, 12)))}
		>
			<circle cx={end.get().x} cy={end.get().y} r="22" fill="transparent" />
			<Dot x={end.get().x} y={end.get().y} color={end.color} />
			<text x={end.get().x - 12} y={end.get().y + 30} class="math" fill={end.color}>{end.name}</text
			>
		</g>
	{/each}
</Stage>
