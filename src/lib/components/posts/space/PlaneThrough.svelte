<!--
	A plane through three points, from the chapter on planes. The cross product AB × AC is at right
	angles to both vectors, so it's the plane's normal n, drawn here at A (shortened to fit). P is
	on the side n points to when side(P) > 0, and |side(P)| / |n| away from the plane.
-->
<script lang="ts">
	import { INKS } from '$lib/halftone';
	import Arrow from './Arrow.svelte';
	import Handle from './Handle.svelte';
	import Mark from './Mark.svelte';
	import Scene from './Scene.svelte';
	import Sheet from './Sheet.svelte';
	import {
		add,
		closestPointOnPlane,
		cross,
		length,
		normalize,
		planeThrough,
		scale,
		side,
		subtract,
		type Vec3
	} from './space';
	import { CAMERA, fixed, keep, makeView, triple } from './view';

	let camera = $state(CAMERA);
	const view = $derived(makeView(camera));

	let A = $state({ x: -1, y: 1.5, z: -1.5 });
	let B = $state({ x: -2, y: 1, z: 1 });
	let C = $state({ x: 1.5, y: 1, z: 1 });
	let P = $state({ x: 1.5, y: 2.5, z: -1 });
	const place = (p: Vec3) => keep(p, { x: -3, y: 0, z: -3 }, { x: 3, y: 3.2, z: 3 }, 0.5);

	const n = $derived(cross(subtract(B, A), subtract(C, A)));
	const flat = $derived(length(n) < 1e-9);
	const plane = $derived(planeThrough(A, B, C));
	const s = $derived(side(P, plane));
	const foot = $derived(closestPointOnPlane(P, plane));
	const centroid = $derived(scale(add(add(A, B), C), 1 / 3));

	const readout = $derived(
		flat
			? 'A, B and C are on one line, so AB × AC = (0, 0, 0): no single plane goes through them'
			: `n = AB × AC = ${triple(n, 2)} · side(P) = ${fixed(s, 2)} ${s > 0 ? '> 0: on the side n points to' : s < 0 ? '< 0: on the other side' : '= 0: on the plane'} · distance = |side(P)| / |n| = ${fixed(Math.abs(s) / length(n), 2)}`
	);

	const corners = [
		{ name: 'A', get: () => A, set: (p: Vec3) => (A = place(p)) },
		{ name: 'B', get: () => B, set: (p: Vec3) => (B = place(p)) },
		{ name: 'C', get: () => C, set: (p: Vec3) => (C = place(p)) }
	];
	// The plane and P, far one first.
	const layers = $derived(
		view.byDepth(
			[
				{ name: 'plane', at: foot },
				{ name: 'P', at: P }
			],
			(layer) => layer.at
		)
	);
</script>

<Scene
	{view}
	bind:camera
	label="A plane through three points A, B and C, with the vectors AB and AC and their cross product n, the plane's normal, and a point P above or below the plane. Drag any of the points, or drag the background to turn the view."
	caption="Drag A, B, C or P. Drag the background to turn the view."
	{readout}
>
	{#each layers as layer (layer.name)}
		{#if layer.name === 'plane'}
			<g>
				{#if !flat}
					<Sheet {view} {plane} near={centroid} size={2.4} color="#94a3b8" />
				{/if}
				<path
					d={view.path([A, B, C], true)}
					fill="rgb(226 232 240 / 0.1)"
					stroke="rgb(226 232 240 / 0.5)"
					pointer-events="none"
				/>
			</g>
		{:else}
			<Handle {view} get={() => P} set={(p) => (P = place(p))} label="Point P" step={0.5}>
				{#if !flat}
					<path
						d={view.path([P, foot])}
						stroke="#e2e8f0"
						stroke-width="1.5"
						stroke-dasharray="6 5"
						pointer-events="none"
					/>
				{/if}
				<Mark
					{view}
					p={P}
					color={s > 0 ? '#45d16b' : s < 0 ? INKS.ember : '#f1f5f9'}
					label="P"
					grab
				/>
			</Handle>
		{/if}
	{/each}

	<Arrow {view} from={A} to={B} color={INKS.orange} />
	<Arrow {view} from={A} to={C} color="#45d16b" />
	{#if !flat}
		<Arrow {view} from={A} to={add(A, scale(normalize(n), 1.5))} color="#e2e8f0" label="n" />
	{/if}
	{#each corners as corner (corner.name)}
		<Handle {view} get={corner.get} set={corner.set} label="Point {corner.name}" step={0.5}>
			<Mark {view} p={corner.get()} color="#e2e8f0" r={5} label={corner.name} grab />
		</Handle>
	{/each}
</Scene>
