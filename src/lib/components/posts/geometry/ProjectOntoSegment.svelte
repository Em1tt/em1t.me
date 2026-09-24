<!--
	Projecting P onto the segment AB, in grid squares: t = (P − A)·d / (d·d) says where the
	projection lands on the whole line (0 at A, 1 at B), and clamping t keeps it on the segment.
-->
<script lang="ts">
	import { INKS } from '$lib/halftone';
	import Dot from './Dot.svelte';
	import Stage from './Stage.svelte';
	import { clamp } from './collide';
	import { draggable, snap, within, type Point } from './drag';
	import { num } from './format';

	const W = 640;
	const H = 300;
	const U = 30;

	let A = $state({ x: 3 * U, y: 7 * U });
	let B = $state({ x: 13 * U, y: 3 * U });
	let P = $state({ x: 17 * U, y: 7 * U });

	const u = (p: Point) => ({ x: Math.round(p.x / U), y: Math.round(p.y / U) });
	const a = $derived(u(A));
	const b = $derived(u(B));
	const p = $derived(u(P));
	const d = $derived({ x: b.x - a.x, y: b.y - a.y });
	const top = $derived((p.x - a.x) * d.x + (p.y - a.y) * d.y);
	const bottom = $derived(d.x * d.x + d.y * d.y);
	const t = $derived(bottom === 0 ? 0 : top / bottom);
	const clamped = $derived(clamp(t, 0, 1));
	const along = (s: number) => ({ x: A.x + s * (B.x - A.x), y: A.y + s * (B.y - A.y) });
	const foot = $derived(along(t));
	const Q = $derived(along(clamped));
	const far = $derived({ x: (B.x - A.x) * 20, y: (B.y - A.y) * 20 });
	// A short tick across the segment, for t = 0, ½ and 1.
	const normal = $derived.by(() => {
		const length = Math.hypot(B.x - A.x, B.y - A.y) || 1;
		return { x: -(B.y - A.y) / length, y: (B.x - A.x) / length };
	});
	const fmt = (n: number) => num(Math.round(n * 100) / 100);

	const handles: { name: string; color: string; get: () => Point; set: (q: Point) => void }[] = [
		{ name: 'A', color: '#45d16b', get: () => A, set: (q) => (A = q) },
		{ name: 'B', color: '#45d16b', get: () => B, set: (q) => (B = q) },
		{ name: 'P', color: INKS.ember, get: () => P, set: (q) => (P = q) }
	];
</script>

<Stage
	height={H}
	interactive
	label="A segment from A to B with marks at t = 0, one half and 1, a point P, its projection onto the whole line, and the closest point Q of the segment. Drag A, B or P."
	caption="Drag A, B or P; one square is one unit. Past either end, t leaves [0, 1] and gets clamped."
	readout={bottom === 0
		? 'A and B are the same point.'
		: `d = B − A = (${num(d.x)}, ${num(d.y)}) · t = (P − A)·d / (d·d) = ${top} / ${bottom} = ${fmt(t)}${t === clamped ? '' : ` → clamped to ${clamped}`} · Q = (${fmt(a.x + clamped * d.x)}, ${fmt(a.y + clamped * d.y)})`}
>
	<line
		x1={A.x - far.x}
		y1={A.y - far.y}
		x2={B.x + far.x}
		y2={B.y + far.y}
		stroke="rgb(148 163 184 / 0.35)"
		stroke-dasharray="3 6"
	/>
	<line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="#45d16b" stroke-width="3" />
	{#each [0, 0.5, 1] as s (s)}
		{@const mark = along(s)}
		<line
			x1={mark.x - normal.x * 8}
			y1={mark.y - normal.y * 8}
			x2={mark.x + normal.x * 8}
			y2={mark.y + normal.y * 8}
			stroke="#45d16b"
			stroke-width="2"
		/>
		<text
			x={mark.x - normal.x * 26}
			y={mark.y - normal.y * 26 + 5}
			text-anchor="middle"
			class="mono"
			fill="#45d16b">{s === 0.5 ? '½' : s}</text
		>
	{/each}

	{#if t !== clamped}
		<line
			x1={P.x}
			y1={P.y}
			x2={foot.x}
			y2={foot.y}
			stroke="rgb(148 163 184 / 0.6)"
			stroke-dasharray="3 5"
		/>
		<circle cx={foot.x} cy={foot.y} r="6" fill="none" stroke="#94a3b8" stroke-width="1.5" />
		<text
			x={foot.x + normal.x * 22}
			y={foot.y + normal.y * 22 + 5}
			text-anchor="middle"
			class="mono">t = {fmt(t)}</text
		>
	{/if}
	<line
		x1={P.x}
		y1={P.y}
		x2={Q.x}
		y2={Q.y}
		stroke="#f1f5f9"
		stroke-width="2"
		stroke-dasharray="6 5"
	/>
	<Dot x={Q.x} y={Q.y} r={6} color="#f1f5f9" />
	<text
		x={Q.x + normal.x * 24}
		y={Q.y + normal.y * 24 + 6}
		text-anchor="middle"
		class="math"
		fill="#f1f5f9">Q</text
	>

	{#each handles as handle (handle.name)}
		<g
			class="handle"
			tabindex="0"
			role="button"
			aria-label="Point {handle.name}; drag or use the arrow keys"
			{@attach draggable(handle.get, (q) => handle.set(snap(within(q, W, H, U))), U)}
		>
			<circle cx={handle.get().x} cy={handle.get().y} r="20" fill="transparent" />
			<Dot x={handle.get().x} y={handle.get().y} color={handle.color} />
			<text x={handle.get().x + 12} y={handle.get().y - 12} class="math" fill={handle.color}
				>{handle.name}</text
			>
		</g>
	{/each}
</Stage>
