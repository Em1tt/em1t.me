<!-- A point in a figure: a plain filled circle. Figures in posts are never dithered. -->
<script lang="ts">
	let { x, y, r = 7, color }: { x: number; y: number; r?: number; color: string } = $props();
</script>

<circle cx={x} cy={y} {r} fill={color} />
