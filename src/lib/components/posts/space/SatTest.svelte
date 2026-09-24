<!--
	The separating axis test in 3D, from its chapter: turned boxes, or a turned box and a triangle.
	It tries each shape's face normals, then the cross product of every edge direction of one with
	every edge direction of the other. The first axis with a gap is drawn through the middle, with
	both shapes' shadows on it and the plane that fits between them.
	`start: 'edges'` sets up two sticks that only an edge × edge axis can tell apart.
-->
<script lang="ts">
	import { untrack } from 'svelte';
	import { INKS } from '$lib/halftone';
	import Block from './Block.svelte';
	import Handle from './Handle.svelte';
	import Mark from './Mark.svelte';
	import Scene from './Scene.svelte';
	import Sheet from './Sheet.svelte';
	import {
		add,
		dot,
		length,
		midpoint,
		normalize,
		orientedBoxShape,
		planeAt,
		scale,
		separatingAxes3,
		triangleShape,
		turned,
		type OrientedBox,
		type Vec3
	} from './space';
	import { CAMERA, keep, makeView } from './view';

	type Props = { against: 'box' | 'triangle'; start?: 'faces' | 'edges' };
	let { against, start = 'faces' }: Props = $props();

	let camera = $state(CAMERA);
	const view = $derived(makeView(camera));

	type Pose = { centre: Vec3; yaw: number; tilt: number; half: [number, number, number] };
	const poses: Record<'faces' | 'edges', [Pose, Pose]> = {
		faces: [
			{ centre: { x: -1.3, y: 1.2, z: 0.3 }, yaw: 20, tilt: 0, half: [1, 0.6, 0.8] },
			{ centre: { x: 1.4, y: 1.5, z: -0.4 }, yaw: -30, tilt: 25, half: [0.8, 0.8, 0.6] }
		],
		// Found by a search: apart, but no face normal shows the gap.
		edges: [
			{ centre: { x: -0.7, y: 1.3, z: 0 }, yaw: 113, tilt: 32, half: [1.3, 0.35, 0.35] },
			{ centre: { x: 1.29, y: 1.58, z: 0.15 }, yaw: 145, tilt: -13, half: [1.3, 0.35, 0.35] }
		]
	};
	let A = $state<Pose>(
		untrack(() =>
			against === 'triangle'
				? { centre: { x: -0.8, y: 1.2, z: 0.2 }, yaw: 30, tilt: 15, half: [1, 0.7, 0.8] }
				: structuredClone(poses[start][0])
		)
	);
	let B = $state<Pose>(untrack(() => structuredClone(poses[start][1])));
	let T = $state([
		{ x: 1.1, y: 0.5, z: 1.6 },
		{ x: 2.5, y: 2.2, z: 0.4 },
		{ x: 0.9, y: 2.6, z: -1.6 }
	]);
	const place = (p: Vec3) => keep(p, { x: -3, y: 0, z: -3 }, { x: 3, y: 3.2, z: 3 });

	const radians = (degrees: number) => (degrees * Math.PI) / 180;
	const oriented = (pose: Pose): OrientedBox => ({
		centre: pose.centre,
		axes: turned(radians(pose.yaw), radians(pose.tilt)),
		half: pose.half
	});
	const boxA = $derived(oriented(A));
	const boxB = $derived(oriented(B));
	const tri = $derived({ a: T[0], b: T[1], c: T[2] });
	const shapeB = $derived(against === 'box' ? orientedBoxShape(boxB) : triangleShape(tri));
	const tests = $derived(
		separatingAxes3(
			orientedBoxShape(boxA),
			shapeB,
			against === 'box' ? ['A', 'B'] : ['the box', 'the triangle']
		)
	);
	const first = $derived(tests.findIndex((test) => test.gap));
	const hit = $derived(first < 0);
	const centreB = $derived(against === 'box' ? B.centre : scale(add(add(T[0], T[1]), T[2]), 1 / 3));

	// The first separating axis, drawn as a line through the middle of the two shapes, with each
	// shape's shadow on it, and the plane that fits in the gap.
	const shown = $derived.by(() => {
		if (hit) return null;
		const { axis, shadowA, shadowB } = tests[first];
		const middle = midpoint(A.centre, centreB);
		const size = length(axis);
		const at = (value: number) =>
			add(middle, scale(normalize(axis), (value - dot(middle, axis)) / size));
		const low = Math.min(shadowA[0], shadowB[0]);
		const high = Math.max(shadowA[1], shadowB[1]);
		const pad = 0.6 * size;
		const gap =
			shadowA[1] < shadowB[0] ? (shadowA[1] + shadowB[0]) / 2 : (shadowB[1] + shadowA[0]) / 2;
		return {
			line: [at(low - pad), at(high + pad)],
			a: [at(shadowA[0]), at(shadowA[1])],
			b: [at(shadowB[0]), at(shadowB[1])],
			plane: planeAt(at(gap), axis),
			wall: at(gap)
		};
	});

	const ordinal = (n: number) =>
		`${n}${n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th'}`;
	const readout = $derived(
		hit
			? `No gap on any of the ${tests.length} axes → collision`
			: `The first gap is on ${tests[first].from}, the ${ordinal(first + 1)} of ${tests.length} axes to try → apart`
	);

	const inkA = $derived(hit ? INKS.ember : '#45d16b');
	const inkB = $derived(hit ? INKS.ember : INKS.orange);
	const layers = $derived(
		view.byDepth(
			[
				{ name: 'A', at: A.centre },
				{ name: 'B', at: centreB },
				...(shown ? [{ name: 'wall', at: shown.wall }] : [])
			],
			(layer) => layer.at
		)
	);
	const slider = 'w-24 accent-[#ff5640] align-middle';
