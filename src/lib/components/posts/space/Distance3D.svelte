<!--
	Distance between two points in space. From A, go along x to D, then along z to C: the right
	triangle ADC lies flat, and the right triangle ACB stands up on AC. |AB| comes from both.
-->
<script lang="ts">
	import { INKS } from '$lib/halftone';
	import Handle from './Handle.svelte';
	import Mark from './Mark.svelte';
	import Scene from './Scene.svelte';
	import { add, length, normalize, scale, subtract, type Vec3 } from './space';
	import { CAMERA, fixed, keep, makeView, triple } from './view';

	let camera = $state(CAMERA);
	const view = $derived(makeView(camera));

	let A = $state({ x: -2, y: 0.5, z: 1.5 });
	let B = $state({ x: 1.5, y: 2.5, z: -1 });
	const D = $derived({ x: B.x, y: A.y, z: A.z });
	const C = $derived({ x: B.x, y: A.y, z: B.z });
	const place = (p: Vec3) => keep(p, { x: -3, y: 0, z: -3 }, { x: 3, y: 3, z: 3 }, 0.5);

	const legs = $derived({ x: Math.abs(B.x - A.x), y: Math.abs(B.y - A.y), z: Math.abs(B.z - A.z) });
	const readout = $derived(
		`A = ${triple(A)}, B = ${triple(B)} · |AD| = ${fixed(legs.x)} · |DC| = ${fixed(legs.z)} · |CB| = ${fixed(legs.y)} · |AB| = √(${fixed(legs.x)}² + ${fixed(legs.z)}² + ${fixed(legs.y)}²) ≈ ${fixed(length(subtract(B, A)), 2)}`
	);

	// The little square that marks a right angle at `at`, between the legs towards p and q.
	const right = (at: Vec3, p: Vec3, q: Vec3, size = 0.3) => {
		if (length(subtract(p, at)) < size * 1.5 || length(subtract(q, at)) < size * 1.5) return '';
		const u = scale(normalize(subtract(p, at)), size);
		const v = scale(normalize(subtract(q, at)), size);
		return view.path([add(at, u), add(add(at, u), v), add(at, v)]);
	};

	const points = [
		{ name: 'A', color: INKS.ember, get: () => A, set: (p: Vec3) => (A = place(p)) },
		{ name: 'B', color: '#45d16b', get: () => B, set: (p: Vec3) => (B = place(p)) }
	];
</script>

<Scene
	{view}
	bind:camera
	label="Two points A and B in space, with the right triangles ADC, lying flat, and ACB, standing on AC, between them. Drag A or B, or drag the background to turn the view."
	caption="Drag A or B. Drag the background to turn the view."
	{readout}
>
	<g pointer-events="none">
		<path d={view.path([A, D, C], true)} fill="rgb(226 232 240 / 0.05)" />
		<path d={view.path([A, C, B], true)} fill="rgb(226 232 240 / 0.08)" />
		<path d={right(D, A, C)} fill="none" stroke="#94a3b8" />
		<path d={right(C, A, B)} fill="none" stroke="#94a3b8" />
		<path d={view.path([A, D])} stroke={INKS.ember} stroke-width="3" />
		<path d={view.path([D, C])} stroke={INKS.orange} stroke-width="3" />
		<path d={view.path([C, B])} stroke="#45d16b" stroke-width="3" />
		<path d={view.path([A, C])} stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="6 5" />
		<path d={view.path([A, B])} stroke="#e2e8f0" stroke-width="2.5" />
		<Mark {view} p={D} color={INKS.ember} r={4.5} label="D" dx={8} dy={20} drop={false} />
		<Mark {view} p={C} color={INKS.orange} r={4.5} label="C" dx={10} dy={20} drop={false} />
	</g>
	{#each points as point (point.name)}
		<Handle {view} get={point.get} set={point.set} label="Point {point.name}" step={0.5}>
			<Mark {view} p={point.get()} color={point.color} label={point.name} grab />
		</Handle>
	{/each}
</Scene>
