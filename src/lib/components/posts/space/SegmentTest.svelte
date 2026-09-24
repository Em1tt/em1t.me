<!--
	Line segments in space, from the chapter on rays and segments.
	- sphere: project S onto the segment's line, clamp t into [0, 1] to get Q, the closest point of
	  the segment, then it's point vs sphere. When t leaves [0, 1], the hollow dot is where the
	  projection lands on the whole line;
	- plane: the ends are on opposite sides when their side values have opposite signs, and the
	  segment crosses the plane at t = side(A) / (side(A) − side(B)). The part behind the plane,
	  seen from where you're looking, is dashed.
-->
<script lang="ts">
	import { untrack } from 'svelte';
	import { INKS } from '$lib/halftone';
	import Ball from './Ball.svelte';
	import Handle from './Handle.svelte';
	import Mark from './Mark.svelte';
	import Scene from './Scene.svelte';
	import Sheet from './Sheet.svelte';
	import {
		along,
		clamp,
		distanceSquared,
		dot,
		normalOf,
		segmentPlane,
		segmentT,
		side,
		sphereSegmentCollide,
		subtract,
		type Vec3
	} from './space';
	import { CAMERA, fixed, keep, makeView, RAMP } from './view';

	let { against }: { against: 'sphere' | 'plane' } = $props();

	let camera = $state(CAMERA);
	const view = $derived(makeView(camera));

	const R = 0.9;
	const plane = RAMP;
	// For the plane, the segment starts out crossing it.
	let A = $state(
		untrack(() => (against === 'plane' ? { x: -2.2, y: 2.4, z: 0.8 } : { x: -2.2, y: 2.2, z: 0.6 }))
	);
	let B = $state(
		untrack(() => (against === 'plane' ? { x: 1.8, y: 0.3, z: -0.2 } : { x: 1.6, y: 0.8, z: 0.2 }))
	);
	let S = $state({ x: 1.4, y: 2.4, z: -0.9 });
	const place = (p: Vec3) => keep(p, { x: -3, y: 0, z: -3 }, { x: 3, y: 3.2, z: 3 });

	// Sphere vs segment.
	const t = $derived(segmentT(S, A, B));
	const onLine = $derived(along(A, subtract(B, A), t));
	const Q = $derived(along(A, subtract(B, A), clamp(t, 0, 1)));
	const touches = $derived(sphereSegmentCollide({ ...S, r: R }, A, B));

	// Segment vs plane.
	const sA = $derived(side(A, plane));
	const sB = $derived(side(B, plane));
	const X = $derived(segmentPlane(A, B, plane));
	// Which side of the plane you're looking from.
	const seen = $derived(Math.sign(dot(normalOf(plane), view.toward)));
	const behind = (s: number) => Math.sign(s) === -seen;
	const pieces = $derived(
		X
			? [
					{ from: A, to: X, back: behind(sA) },
					{ from: X, to: B, back: behind(sB) }
				]
			: [{ from: A, to: B, back: behind(sA) }]
	);

	const hit = $derived(against === 'sphere' ? touches : X !== null);
	const ink = $derived(hit ? INKS.ember : INKS.orange);
	const readout = $derived(
		against === 'sphere'
			? `t = ${fixed(t, 2)}${t < 0 || t > 1 ? ` → clamped to ${t < 0 ? 0 : 1}` : ' is in [0, 1]'} · |SQ|² = ${fixed(distanceSquared(Q, S), 2)} ${touches ? '≤' : '>'} r² = ${fixed(R ** 2, 2)} → ${touches ? 'collision' : 'apart'}`
			: `side(A) = ${fixed(sA, 2)} · side(B) = ${fixed(sB, 2)} → ${X ? `${sA * sB < 0 ? 'opposite signs' : 'an end on the plane'}: they meet at t = ${fixed(sA === sB ? 0 : sA / (sA - sB), 2)}` : 'the same sign: no crossing'}`
	);

	const ends = [
		{ name: 'A', get: () => A, set: (p: Vec3) => (A = place(p)) },
		{ name: 'B', get: () => B, set: (p: Vec3) => (B = place(p)) }
	];
	const sideColor = (s: number) => (s > 0 ? '#45d16b' : s < 0 ? INKS.orange : '#f1f5f9');
</script>

<Scene
	{view}
	bind:camera
	label={against === 'sphere'
		? 'A line segment AB and a sphere with centre S, with Q, the point of the segment closest to S. Drag the ends, the sphere, or the background to turn the view.'
		: 'A tilted plane and a line segment AB that may cross it. Drag the ends, or drag the background to turn the view.'}
	caption="Drag A, B{against === 'sphere'
		? ' or the sphere'
		: ''}. Drag the background to turn the view."
	{readout}
>
	{#if against === 'plane'}
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
		<g pointer-events="none">
			{#each pieces as piece, i (i)}
				<path
					d={view.path([piece.from, piece.to])}
					stroke={ink}
					stroke-width={piece.back ? 2 : 3}
					stroke-opacity={piece.back ? 0.6 : 1}
					stroke-dasharray={piece.back ? '6 5' : undefined}
				/>
			{/each}
			{#if X}
				<Mark {view} p={X} color="#f1f5f9" r={5} label="X" dx={10} dy={20} drop={false} />
			{/if}
		</g>
	{:else}
		{#each view.byDepth([{ name: 'sphere', at: S }, { name: 'segment', at: Q }], (layer) => layer.at) as layer (layer.name)}
			{#if layer.name === 'sphere'}
				<Handle {view} get={() => S} set={(p) => (S = place(p))} label="The sphere">
					<Ball {view} centre={S} r={R} color={touches ? INKS.ember : '#45d16b'} />
				</Handle>
			{:else}
				<g pointer-events="none">
					{#if t < 0 || t > 1}
						<path
							d={view.path([t < 0 ? A : B, onLine])}
							stroke="#94a3b8"
							stroke-width="1.5"
							stroke-dasharray="3 5"
						/>
						<circle
							cx={view.project(onLine).x}
							cy={view.project(onLine).y}
							r="6"
							fill="none"
							stroke="#94a3b8"
							stroke-width="1.5"
						/>
					{/if}
					<path d={view.path([A, B])} stroke={ink} stroke-width="3" />
				</g>
			{/if}
		{/each}
		<g pointer-events="none">
			<path d={view.path([S, Q])} stroke="#e2e8f0" stroke-width="1.5" stroke-dasharray="6 5" />
			<Mark
				{view}
				p={S}
				color={touches ? INKS.ember : '#45d16b'}
				r={5}
				label="S"
				dx={10}
				dy={-10}
				drop={false}
			/>
			<Mark {view} p={Q} color="#f1f5f9" r={5} label="Q" dx={-22} dy={-10} drop={false} />
		</g>
	{/if}

	{#each ends as end (end.name)}
		<Handle {view} get={end.get} set={end.set} label="End {end.name} of the segment">
			<Mark
				{view}
				p={end.get()}
				color={against === 'plane' ? sideColor(end.name === 'A' ? sA : sB) : ink}
				label={end.name}
				grab
			/>
		</Handle>
	{/each}
</Scene>
