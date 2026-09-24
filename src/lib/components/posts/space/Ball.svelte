<!--
	A sphere in a 3D figure: a shaded disc with its equator, the front half solid and the back half
	dashed, and its footprint on the floor straight below it.
-->
<script lang="ts">
	import type { Vec3 } from './space';
	import { circle, type View } from './view';

	type Props = { view: View; centre: Vec3; r: number; color: string; shadow?: boolean };
	let { view, centre, r, color, shadow = true }: Props = $props();

	const id = $props.id();
	const X = { x: 1, y: 0, z: 0 };
	const Z = { x: 0, y: 0, z: 1 };
	const c = $derived(view.project(centre));
	const floor = $derived({ x: centre.x, y: 0, z: centre.z });

	// The equator's front half faces the viewer: angles within 90° of the view direction.
	const equator = $derived.by(() => {
		const facing = Math.atan2(view.toward.z, view.toward.x);
		const arc = (from: number) =>
			Array.from({ length: 33 }, (_, i) => {
				const angle = from + (i / 32) * Math.PI;
				return {
					x: centre.x + r * Math.cos(angle),
					y: centre.y,
					z: centre.z + r * Math.sin(angle)
				};
			});
		return {
			front: view.path(arc(facing - Math.PI / 2)),
			back: view.path(arc(facing + Math.PI / 2))
		};
	});
</script>

<defs>
	<radialGradient id="{id}-shade" cx="0.36" cy="0.3" r="0.75">
		<stop offset="0" stop-color={color} stop-opacity="0.5" />
		<stop offset="0.65" stop-color={color} stop-opacity="0.14" />
		<stop offset="1" stop-color={color} stop-opacity="0.06" />
	</radialGradient>
</defs>
{#if shadow}
	<g pointer-events="none">
		<path
			d={view.path(circle(floor, r, X, Z), true)}
			fill="rgb(148 163 184 / 0.07)"
			stroke="rgb(148 163 184 / 0.3)"
			stroke-dasharray="4 4"
		/>
		{#if centre.y > 0.02}
			<path
				d={view.path([centre, floor])}
				stroke="rgb(148 163 184 / 0.45)"
				stroke-dasharray="4 4"
			/>
		{/if}
	</g>
{/if}
<circle cx={c.x} cy={c.y} r={r * view.scale} fill="url(#{id}-shade)" />
<path d={equator.back} fill="none" stroke={color} stroke-opacity="0.35" stroke-dasharray="3 5" />
<path d={equator.front} fill="none" stroke={color} stroke-opacity="0.55" />
<circle cx={c.x} cy={c.y} r={r * view.scale} fill="none" stroke={color} stroke-width="2" />
