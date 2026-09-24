<!--
	Splitting a flat polygon in space into triangles, from the chapter on polygons into triangles.
	The polygon lies in a tilted plane, and its corners drag within it.
	- fan: triangles from corner 1 to every pair of neighbours after it. A triangle that doesn't
	  lie inside the polygon, which happens once it's concave, is marked red;
	- ears: ear clipping, one ear at a time with the buttons. Hollow corners point inwards, and
	  can't be ears.
-->
<script lang="ts">
	import { untrack } from 'svelte';
	import { INKS } from '$lib/halftone';
	import Arrow from './Arrow.svelte';
	import Handle from './Handle.svelte';
	import Mark from './Mark.svelte';
	import Scene from './Scene.svelte';
	import {
		add,
		dot,
		earClipSteps,
		fan,
		isConvexCorner,
		normalize,
		polygonNormal,
		scale,
		subtract,
		type Vec3
	} from './space';
	import { across, CAMERA, makeView } from './view';

	let { method }: { method: 'fan' | 'ears' } = $props();

	let camera = $state(CAMERA);
	const view = $derived(makeView(camera));

	// The plane the polygon lies in, and two directions along it: corners are kept as (u, v).
	const ORIGIN = { x: 0, y: 0.8, z: 0 };
	const NORMAL = normalize({ x: -0.3, y: 1, z: 0.55 });
	const [U, V] = across(NORMAL);
	type Flat = [number, number];
	const toSpace = ([u, v]: Flat) => add(ORIGIN, add(scale(U, u), scale(V, v)));
	const toFlat = (p: Vec3): Flat => {
		const q = subtract(p, ORIGIN);
		const fit = (n: number) => Math.min(2.8, Math.max(-2.8, n));
		return [fit(dot(q, U)), fit(dot(q, V))];
	};
	const HEXAGON: Flat[] = [
		[-2.2, -1.2],
		[0, -2.2],
		[2.2, -1.2],
		[2.2, 1.2],
		[0, 2.2],
		[-2.2, 1.2]
	];
	const NOTCHED: Flat[] = [
		[-2.2, -1.8],
		[2.2, -1.8],
		[2.2, 1.8],
		[1, 1.8],
		[1, -0.6],
		[-1, -0.6],
		[-1, 1.8],
		[-2.2, 1.8]
	];
	let corners = $state<Flat[]>(
		untrack(() => (method === 'fan' ? HEXAGON : NOTCHED).map((c) => [...c] as Flat))
	);
	const polygon = $derived(corners.map(toSpace));
	const normal = $derived(polygonNormal(polygon));
	const middle = $derived(scale(polygon.reduce(add), 1 / polygon.length));
	const count = $derived(corners.length);

	// Flat geometry, for telling whether a fan triangle lies inside the polygon.
	const cross2 = (o: Flat, a: Flat, b: Flat) =>
		(a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
	const crosses = (a: Flat, b: Flat, c: Flat, d: Flat) =>
		cross2(a, b, c) * cross2(a, b, d) < 0 && cross2(c, d, a) * cross2(c, d, b) < 0;
	const inside = (p: Flat) => {
		let odd = false;
		corners.forEach((a, i) => {
			const b = corners[(i + 1) % count];
			if (
				a[1] > p[1] !== b[1] > p[1] &&
				p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]
			)
				odd = !odd;
		});
		return odd;
	};
	const diagonalInside = (i: number, j: number) => {
		if ((i + 1) % count === j || (j + 1) % count === i) return true;
		const [a, b] = [corners[i], corners[j]];
		const cut = corners.some((c, k) => crosses(a, b, c, corners[(k + 1) % count]));
		return !cut && inside([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]);
	};
	const fanTriangles = $derived(
		fan(polygon).map((triangle, k) => {
			const [i, j] = [k + 1, k + 2];
			const turnsRight = cross2(corners[0], corners[i], corners[j]) > 0;
			return { triangle, outside: !turnsRight || !diagonalInside(0, i) || !diagonalInside(0, j) };
		})
	);
	const outsideCount = $derived(fanTriangles.filter((t) => t.outside).length);

	// Ear clipping.
	const steps = $derived(earClipSteps(polygon));
	const complete = $derived(steps.length === count - 2);
	let shown = $state(1);
	const step = $derived(Math.min(Math.max(shown, 1), steps.length));
	const removed = $derived(new Set(steps.slice(0, step).map((s) => s.corner)));
	const left = $derived(step >= count - 2 ? [] : polygon.filter((_, i) => !removed.has(i)));
	const inward = $derived(
		polygon.map(
			(p, i) =>
				!isConvexCorner(polygon[(i + count - 1) % count], p, polygon[(i + 1) % count], normal)
		)
	);

	const readout = $derived.by(() => {
		if (method === 'fan') {
			const made = `${count} corners → ${count - 2} triangles`;
			return outsideCount
				? `${made}, and ${outsideCount} of them ${outsideCount === 1 ? 'isn’t' : 'aren’t'} inside the polygon: this fan doesn’t work`
				: `${made}, all inside the polygon`;
		}
		if (!steps.length)
			return 'No ear anywhere: the outline crosses itself, and ear clipping needs a simple polygon';
		const current = steps[step - 1];
		if (step === count - 2)
			return `The last three corners make the last triangle: ${count} corners → ${count - 2} triangles`;
		const text = `Ear ${step}: corner ${current.corner + 1} turns the same way as the polygon, and no other corner is inside its triangle, so it’s cut off. ${count - step} corners are left.`;
		return complete || step < steps.length
			? text
			: `${text} Then there’s no ear left: the outline crosses itself, which ear clipping can’t handle`;
	});

	const tint = (k: number) => (k % 2 ? INKS.orange : '#45d16b');
	// Corner numbers sit just outside the polygon, away from its middle.
	const numberAt = (p: Vec3) => {
		const a = view.project(p);
		const m = view.project(middle);
		const length = Math.hypot(a.x - m.x, a.y - m.y) || 1;
		return { x: a.x + ((a.x - m.x) / length) * 18, y: a.y + ((a.y - m.y) / length) * 18 + 5 };
	};
	const button =
		'cursor-pointer bg-[#05030f] px-[0.6em] py-[0.35em] leading-none text-slate-300 hover:bg-[#a91a06] hover:text-white disabled:cursor-default disabled:opacity-40';
