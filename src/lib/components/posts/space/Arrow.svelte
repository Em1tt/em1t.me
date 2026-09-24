<!-- A vector in a 3D figure: a line from `from` to `to` with an arrowhead, and an optional bold label. -->
<script lang="ts">
	import type { Vec3 } from './space';
	import { arrowhead, type View } from './view';

	type Props = {
		view: View;
		from: Vec3;
		to: Vec3;
		color: string;
		label?: string;
		dx?: number;
		dy?: number;
		width?: number;
	};
	let { view, from, to, color, label, dx = 8, dy = -8, width = 2.5 }: Props = $props();

	const tip = $derived(view.project(to));
</script>

<g pointer-events="none">
	<path d={view.path([from, to])} stroke={color} stroke-width={width} />
	<path d={arrowhead(view, from, to, 12)} fill={color} />
	{#if label}
		<text x={tip.x + dx} y={tip.y + dy} class="math" fill={color} font-weight="700">{label}</text>
	{/if}
</g>
