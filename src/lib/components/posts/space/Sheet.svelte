<!--
	A plane in a 3D figure. A plane goes on for ever, so this draws a square piece of it around
	the point of the plane closest to `near`, with a few grid lines, and the normal vector if it's
	given a label.
-->
<script lang="ts">
	import Arrow from './Arrow.svelte';
	import {
		add,
		closestPointOnPlane,
		normalOf,
		normalize,
		scale,
		type Plane,
		type Vec3
	} from './space';
	import { across, type View } from './view';

	type Props = {
		view: View;
		plane: Plane;
		near: Vec3;
		/** Half the side of the square. */
		size?: number;
		color: string;
		/** The normal vector's label; no label, no arrow. */
		normal?: string;
		normalColor?: string;
		/** Where the normal stands, from the middle (0, 0) towards the edges (±1, ±1). */
		normalAt?: [number, number];
	};
	let {
		view,
		plane,
		near,
		size = 2.6,
		color,
		normal,
		normalColor = color,
		normalAt = [0, 0]
	}: Props = $props();

	const centre = $derived(closestPointOnPlane(near, plane));
	const axes = $derived(across(normalOf(plane)));
	const at = (s: number, t: number) =>
		add(centre, add(scale(axes[0], s * size), scale(axes[1], t * size)));
	const corners = $derived([at(-1, -1), at(1, -1), at(1, 1), at(-1, 1)]);
	const grid = $derived(
		[-0.5, 0, 0.5].flatMap((k) => [
			view.path([at(k, -1), at(k, 1)]),
			view.path([at(-1, k), at(1, k)])
		])
	);
</script>

<g pointer-events="none">
	<path
		d={view.path(corners, true)}
		fill={color}
		fill-opacity="0.09"
		stroke={color}
		stroke-width="1.5"
	/>
	{#each grid as d, i (i)}
		<path {d} stroke={color} stroke-opacity="0.22" />
	{/each}
	{#if normal}
		<Arrow
			{view}
			from={at(...normalAt)}
			to={add(at(...normalAt), scale(normalize(normalOf(plane)), 1.1))}
			color={normalColor}
			label={normal}
			dx={-24}
			dy={6}
		/>
	{/if}
</g>
