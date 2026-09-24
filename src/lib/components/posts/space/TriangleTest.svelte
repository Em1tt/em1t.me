<!--
	A triangle in space, from the chapter on triangles.
	- point: P is over the triangle when it's on the inner side of all three edges. Each edge turns
	  green when P is on its inner side, and Q is P dropped straight onto the triangle's plane;
	- ray: the ray meets the triangle's plane at H, and hits the triangle when H is inside it;
	- sphere: Q is the triangle's closest point to the centre S, on the face, an edge or a corner.
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
		add,
		along,
		clamp,
		closestPointOnPlane,
		closestPointOnTriangle,
		distanceSquared,
		edgeSides,
		length,
		planeThrough,
		pointInTriangle,
		rayPlane,
		rayTriangle,
		scale,
		segmentT,
		sphereTriangleCollide,
		subtract,
		triangleNormal,
		type Vec3
	} from './space';
	import { CAMERA, fixed, keep, makeView } from './view';

	type Against = 'point' | 'ray' | 'sphere';
	let { against }: { against: Against } = $props();

	let camera = $state(CAMERA);
	const view = $derived(makeView(camera));

	const R = 0.8;
	let A = $state({ x: -2, y: 0.6, z: 1.2 });
	let B = $state({ x: 1.8, y: 0.9, z: 1.4 });
	let C = $state({ x: 0.2, y: 2.2, z: -1.6 });
	let P = $state(
		untrack(() =>
			against === 'point'
				? { x: 0.4, y: 2.6, z: 0.4 }
				: against === 'sphere'
					? { x: 1.8, y: 2.4, z: -0.6 }
					: { x: -2.4, y: 2.8, z: 2 }
		)
	);
	let T = $state({ x: -1.4, y: 2.2, z: 1.2 });
	const place = (p: Vec3) => keep(p, { x: -3, y: 0, z: -3 }, { x: 3, y: 3.2, z: 3 });

	const tri = $derived({ a: A, b: B, c: C });
	const flat = $derived(length(triangleNormal(tri)) < 1e-9);
	const plane = $derived(planeThrough(A, B, C));
	const centroid = $derived(scale(add(add(A, B), C), 1 / 3));

	// Point.
	const sides = $derived(edgeSides(P, tri));
	const over = $derived(!flat && pointInTriangle(P, tri));
	const foot = $derived(flat ? P : closestPointOnPlane(P, plane));

	// Ray.
	const d = $derived(subtract(T, P));
	const planeT = $derived(flat ? null : rayPlane(P, d, plane));
	const H = $derived(planeT === null ? null : along(P, d, planeT));
	const rayT = $derived(flat ? null : rayTriangle(P, d, tri));

	// Sphere.
	const Q = $derived(closestPointOnTriangle(P, tri));
	const touches = $derived(sphereTriangleCollide({ ...P, r: R }, tri));
	const where = $derived.by(() => {
		if (!flat && pointInTriangle(P, tri)) return 'on the face';
		const edges = [
			['A', 'B', A, B],
			['B', 'C', B, C],
			['C', 'A', C, A]
		] as const;
		const [from, to, a, b] = edges.reduce((best, edge) =>
			distanceSquared(Q, closestOnEdge(edge)) < distanceSquared(Q, closestOnEdge(best))
				? edge
				: best
		);
		const t = clamp(segmentT(P, a, b), 0, 1);
		return t === 0 ? `at corner ${from}` : t === 1 ? `at corner ${to}` : `on edge ${from}${to}`;
	});
	function closestOnEdge(edge: readonly [string, string, Vec3, Vec3]) {
		return along(edge[2], subtract(edge[3], edge[2]), clamp(segmentT(P, edge[2], edge[3]), 0, 1));
	}

	const hit = $derived(against === 'point' ? over : against === 'ray' ? rayT !== null : touches);
	const ink = $derived(hit ? INKS.ember : INKS.orange);
	const names = ['AB', 'BC', 'CA'];
	const readout = $derived.by(() => {
		if (flat) return 'A, B and C are on one line: that’s no triangle, and nothing can hit it';
		if (against === 'point') {
			const parts = sides.map(
				(value, i) => `${names[i]}: ${fixed(value, 1)} ${value >= 0 ? '≥' : '<'} 0`
			);
			return `${parts.join(' · ')} → ${over ? 'P is over the triangle' : 'P is off to one side'}`;
		}
		if (against === 'ray') {
			if (!length(d)) return 'O and T are the same point, so the ray has no direction';
			if (planeT === null) return 'the ray never meets the triangle’s plane → miss';
			return `the ray meets the plane at t = ${fixed(planeT, 2)}, ${rayT !== null ? 'inside the triangle → hit' : 'outside the triangle → miss'}`;
		}
		return `Q is ${where} · |SQ|² = ${fixed(distanceSquared(Q, P), 2)} ${touches ? '≤' : '>'} r² = ${fixed(R ** 2, 2)} → ${touches ? 'collision' : 'apart'}`;
	});

	const corners = [
		{ name: 'A', get: () => A, set: (p: Vec3) => (A = place(p)) },
		{ name: 'B', get: () => B, set: (p: Vec3) => (B = place(p)) },
		{ name: 'C', get: () => C, set: (p: Vec3) => (C = place(p)) }
	];
	const edgeColor = (i: number) =>
		against === 'point' ? (sides[i] >= 0 ? '#45d16b' : INKS.orange) : ink;
	const layers = $derived(
		view.byDepth(
			[
				{ name: 'triangle', at: against === 'sphere' ? Q : centroid },
				{ name: 'sphere', at: P }
			],
			(layer) => layer.at
		)
	);
	const labels: Record<Against, string> = {
		point: 'A triangle ABC and a point P above or below it',
		ray: 'A triangle ABC, its plane, and a ray from O through T',
		sphere:
			'A triangle ABC and a sphere with centre S, with Q, the point of the triangle closest to S'
	};
