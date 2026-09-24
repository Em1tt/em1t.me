<!--
	Spheres, from the chapter on spheres:
	- point: P is inside the sphere when |SP|² ≤ r²;
	- sphere: two spheres touch when |S₁S₂| ≤ r₁ + r₂. Each radius is drawn along the line between
	  the centres, so you can see the two add up.
-->
<script lang="ts">
	import { untrack } from 'svelte';
	import { INKS } from '$lib/halftone';
	import Ball from './Ball.svelte';
	import Handle from './Handle.svelte';
	import Mark from './Mark.svelte';
	import Scene from './Scene.svelte';
	import {
		add,
		distanceSquared,
		normalize,
		pointInSphere,
		scale,
		spheresCollide,
		subtract,
		type Vec3
	} from './space';
	import { CAMERA, fixed, keep, makeView } from './view';

	let { against }: { against: 'point' | 'sphere' } = $props();

	let camera = $state(CAMERA);
	const view = $derived(makeView(camera));

	const R1 = 1.3;
	const R2 = 0.9;
	let S1 = $state({ x: -0.9, y: 1.3, z: 0.5 });
	let other = $state(
		untrack(() => (against === 'point' ? { x: 1.4, y: 2.2, z: -0.4 } : { x: 1.7, y: 1.4, z: -0.6 }))
	);
	const place = (p: Vec3) => keep(p, { x: -3, y: 0, z: -3 }, { x: 3, y: 3.2, z: 3 });

	const hit = $derived(
		against === 'point'
			? pointInSphere(other, { ...S1, r: R1 })
			: spheresCollide({ ...S1, r: R1 }, { ...other, r: R2 })
	);
	const squared = $derived(distanceSquared(S1, other));
	// From S₁ towards the other centre, for drawing the radii along the line between them.
	const u = $derived(normalize(subtract(other, S1)));

	const readout = $derived(
		against === 'point'
			? `|SP|² = ${fixed(squared, 2)} ${hit ? '≤' : '>'} r² = ${fixed(R1 ** 2, 2)} → ${hit ? 'inside' : 'outside'}`
			: `|S₁S₂| = ${fixed(Math.sqrt(squared), 2)} ${hit ? '≤' : '>'} r₁ + r₂ = ${R1} + ${R2} = ${R1 + R2} → ${hit ? 'collision' : 'apart'}`
	);

	const shapes = [
		{ name: 'S1', get: () => S1, set: (p: Vec3) => (S1 = place(p)) },
		{ name: 'other', get: () => other, set: (p: Vec3) => (other = place(p)) }
	];
	const sphereColor = (name: string) =>
		hit ? INKS.ember : name === 'S1' ? '#45d16b' : INKS.orange;
</script>

<Scene
	{view}
	bind:camera
	label={against === 'point'
		? 'A sphere with centre S and a point P. Drag either, or drag the background to turn the view.'
		: 'Two spheres with centres S1 and S2. Drag either, or drag the background to turn the view.'}
	caption="Drag {against === 'point'
		? 'the sphere or P'
		: 'either sphere'}. Drag the background to turn the view."
	{readout}
>
	{#each view.byDepth(shapes, (shape) => shape.get()) as shape (shape.name)}
		{#if shape.name === 'S1' || against === 'sphere'}
			<Handle
				{view}
				get={shape.get}
				set={shape.set}
				label={shape.name === 'S1' ? 'The sphere around S1' : 'The sphere around S2'}
			>
				<Ball
					{view}
					centre={shape.get()}
					r={shape.name === 'S1' ? R1 : R2}
					color={sphereColor(shape.name)}
				/>
			</Handle>
		{:else}
			<Handle {view} get={shape.get} set={shape.set} label="Point P">
				<Mark {view} p={other} color={hit ? INKS.ember : '#f1f5f9'} label="P" grab />
			</Handle>
		{/if}
	{/each}

	<g pointer-events="none">
		<path d={view.path([S1, other])} stroke="#e2e8f0" stroke-width="1.5" stroke-dasharray="6 5" />
		{#if against === 'sphere'}
			<path d={view.path([S1, add(S1, scale(u, R1))])} stroke="#45d16b" stroke-width="4" />
			<path
				d={view.path([other, add(other, scale(u, -R2))])}
				stroke={INKS.orange}
				stroke-width="4"
			/>
		{/if}
		<Mark
			{view}
			p={S1}
			color="#45d16b"
			r={5}
			label="S"
			sub={against === 'point' ? undefined : '1'}
			dx={-26}
			dy={24}
			drop={false}
		/>
		{#if against === 'sphere'}
			<Mark
				{view}
				p={other}
				color={INKS.orange}
				r={5}
				label="S"
				sub="2"
				dx={10}
				dy={24}
				drop={false}
			/>
		{/if}
	</g>
</Scene>
