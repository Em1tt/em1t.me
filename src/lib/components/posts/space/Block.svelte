<!--
	A box in a 3D figure, as in a textbook: the faces turned towards you shaded, the edges hidden
	behind the box dashed, and its footprint on the floor below it.
-->
<script lang="ts">
	import type { Box, Vec3 } from './space';
	import type { View } from './view';

	type Props = { view: View; box: Box; color: string; shadow?: boolean };
	let { view, box, color, shadow = true }: Props = $props();

	// Corner i has bit 1 set for the far end along x, 2 along y, 4 along z.
	const corners = $derived(
		Array.from({ length: 8 }, (_, i) => ({
			x: box.x + (i & 1 ? box.w : 0),
			y: box.y + (i & 2 ? box.h : 0),
			z: box.z + (i & 4 ? box.d : 0)
		}))
	);
	const normal = (bit: number, far: boolean): Vec3 => ({
		x: bit === 1 ? (far ? 1 : -1) : 0,
		y: bit === 2 ? (far ? 1 : -1) : 0,
		z: bit === 4 ? (far ? 1 : -1) : 0
	});
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
			top: face.bit === 2 && face.far
		}))
	);
	const edges = $derived(
		EDGES.map((edge) => ({
			d: view.path([corners[edge.from], corners[edge.to]]),
			seen: edge.faces.some(([bit, far]) => view.facing(normal(bit, far)))
		}))
	);
	const footprint = $derived(
		view.path(
			[0, 1, 5, 4].map((i) => ({ ...corners[i], y: 0 })),
			true
		)
	);
</script>

{#if shadow && box.y > 0.02}
	<path
		d={footprint}
		fill="rgb(148 163 184 / 0.07)"
		stroke="rgb(148 163 184 / 0.3)"
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