</script>

<Scene
	{view}
	bind:camera
	label="{labels[against]}. Drag the points, or drag the background to turn the view."
	caption="Drag {against === 'point'
		? 'A, B, C or P'
		: against === 'ray'
			? 'A, B, C, O or T'
			: 'A, B, C or the sphere'}. Drag the background to turn the view."
	{readout}
>
	{#if against === 'ray' && !flat}
		<Sheet {view} {plane} near={centroid} size={2.4} color="#94a3b8" />
	{/if}

	{#each layers as layer (layer.name)}
		{#if layer.name === 'triangle'}
			<g pointer-events="none">
				<path
					d={view.path([A, B, C], true)}
					fill={hit ? INKS.ember : '#e2e8f0'}
					fill-opacity={hit ? 0.22 : 0.1}
				/>
				{#each [A, B, C] as from, i (i)}
					<path
						d={view.path([from, [B, C, A][i]])}
						stroke={edgeColor(i)}
						stroke-width="2.5"
						stroke-linejoin="round"
					/>
				{/each}
			</g>
		{:else if against === 'sphere'}
			<Handle {view} get={() => P} set={(p) => (P = place(p))} label="The sphere">
				<Ball {view} centre={P} r={R} color={touches ? INKS.ember : '#45d16b'} />
			</Handle>
		{/if}
	{/each}

	<g pointer-events="none">
		{#if against === 'point' && !flat}
			<path d={view.path([P, foot])} stroke="#e2e8f0" stroke-width="1.5" stroke-dasharray="6 5" />
			<Mark {view} p={foot} color="#e2e8f0" r={4} label="Q" dx={10} dy={18} drop={false} />
		{/if}
		{#if against === 'ray' && length(d)}
			{@const end = along(P, d, 9 / length(d))}
			<path
				d={view.path([H ?? end, end])}
				stroke={ink}
				stroke-width="1.5"
				stroke-opacity="0.5"
				stroke-dasharray="6 5"
			/>
			<path d={view.path([P, rayT !== null && H ? H : end])} stroke={ink} stroke-width="3" />
			{#if H}
				<circle
					cx={view.project(H).x}
					cy={view.project(H).y}
					r="6"
					fill={rayT !== null ? '#f1f5f9' : 'none'}
					stroke="#f1f5f9"
					stroke-width="1.5"
				/>
				<text x={view.project(H).x + 10} y={view.project(H).y + 22} class="math" fill="#f1f5f9"
					>H</text
				>
			{/if}
		{/if}
		{#if against === 'sphere'}
			<path d={view.path([P, Q])} stroke="#e2e8f0" stroke-width="1.5" stroke-dasharray="6 5" />
			<Mark
				{view}
				p={P}
				color={touches ? INKS.ember : '#45d16b'}
				r={5}
				label="S"
				dx={10}
				dy={-10}
				drop={false}
			/>
			<Mark {view} p={Q} color="#f1f5f9" r={5} label="Q" dx={10} dy={20} drop={false} />
		{/if}
	</g>

	{#each corners as corner (corner.name)}
		<Handle {view} get={corner.get} set={corner.set} label="Corner {corner.name} of the triangle">
			<Mark {view} p={corner.get()} color="#e2e8f0" r={5} label={corner.name} grab />
		</Handle>
	{/each}
	{#if against === 'point'}
		<Handle {view} get={() => P} set={(p) => (P = place(p))} label="Point P">
			<Mark {view} p={P} color={over ? INKS.ember : '#f1f5f9'} label="P" grab />
		</Handle>
	{/if}
	{#if against === 'ray'}
		<Handle {view} get={() => P} set={(p) => (P = place(p))} label="Point O, where the ray starts">
			<Mark {view} p={P} color="#f1f5f9" label="O" grab />
		</Handle>
		<Handle
			{view}
			get={() => T}
			set={(p) => (T = place(p))}
			label="Point T, which the ray aims through"
		>
			<Mark {view} p={T} color={ink} r={5} label="T" grab />
		</Handle>
	{/if}
</Scene>
