<!--
	A ray from O through T, from the chapter on rays and segments. Its direction is d = T − O, so T
	is at t = 1. The ray is solid up to what it hits first and faint after it.
	- plane: t = −side(O) / (n · d), a hit when n · d isn't 0 and t ≥ 0;
	- sphere: the roots of (d · d)t² + 2(m · d)t + (m · m − r²) = 0, with m = O − S;
	- box: the slab method. The chart at the top shows the t-interval the ray spends inside each
	  pair of box faces, and the part all three share, which is where it's inside the box.
-->
<script lang="ts">
	import { untrack } from 'svelte';
	import { INKS } from '$lib/halftone';
	import Ball from './Ball.svelte';
	import Block from './Block.svelte';
	import Handle from './Handle.svelte';
	import Mark from './Mark.svelte';
	import Scene from './Scene.svelte';
	import Sheet from './Sheet.svelte';
	import {
		along,
		dot,
		length,
		normalOf,
		rayBoxSlabs,
		rayPlane,
		raySphere,
		raySphereRoots,
		side,
		subtract,
		type Box,
		type Vec3
	} from './space';
	import { CAMERA, FRAME, fixed, keep, makeView, RAMP } from './view';

	type Against = 'plane' | 'sphere' | 'box';
	let { against }: { against: Against } = $props();

	let camera = $state(CAMERA);
	// The box's figure is taller, for the chart of slabs above the scene.
	const frame = $derived(
		against === 'box' ? { ...FRAME, height: 400, target: { x: 0, y: 0.6, z: 0 } } : FRAME
	);
	const view = $derived(makeView(camera, frame));

	const R = 1;
	const plane = RAMP;
	const starts: Record<Against, [Vec3, Vec3]> = {
		plane: [
			{ x: -2.6, y: 2.6, z: 1.4 },
			{ x: -1.6, y: 1.6, z: 0.8 }
		],
		sphere: [
			{ x: -2.6, y: 2.6, z: 1.4 },
			{ x: -1.4, y: 2.2, z: 0.8 }
		],
		box: [
			{ x: -2.8, y: 2.2, z: 1.6 },
			{ x: -1.2, y: 1.9, z: 0.6 }
		]
	};
	let O = $state(untrack(() => starts[against][0]));
	let T = $state(untrack(() => starts[against][1]));
	let S = $state({ x: 1, y: 1.3, z: -0.4 });
	let box = $state<Box>({ x: 0.2, y: 0.4, z: -1.4, w: 1.6, h: 1.4, d: 1.4 });
	const place = (p: Vec3) => keep(p, { x: -3, y: 0, z: -3 }, { x: 3, y: 3.2, z: 3 });
	const move = (p: Vec3): Box => ({
		...box,
		...keep(p, { x: -3, y: 0, z: -3 }, { x: 3 - box.w, y: 3.2 - box.h, z: 3 - box.d })
	});

	const d = $derived(subtract(T, O));
	// Where the drawn ray stops: far enough to leave the scene.
	const reach = $derived(length(d) ? 9 / length(d) : 0);

	const planeT = $derived(rayPlane(O, d, plane));
	const roots = $derived(raySphereRoots(O, d, { ...S, r: R }));
	const sphereT = $derived(raySphere(O, d, { ...S, r: R }));
	const slabs = $derived(rayBoxSlabs(O, d, box));

	// Every place the ray crosses the shape's surface, and the first hit.
	const hitT = $derived(
		against === 'plane' ? planeT : against === 'sphere' ? sphereT : (slabs.hit?.[0] ?? null)
	);
	const crossings = $derived.by(() => {
		if (against === 'plane') return planeT === null ? [] : [planeT];
		if (against === 'sphere') return roots ? roots.filter((root) => root >= 0) : [];
		return slabs.hit ? slabs.hit.filter((value) => Number.isFinite(value) && value > 0) : [];
	});
	const hit = $derived(hitT !== null);
	const ink = $derived(hit ? INKS.ember : INKS.orange);
	const H = $derived(hitT === null ? null : along(O, d, hitT));

	const readout = $derived.by(() => {
		if (!length(d)) return 'O and T are the same point, so the ray has no direction';
		if (against === 'plane') {
			const facing = dot(normalOf(plane), d);
			if (facing === 0) return 'n · d = 0 → the ray runs parallel to the plane: no hit';
			const t = -side(O, plane) / facing;
			return `n · d = ${fixed(facing, 2)} · t = −side(O) / (n · d) = ${fixed(t, 2)} → ${t >= 0 ? 'hit' : 'the plane is behind the ray: no hit'}`;
		}
		if (against === 'sphere') {
			const m = subtract(O, S);
			const b = dot(m, d);
			const c = dot(m, m) - R ** 2;
			if (c > 0 && b > 0) return 'c > 0 and b > 0 → O is outside and the ray points away: no hit';
			const discriminant = b * b - dot(d, d) * c;
			if (discriminant < 0)
				return `b² − ac = ${fixed(discriminant, 2)} < 0 → the line misses the sphere`;
			if (c <= 0) return 'c ≤ 0 → O is inside the sphere: hit at t = 0';
			return `b² − ac = ${fixed(discriminant, 2)} ≥ 0 → t = ${fixed(roots![0], 2)} and ${fixed(roots![1], 2)}: hit at t = ${fixed(sphereT!, 2)}`;
		}
		const names = ['x', 'y', 'z'];
		const parts = slabs.slabs.map((slab, i) =>
			slab
				? `${names[i]}: t ∈ [${Number.isFinite(slab[0]) ? fixed(slab[0], 2) : '−∞'}, ${Number.isFinite(slab[1]) ? fixed(slab[1], 2) : '∞'}]`
				: `${names[i]}: never inside`
		);
		return `${parts.join(' · ')} → ${slabs.hit ? `enters at t = ${fixed(slabs.hit[0], 2)}, leaves at t = ${fixed(slabs.hit[1], 2)}` : 'no t ≥ 0 is in all three: no hit'}`;
	});

	// The chart of slabs: t from 0 to 4 across the top left of the figure.
	const CHART = { left: 44, right: 284, top: 24, row: 21, max: 4 };
	const tx = (t: number) =>
		CHART.left + (Math.min(Math.max(t, 0), CHART.max) / CHART.max) * (CHART.right - CHART.left);

	const points = [
		{ name: 'O', get: () => O, set: (p: Vec3) => (O = place(p)) },
		{ name: 'T', get: () => T, set: (p: Vec3) => (T = place(p)) }
	];
