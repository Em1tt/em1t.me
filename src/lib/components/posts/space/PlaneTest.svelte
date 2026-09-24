<!--
	A tilted plane against a sphere or a box, from the chapter on planes.
	- sphere: they touch when the centre is at most r from the plane;
	- box: the box reaches (w/2)|a| + (h/2)|b| + (d/2)|c| along the normal from its centre, in the
	  units of side(). That reach is drawn as a bar through the centre, along the normal, and the
	  corner that would touch the plane first is marked.
-->
<script lang="ts">
	import { INKS } from '$lib/halftone';
	import Ball from './Ball.svelte';
	import Block from './Block.svelte';
	import Handle from './Handle.svelte';
	import Mark from './Mark.svelte';
	import Scene from './Scene.svelte';
	import Sheet from './Sheet.svelte';
	import {
		add,
		boxCentre,
		boxPlaneCollide,
		boxReach,
		closestPointOnPlane,
		length,
		normalOf,
		normalize,
		scale,
		side,
		spherePlaneCollide,
		type Box,
		type Vec3
	} from './space';
	import { CAMERA, fixed, keep, makeView, RAMP } from './view';

	let { against }: { against: 'sphere' | 'box' } = $props();

	let camera = $state(CAMERA);
	const view = $derived(makeView(camera));

	const plane = RAMP;
	const n = normalOf(plane);
	const R = 0.8;
	let S = $state({ x: -1.2, y: 2.6, z: 0.8 });
	let box = $state<Box>({ x: 0.4, y: 1.9, z: -1.2, w: 1.4, h: 1, d: 1.2 });
	const place = (p: Vec3) => keep(p, { x: -3, y: 0, z: -3 }, { x: 3, y: 3.2, z: 3 });
	const move = (p: Vec3): Box => ({
		...box,
		...keep(p, { x: -3, y: 0, z: -3 }, { x: 3 - box.w, y: 3.2 - box.h, z: 3 - box.d })
	});

	const centre = $derived(against === 'sphere' ? S : boxCentre(box));
	const foot = $derived(closestPointOnPlane(centre, plane));
	const s = $derived(side(centre, plane));
	const hit = $derived(
		against === 'sphere' ? spherePlaneCollide({ ...S, r: R }, plane) : boxPlaneCollide(box, plane)
	);
	// The box's reach along the normal, in real units, and the corner that reaches the plane first.
	const reach = $derived(boxReach(box, plane) / length(n));
	const toward = $derived(scale(normalize(n), s > 0 ? -1 : 1));
	const corner = $derived({
		x: centre.x + (box.w / 2) * Math.sign(toward.x),
		y: centre.y + (box.h / 2) * Math.sign(toward.y),
		z: centre.z + (box.d / 2) * Math.sign(toward.z)
	});

	const readout = $derived(
		against === 'sphere'
			? `distance = |side(S)| / |n| = ${fixed(Math.abs(s) / length(n), 2)} ${hit ? '≤' : '>'} r = ${R} → ${hit ? 'collision' : 'apart'}`
			: `C is ${fixed(Math.abs(s) / length(n), 2)} from the plane, and the box reaches ${fixed(reach, 2)} along n → ${hit ? 'collision' : 'apart'}`
	);

	const ink = $derived(hit ? INKS.ember : INKS.orange);
	const layers = $derived(
		view.byDepth(
			[
				{ name: 'plane', at: foot },
				{ name: 'shape', at: centre }
			],
			(layer) => layer.at
		)
	);
</script>

<Scene
	{view}
	bind:camera
	label="A tilted plane with its normal n, and a {against === 'sphere'
		? 'sphere with centre S'
		: 'box with centre C'}. Drag the {against}, or drag the background to turn the view."
	caption="Drag the {against}. Drag the background to turn the view."
	{readout}
>
	{#each layers as layer (layer.name)}
		{#if layer.name === 'plane'}
			<Sheet
				{view}
				{plane}
				near={{ x: 0, y: 1, z: 0 }}
				size={2.6}
				color="#94a3b8"
				normal="n"
				normalColor="#e2e8f0"
				normalAt={[-0.65, 0]}
			/>
		{:else if against === 'sphere'}
			<Handle {view} get={() => S} set={(p) => (S = place(p))} label="The sphere">
				<Ball {view} centre={S} r={R} color={ink} />
			</Handle>
		{:else}
			<Handle {view} get={() => box} set={(p) => (box = move(p))} label="The box">
				<Block {view} {box} color={ink} />
			</Handle>
		{/if}
	{/each}

	<g pointer-events="none">
		<path
			d={view.path([centre, foot])}
			stroke="#e2e8f0"
			stroke-width="1.5"
			stroke-dasharray="6 5"
		/>
		{#if against === 'box'}
			<path
				d={view.path([
					add(centre, scale(normalize(n), -reach)),
					add(centre, scale(normalize(n), reach))
				])}
				stroke={ink}
				stroke-width="5"
				stroke-opacity="0.9"
			/>
			<Mark {view} p={corner} color="#f1f5f9" r={5} drop={false} />
		{/if}
		<Mark
			{view}
			p={centre}
			color={ink}
			r={5}
			label={against === 'sphere' ? 'S' : 'C'}
			dx={10}
			dy={-10}
			drop={false}
		/>
		<Mark {view} p={foot} color="#e2e8f0" r={3.5} drop={false} />
	</g>
</Scene>
