<!--
	A box in a 3D figure, as in a textbook: the faces turned towards you shaded, the edges hidden
	behind the box dashed, and, for a box along the axes, its footprint on the floor below it.
	Give it `box` for an axis-aligned box, or `oriented` for a turned one.
-->
<script lang="ts">
	import { add, scale, type Box, type OrientedBox, type Vec3 } from './space';
	import type { View } from './view';

	type Props = { view: View; box?: Box; oriented?: OrientedBox; color: string; shadow?: boolean };
	let { view, box, oriented, color, shadow = true }: Props = $props();

	const X = { x: 1, y: 0, z: 0 };
	const Y = { x: 0, y: 1, z: 0 };
	const Z = { x: 0, y: 0, z: 1 };
	// Both kinds as a centre, three axes and half-sizes.
	const frame = $derived(
		oriented ??
			({
				centre: { x: box!.x + box!.w / 2, y: box!.y + box!.h / 2, z: box!.z + box!.d / 2 },
				axes: [X, Y, Z],
				half: [box!.w / 2, box!.h / 2, box!.d / 2]
			} satisfies OrientedBox)
	);
	// Corner i is on the far side along the box's first axis when bit 1 is set, second axis for
	// bit 2, third for bit 4.
	const corners = $derived(
		Array.from({ length: 8 }, (_, i) =>
			[1, 2, 4].reduce(
				(p, bit, k) => add(p, scale(frame.axes[k], (i & bit ? 1 : -1) * frame.half[k])),
				frame.centre
			)
		)
	);
	const normal = (bit: number, far: boolean): Vec3 =>
		scale(frame.axes[[1, 2, 4].indexOf(bit)], far ? 1 : -1);
	const FACES = [
		{ bit: 1, far: false, corners: [0, 4, 6, 2] },
		{ bit: 1, far: true, corners: [1, 3, 7, 5] },
		{ bit: 2, far: false, corners: [0, 1, 5, 4] },
		{ bit: 2, far: true, corners: [2, 6, 7, 3] },
		{ bit: 4, far: false, corners: [0, 2, 3, 1] },
		{ bit: 4, far: true, corners: [4, 5, 7, 6] }
	];
	// Every edge joins two corners one bit apart, between the faces of the other two bits.
	const EDGES = [0, 1, 2, 3, 4, 5, 6, 7].flatMap((i) =>
		[1, 2, 4]
			.filter((bit) => !(i & bit))
			.map((bit) => ({
				from: i,
				to: i | bit,
				faces: [1, 2, 4]
					.filter((other) => other !== bit)
					.map((other) => [other, !!(i & other)] as const)
			}))
	);

	const faces = $derived(
		FACES.filter((face) => view.facing(normal(face.bit, face.far))).map((face) => ({
			d: view.path(
				face.corners.map((i) => corners[i]),
				true
			),
			top: normal(face.bit, face.far).y > 0.7
		}))
	);
	const edges = $derived(
		EDGES.map((edge) => ({
			d: view.path([corners[edge.from], corners[edge.to]]),
			seen: edge.faces.some(([bit, far]) => view.facing(normal(bit, far)))
		}))
	);
	const footprint = $derived(
		box
			? view.path(
					[0, 1, 5, 4].map((i) => ({ ...corners[i], y: 0 })),
					true
				)
			: ''
	);
</script>

{#if shadow && box && box.y > 0.02}
	<path
		d={footprint}
		fill="rgb(148 163 184 / 0.07)"
		stroke="rgb(148 163 184 / 0.3)"
		stroke-dasharray="4 4"
		pointer-events="none"
	/>
{:else if shadow && oriented && oriented.centre.y > 0.02}
	<path
		d={view.path([oriented.centre, { ...oriented.centre, y: 0 }])}
		stroke="rgb(148 163 184 / 0.45)"
		stroke-dasharray="4 4"
		pointer-events="none"
	/>
{/if}
{#each edges.filter((edge) => !edge.seen) as edge, i (i)}
	<path d={edge.d} stroke={color} stroke-opacity="0.4" stroke-dasharray="3 5" />
{/each}
{#each faces as face, i (i)}
	<path d={face.d} fill={color} fill-opacity={face.top ? 0.2 : 0.1} />
{/each}
{#each edges.filter((edge) => edge.seen) as edge, i (i)}
	<path d={edge.d} stroke={color} stroke-width="2" stroke-linejoin="round" />
{/each}