</script>

<Scene
	{view}
	bind:camera
	label="A flat polygon in space with {count} corners, split into triangles {method === 'fan'
		? 'as a fan from corner 1'
		: 'by ear clipping'}. Drag the corners, or drag the background to turn the view."
	caption="Drag the corners{method === 'ears'
		? ', and step through the ears with the buttons'
		: ''}. Drag the background to turn the view."
	{readout}
>
	{#snippet controls()}
		{#if method === 'ears'}
			<button
				type="button"
				class={button}
				aria-label="Previous ear"
				disabled={step <= 1}
				onclick={() => (shown = step - 1)}>◀</button
			>
			<span aria-live="polite">Ear {step} of {Math.max(steps.length, 1)}</span>
			<button
				type="button"
				class={button}
				aria-label="Next ear"
				disabled={step >= steps.length}
				onclick={() => (shown = step + 1)}>▶</button
			>
		{/if}
	{/snippet}

	<g pointer-events="none">
		<path d={view.path(polygon, true)} fill="#e2e8f0" fill-opacity="0.05" />
		{#if method === 'fan'}
			{#each fanTriangles as { triangle, outside }, k (k)}
				<path
					d={view.path([triangle.a, triangle.b, triangle.c], true)}
					fill={outside ? INKS.ember : tint(k)}
					fill-opacity={outside ? 0.3 : 0.16}
					stroke={outside ? INKS.ember : tint(k)}
					stroke-opacity="0.8"
					stroke-linejoin="round"
				/>
			{/each}
		{:else}
			{#each steps.slice(0, step) as { triangle }, k (k)}
				<path
					d={view.path([triangle.a, triangle.b, triangle.c], true)}
					fill={k === step - 1 ? INKS.ember : tint(k)}
					fill-opacity={k === step - 1 ? 0.35 : 0.16}
					stroke={k === step - 1 ? INKS.ember : tint(k)}
					stroke-width={k === step - 1 ? 2.5 : 1}
					stroke-opacity="0.85"
					stroke-linejoin="round"
				/>
			{/each}
			{#if left.length}
				<path
					d={view.path(left, true)}
					fill="none"
					stroke="#e2e8f0"
					stroke-opacity="0.5"
					stroke-dasharray="5 5"
				/>
			{/if}
		{/if}
		<path
			d={view.path(polygon, true)}
			fill="none"
			stroke="#e2e8f0"
			stroke-width="2"
			stroke-linejoin="round"
		/>
		<Arrow
			{view}
			from={middle}
			to={add(middle, scale(normalize(normal), 1.2))}
			color="#e2e8f0"
			label="N"
		/>
		{#each polygon as p, i (i)}
			<text x={numberAt(p).x} y={numberAt(p).y} text-anchor="middle" class="mono">{i + 1}</text>
		{/each}
	</g>

	{#each polygon as p, i (i)}
		<Handle
			{view}
			get={() => polygon[i]}
			set={(q) => (corners[i] = toFlat(q))}
			label="Corner {i + 1}"
		>
			{#if method === 'ears' && inward[i]}
				<circle cx={view.project(p).x} cy={view.project(p).y} r="20" fill="transparent" />
				<circle
					cx={view.project(p).x}
					cy={view.project(p).y}
					r="5.5"
					fill="#05030f"
					stroke="#e2e8f0"
					stroke-width="2"
				/>
			{:else}
				<Mark {view} {p} color="#e2e8f0" r={5} drop={false} grab />
			{/if}
		</Handle>
	{/each}
</Scene>
