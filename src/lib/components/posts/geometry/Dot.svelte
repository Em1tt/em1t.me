<!-- A point drawn as a small halftone sphere, like the points in the canvas demos. -->
<script lang="ts">
	import { halftoneDots } from '$lib/halftone';

	let {
		x,
		y,
		r = 10,
		color,
		pitch = 4
	}: { x: number; y: number; r?: number; color: string; pitch?: number } = $props();

	const dots = $derived(halftoneDots(x, y, r, pitch));
</script>

<g fill={color}>
	{#each dots as dot, i (i)}
		<circle cx={dot.cx} cy={dot.cy} r={dot.r} />
	{/each}
</g>
