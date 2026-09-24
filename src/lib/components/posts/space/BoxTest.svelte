<!--
	Axis-aligned boxes, from the chapter on boxes. A box is three intervals, one per axis:
	- point: P is inside when each of its coordinates is inside that axis's interval;
	- box: two boxes collide when their intervals overlap on x, on y and on z; each box's
	  intervals are drawn on the axes;
	- sphere: clamp the centre into the box to get the closest point Q, then it's point vs sphere.
-->
<script lang="ts">
	import { untrack } from 'svelte';
	import { INKS } from '$lib/halftone';
	import Ball from './Ball.svelte';
	import Block from './Block.svelte';
	import Handle from './Handle.svelte';
	import Mark from './Mark.svelte';
	import Scene from './Scene.svelte';
	import {
		boxCentre,
		boxesCollide,
		closestPointInBox,
		distanceSquared,
		overlap,
		pointInBox,
		sphereBoxCollide,
		type Box,
		type Vec3
	} from './space';
	import { CAMERA, fixed, keep, makeView } from './view';

	type Against = 'point' | 'box' | 'sphere';
	let { against }: { against: Against } = $props();

	let camera = $state(CAMERA);
	const view = $derived(makeView(camera));

	const R = 0.9;
	let A = $state<Box>({ x: -1.8, y: 0.2, z: -1.2, w: 2.2, h: 1.4, d: 1.6 });
	let B = $state<Box>({ x: -0.2, y: 0.8, z: 0.9, w: 1.6, h: 1.4, d: 1.2 });
	let other = $state(
		untrack(() => (against === 'point' ? { x: 1.2, y: 1.2, z: 0.9 } : { x: 1.6, y: 1.5, z: 1 }))
	);

	// A box moves by its corner, and stays inside the floor's square.
	const move = (box: Box, p: Vec3): Box => ({
		...box,
		...keep(p, { x: -3, y: 0, z: -3 }, { x: 3 - box.w, y: 3.2 - box.h, z: 3 - box.d })
	});
	const place = (p: Vec3) => keep(p, { x: -3, y: 0, z: -3 }, { x: 3, y: 3.2, z: 3 });

	const hit = $derived(
		against === 'point'
			? pointInBox(other, A)
			: against === 'box'
				? boxesCollide(A, B)
				: sphereBoxCollide({ ...other, r: R }, A)
	);
	const Q = $derived(closestPointInBox(other, A));

	const AXES = [
		{ axis: 'x', size: 'w' },
		{ axis: 'y', size: 'h' },
		{ axis: 'z', size: 'd' }
	] as const;
	const interval = (box: Box, axis: 'x' | 'y' | 'z', size: 'w' | 'h' | 'd') =>
		[box[axis], box[axis] + box[size]] as const;
	const show = ([from, to]: readonly [number, number]) => `[${fixed(from)}, ${fixed(to)}]`;

	const readout = $derived.by(() => {
		if (against === 'point') {
			const parts = AXES.map(({ axis, size }) => {
				const [from, to] = interval(A, axis, size);
				const inside = from <= other[axis] && other[axis] <= to;
				return `${axis} = ${fixed(other[axis])} ${inside ? '∈' : '∉'} ${show([from, to])}`;
			});
			return `${parts.join(' · ')} → ${hit ? 'inside' : 'outside'}`;
		}
		if (against === 'box') {
			const parts = AXES.map(({ axis, size }) => {
				const a = interval(A, axis, size);
				const b = interval(B, axis, size);
				return `${axis}: ${show(a)} and ${show(b)} ${overlap(a[0], a[1], b[0], b[1]) ? 'overlap' : 'don’t overlap'}`;
			});
			return `${parts.join(' · ')} → ${hit ? 'collision' : 'apart'}`;
		}
		const squared = distanceSquared(Q, other);
		return `Q = (${fixed(Q.x)}, ${fixed(Q.y)}, ${fixed(Q.z)}) · |SQ|² = ${fixed(squared, 2)} ${hit ? '≤' : '>'} r² = ${fixed(R ** 2, 2)} → ${hit ? 'collision' : 'apart'}`;
	});

	// Where each box's intervals are drawn: along each axis, a little to either side of it.
	const bars = $derived(
		(against === 'box' ? [A, B] : against === 'point' ? [A] : []).flatMap((box, i) => {
			const offset = i === 0 ? -0.14 : 0.14;
			const color = hit ? INKS.ember : i === 0 ? '#45d16b' : INKS.orange;
			return AXES.map(({ axis, size }) => {
				const [from, to] = interval(box, axis, size);
				const at = (value: number): Vec3 =>
					axis === 'x'
						? { x: value, y: 0, z: offset }
						: axis === 'y'
							? { x: offset, y: value, z: 0 }
							: { x: offset, y: 0, z: value };
				return { d: view.path([at(from), at(to)]), color };
			});
		})
	);

	type Shape = { name: string; get: () => Vec3; set: (p: Vec3) => void; at: () => Vec3 };
	const shapes: Shape[] = [
		{ name: 'A', get: () => A, set: (p) => (A = move(A, p)), at: () => boxCentre(A) },
		{ name: 'B', get: () => B, set: (p) => (B = move(B, p)), at: () => boxCentre(B) },
		{ name: 'other', get: () => other, set: (p) => (other = place(p)), at: () => other }
	];
	const present = $derived(
		shapes.filter((shape) => (against === 'box' ? shape.name !== 'other' : shape.name !== 'B'))
	);
	const color = (name: string) =>
		hit ? INKS.ember : name === 'A' ? '#45d16b' : name === 'B' ? INKS.orange : '#f1f5f9';
	const labels: Record<Against, string> = {
		point: 'An axis-aligned box and a point P',
		box: 'Two axis-aligned boxes A and B, with their intervals drawn on the x, y and z axes',
		sphere:
			'An axis-aligned box and a sphere with centre S, with Q, the point of the box closest to S'
	};
