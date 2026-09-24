<!--
	A point in a 3D figure: a dot, its label, and a dashed line straight down to the floor, which
	is what tells you how high it is and where it stands.
-->
<script lang="ts">
	import type { Vec3 } from './space';
	import { circle, type View } from './view';

	type Props = {
		view: View;
		p: Vec3;
		color: string;
		label?: string;
		/** A subscript for the label: S₁ is label 'S', sub '1'. */
		sub?: string;
		/** Where the label sits, from the dot. */
		dx?: number;
		dy?: number;
		r?: number;
		drop?: boolean;
		/** A bigger invisible target around the dot, for dragging. */
		grab?: boolean;
	};
	let {
		view,
		p,
		color,
		label,
		sub,
		dx = 10,
		dy = -12,
		r = 6,
		drop = true,
		grab = false
	}: Props = $props();

	const at = $derived(view.project(p));
	const floor = $derived({ x: p.x, y: 0, z: p.z });
</script>

{#if drop && p.y > 0.02}
	<g pointer-events="none">
		<path d={view.path([p, floor])} stroke={color} stroke-opacity="0.45" stroke-dasharray="4 4" />
		<path
			d={view.path(circle(floor, 0.12, { x: 1, y: 0, z: 0 }, { x: 0, y: 0, z: 1 }, 16), true)}
			fill={color}
			fill-opacity="0.5"
		/>
	</g>
{/if}
{#if grab}
	<circle cx={at.x} cy={at.y} r="20" fill="transparent" />
{/if}
<circle cx={at.x} cy={at.y} {r} fill={color} />
{#if label}
	<text x={at.x + dx} y={at.y + dy} class="math" fill={color}
		>{label}{#if sub}<tspan class="num" font-size="13" dy="5">{sub}</tspan>{/if}</text
	>
{/if}