</script>

<Scene
	{view}
	bind:camera
	label="Two convex shapes: a turned box A and {against === 'box'
		? 'a turned box B'
		: 'a triangle'}, with the first separating axis the test finds. Drag the shapes, turn them with the sliders, or drag the background to turn the view."
	caption="Drag the {against === 'box'
		? 'boxes'
		: 'box or the triangle’s corners'} and turn them with the sliders. Drag the background to turn the view."
	{readout}
>
	{#snippet settings()}
		<label
			>{against === 'box' ? 'A' : 'Box'} turns
			<input type="range" min="-180" max="180" bind:value={A.yaw} class={slider} /></label
		>
		<label
			>{against === 'box' ? 'A' : 'Box'} tilts
			<input type="range" min="-90" max="90" bind:value={A.tilt} class={slider} /></label
		>
		{#if against === 'box'}
			<label
				>B turns <input
					type="range"
					min="-180"
					max="180"
					bind:value={B.yaw}
					class={slider}
				/></label
			>
			<label
				>B tilts <input type="range" min="-90" max="90" bind:value={B.tilt} class={slider} /></label
			>
		{/if}
	{/snippet}

	{#each layers as layer (layer.name)}
		{#if layer.name === 'A'}
			<Handle {view} get={() => A.centre} set={(p) => (A.centre = place(p))} label="Box A">
				<Block {view} oriented={boxA} color={inkA} />
			</Handle>
		{:else if layer.name === 'B'}
			{#if against === 'box'}
				<Handle {view} get={() => B.centre} set={(p) => (B.centre = place(p))} label="Box B">
					<Block {view} oriented={boxB} color={inkB} />
				</Handle>
			{:else}
				<path
					d={view.path(T, true)}
					fill={inkB}
					fill-opacity="0.2"
					stroke={inkB}
					stroke-width="2.5"
					stroke-linejoin="round"
					pointer-events="none"
				/>
			{/if}
		{:else if shown}
			<Sheet {view} plane={shown.plane} near={shown.wall} size={1.2} color="#e2e8f0" />
		{/if}
	{/each}

	{#if shown}
		<g pointer-events="none">
			<path d={view.path(shown.line)} stroke="#e2e8f0" stroke-width="1.5" stroke-dasharray="6 5" />
			<path d={view.path(shown.a)} stroke="#45d16b" stroke-width="6" />
			<path d={view.path(shown.b)} stroke={INKS.orange} stroke-width="6" />
		</g>
	{/if}

	{#if against === 'triangle'}
		{#each T as corner, i (i)}
			<Handle
				{view}
				get={() => T[i]}
				set={(p) => (T[i] = place(p))}
				label="Corner {i + 1} of the triangle"
			>
				<Mark {view} p={corner} color="#e2e8f0" r={5} grab />
			</Handle>
		{/each}
	{/if}
</Scene>