</script>

<Scene
	{view}
	bind:camera
	label="A ray from O through T, and a {against}. Drag O, T{against === 'plane'
		? ''
		: ` or the ${against}`}, or drag the background to turn the view."
	caption="Drag O, T{against === 'plane'
		? ''
		: ` or the ${against}`}. Drag the background to turn the view."
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
	{:else}
		<Handle
			{view}
			get={() => (against === 'sphere' ? S : box)}
			set={(p) => (against === 'sphere' ? (S = place(p)) : (box = move(p)))}
			label="The {against}"
		>
			{#if against === 'sphere'}
				<Ball {view} centre={S} r={R} color={hit ? INKS.ember : '#45d16b'} />
			{:else}
				<Block {view} {box} color={hit ? INKS.ember : '#45d16b'} />
			{/if}
		</Handle>
	{/if}

	<g pointer-events="none">
		{#if length(d)}
			<path
				d={view.path([H ?? along(O, d, reach), along(O, d, reach)])}
				stroke={ink}
				stroke-width="1.5"
				stroke-opacity="0.5"
				stroke-dasharray="6 5"
			/>
			<path d={view.path([O, H ?? along(O, d, reach)])} stroke={ink} stroke-width="3" />
		{/if}
		{#each crossings as t, i (i)}
			<Mark {view} p={along(O, d, t)} color="#f1f5f9" r={i === 0 && hit ? 6 : 4} drop={false} />
		{/each}
		{#if H}
			<text x={view.project(H).x + 10} y={view.project(H).y + 22} class="math" fill="#f1f5f9"
				>H</text
			>
		{/if}
		{#if against === 'sphere'}
			<Mark
				{view}
				p={S}
				color={hit ? INKS.ember : '#45d16b'}
				r={4}
				label="S"
				dx={10}
				dy={-8}
				drop={false}
			/>
		{/if}
	</g>

	{#each points as point (point.name)}
		<Handle {view} get={point.get} set={point.set} label="Point {point.name} of the ray">
			<Mark
				{view}
				p={point.get()}
				color={point.name === 'O' ? '#f1f5f9' : ink}
				r={point.name === 'O' ? 6 : 5}
				label={point.name}
				grab
			/>
		</Handle>
	{/each}

	{#if against === 'box'}
		<g pointer-events="none">
			{#if slabs.hit}
				<rect
					x={tx(slabs.hit[0])}
					y={CHART.top - 8}
					width={Math.max(tx(slabs.hit[1]) - tx(slabs.hit[0]), 2)}
					height={CHART.row * 3}
					fill="rgb(255 86 64 / 0.22)"
				/>
			{/if}
			{#each slabs.slabs as slab, i (i)}
				<text x={CHART.left - 14} y={CHART.top + i * CHART.row + 5} text-anchor="end" class="mono"
					>{['x', 'y', 'z'][i]}</text
				>
				<line
					x1={CHART.left}
					y1={CHART.top + i * CHART.row}
					x2={CHART.right}
					y2={CHART.top + i * CHART.row}
					stroke="rgb(148 163 184 / 0.25)"
				/>
				{#if slab && slab[1] >= 0 && slab[0] <= CHART.max}
					<line
						x1={tx(slab[0])}
						y1={CHART.top + i * CHART.row}
						x2={tx(slab[1])}
						y2={CHART.top + i * CHART.row}
						stroke="#cbd5e1"
						stroke-width="6"
					/>
				{/if}
			{/each}
			{#each [0, 1, 2, 3, 4] as tick (tick)}
				<text x={tx(tick)} y={CHART.top + CHART.row * 3 + 4} text-anchor="middle" class="mono"
					>{tick}</text
				>
			{/each}
			<text x={CHART.right + 12} y={CHART.top + CHART.row * 3 + 4} class="mono">t</text>
		</g>
	{/if}
</Scene>
