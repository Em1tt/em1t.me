<!--
	Circle vs line segment: project the centre onto the line through A and B (parameter t), clamp
	t into [0, 1] to stay on the segment, and test the closest point Q against the circle.
-->
<script lang="ts">
	import { INKS } from '$lib/halftone';
	import Dot from './Dot.svelte';
	import Stage from './Stage.svelte';
	import { draggable, within, type Point } from './drag';

	const W = 640;
	const H = 300;
	const R = 45;

	let A = $state({ x: 110, y: 210 });
	let B = $state({ x: 400, y: 90 });
	let C = $state({ x: 520, y: 170 });

	const d = $derived({ x: B.x - A.x, y: B.y - A.y });
	const lengthSquared = $derived(d.x * d.x + d.y * d.y || 1);
	const t = $derived(((C.x - A.x) * d.x + (C.y - A.y) * d.y) / lengthSquared);
	const clamped = $derived(Math.max(0, Math.min(1, t)));
	const foot = $derived({ x: A.x + t * d.x, y: A.y + t * d.y });
	const Q = $derived({ x: A.x + clamped * d.x, y: A.y + clamped * d.y });
	const dist = $derived(Math.round(Math.hypot(C.x - Q.x, C.y - Q.y)));
	const hit = $derived(dist <= R);
	const far = $derived({ x: d.x * 20, y: d.y * 20 });

	const ends: { name: string; get: () => Point; set: (p: Point) => void }[] = [
		{ name: 'A', get: () => A, set: (p) => (A = p) },
		{ name: 'B', get: () => B, set: (p) => (B = p) }
	];
</script>

<Stage
	height={H}
	interactive
	label="A line segment from A to B and a circle with centre C, with the centre's projection onto the line and the closest point Q on the segment. Drag A, B or the circle."
	caption="Drag A, B or the circle."
	readout="t = {t.toFixed(2)}{t === clamped ? '' : ` → clamped to ${clamped}`} · |CQ| = {dist} {hit
		? '≤'
		: '>'} r = {R} → {hit ? 'collision' : 'apart'}"
>
	<line
		x1={A.x - far.x}
		y1={A.y - far.y}
		x2={B.x + far.x}
		y2={B.y + far.y}
		stroke="rgb(148 163 184 / 0.3)"
		stroke-dasharray="3 6"
	/>
	<line
		x1={A.x}
		y1={A.y}
		x2={B.x}
		y2={B.y}
		stroke={hit ? INKS.ember : '#45d16b'}
		stroke-width="3"
	/>
	<circle
		cx={C.x}
		cy={C.y}
		r={R}
		fill={hit ? 'rgb(255 86 64 / 0.16)' : 'rgb(148 163 184 / 0.06)'}
		stroke={hit ? INKS.ember : INKS.orange}
		stroke-width="2"
		pointer-events="none"
	/>
	{#if t !== clamped}
		<line
			x1={C.x}
			y1={C.y}
			x2={foot.x}
			y2={foot.y}
			stroke="rgb(148 163 184 / 0.5)"
			stroke-dasharray="3 5"
		/>
		<circle cx={foot.x} cy={foot.y} r="5" fill="none" stroke="#94a3b8" stroke-width="1.5" />
	{/if}
	<line
		x1={C.x}
		y1={C.y}
		x2={Q.x}
		y2={Q.y}
		stroke="#e2e8f0"
		stroke-width="2"
		stroke-dasharray="6 5"
	/>
	<Dot x={Q.x} y={Q.y} r={5} color="#f1f5f9" />
	<text x={Q.x + 10} y={Q.y - 12} class="math" fill="#f1f5f9">Q</text>

	{#each ends as end (end.name)}
		<g
			class="handle"
			tabindex="0"
			role="button"
			aria-label="End {end.name} of the segment; drag or use the arrow keys"
			{@attach draggable(end.get, (point) => end.set(within(point, W, H, 12)))}
		>
			<circle cx={end.get().x} cy={end.get().y} r="22" fill="transparent" />
			<Dot x={end.get().x} y={end.get().y} color="#45d16b" />
			<text x={end.get().x - 12} y={end.get().y + 30} class="math" fill="#45d16b">{end.name}</text>
		</g>
	{/each}
	<g
		class="handle"
		tabindex="0"
		role="button"
		aria-label="Circle centre C; drag or use the arrow keys"
		{@attach draggable(
			() => C,
			(point) => (C = within(point, W, H, 16))
		)}
	>
		<circle cx={C.x} cy={C.y} r={R} fill="transparent" />
		<Dot x={C.x} y={C.y} color={INKS.orange} />
		<text x={C.x + 12} y={C.y + 26} class="math" fill={INKS.orange}>C</text>
	</g>
</Stage>