</script>

<Scene
	{view}
	bind:camera
	label="{labels[against]}. Drag them, or drag the background to turn the view."
	caption="Drag {against === 'box'
		? 'either box'
		: against === 'point'
			? 'the box or P'
			: 'the box or the sphere'}. Drag the background to turn the view."
	{readout}
>
	<g pointer-events="none" stroke-width="5">
		{#each bars as bar, i (i)}
			<path d={bar.d} stroke={bar.color} stroke-opacity="0.85" />
		{/each}
	</g>
	{#if against === 'point'}
		<!-- P's coordinates, marked on the axes next to the box's intervals. -->
		<g pointer-events="none">
			{#each [{ x: other.x, y: 0, z: 0 }, { x: 0, y: other.y, z: 0 }, { x: 0, y: 0, z: other.z }] as tick, i (i)}
				<Mark {view} p={tick} color="#f1f5f9" r={4} drop={false} />
			{/each}
		</g>
	{/if}

	{#each view.byDepth(present, (shape) => shape.at()) as shape (shape.name)}
		{#if shape.name === 'other'}
			<Handle
				{view}
				get={shape.get}
				set={shape.set}
				label={against === 'point' ? 'Point P' : 'The sphere'}
			>
				{#if against === 'point'}
					<Mark {view} p={other} color={color('other')} label="P" grab />
				{:else}
					<Ball {view} centre={other} r={R} color={hit ? INKS.ember : INKS.orange} />
				{/if}
			</Handle>
		{:else}
			<Handle {view} get={shape.get} set={shape.set} label="Box {shape.name}">
				<Block {view} box={shape.name === 'A' ? A : B} color={color(shape.name)} />
			</Handle>
		{/if}
	{/each}

	{#if against === 'sphere'}
		<g pointer-events="none">
			<path d={view.path([other, Q])} stroke="#e2e8f0" stroke-width="1.5" stroke-dasharray="6 5" />
			<Mark
				{view}
				p={other}
				color={hit ? INKS.ember : INKS.orange}
				r={5}
				label="S"
				dx={10}
				dy={24}
				drop={false}
			/>
			<Mark {view} p={Q} color="#f1f5f9" r={5} label="Q" dx={-24} dy={-10} drop={false} />
		</g>
	{/if}
</Scene>
